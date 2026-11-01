import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Category,
  AccountWallet,
  MonthlyReportData,
  CategoryBreakdown,
  TransactionType,
} from '../types/finance';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_ACCOUNTS,
  getInitialSampleTransactions,
} from '../data/defaultData';
import { api, SUPABASE_PROJECT_NAME, SUPABASE_ORG, SUPABASE_PROJECT_ID } from '../lib/supabase';

export interface FinanceContextType {
  isSupabaseActive: boolean;
  supabaseInfo: {
    project: string;
    org: string;
    projectId: string;
    connected: boolean;
  };
  syncWithSupabase: () => Promise<void>;
  transactions: Transaction[];
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  accounts: AccountWallet[];
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
  resetToDefaultData: () => Promise<void>;
  importBackupData: (jsonStr: string) => Promise<boolean>;
  exportBackupData: () => string;
  getMonthlyReport: (month: number, year: number) => MonthlyReportData;
  activeReport: MonthlyReportData;

  // Role Access & PIN Management
  isAdmin: boolean;
  adminPin: string;
  unlockAdmin: (pin: string) => { success: boolean; message?: string };
  lockToUserMode: () => void;
  updateAdminPin: (oldPin: string, newPin: string) => Promise<{ success: boolean; message?: string }>;
  pinModalOpen: boolean;
  pinModalReason: string;
  openPinModal: (reason?: string) => void;
  closePinModal: () => void;
  pinSettingsModalOpen: boolean;
  openPinSettingsModal: () => void;
  closePinSettingsModal: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_TX = 'bukukas_transactions_v2';
const STORAGE_KEY_CAT = 'bukukas_categories_v2';
const STORAGE_KEY_ACC = 'bukukas_accounts_v2';
const STORAGE_KEY_PIN = 'bukukas_admin_pin';
const STORAGE_KEY_ADMIN_ACTIVE = 'bukukas_admin_active';

// Master Super User PIN: Always grants full admin access
const SUPER_USER_PIN = '151219';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());

  // Supabase connection state
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(true);
  const [supabaseInfo, setSupabaseInfo] = useState({
    project: SUPABASE_PROJECT_NAME,
    org: SUPABASE_ORG,
    projectId: SUPABASE_PROJECT_ID,
    connected: true,
  });

  // Admin Mode & PIN States
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_ADMIN_ACTIVE) === 'true';
    } catch {
      return false;
    }
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PIN) || '123456';
    } catch {
      return '123456';
    }
  });

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalReason, setPinModalReason] = useState('Masukkan PIN Admin untuk mendapatkan akses penuh.');
  const [pinSettingsModalOpen, setPinSettingsModalOpen] = useState(false);

  const openPinModal = (reason?: string) => {
    if (reason) setPinModalReason(reason);
    setPinModalOpen(true);
  };

  const closePinModal = () => {
    setPinModalOpen(false);
  };

  const openPinSettingsModal = () => {
    setPinSettingsModalOpen(true);
  };

  const closePinSettingsModal = () => {
    setPinSettingsModalOpen(false);
  };

  const unlockAdmin = (inputPin: string) => {
    const clean = inputPin.trim();
    // Validate either master super user PIN or configured admin PIN
    if (clean === SUPER_USER_PIN || clean === adminPin) {
      setIsAdmin(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_ADMIN_ACTIVE, 'true');
      } catch {}
      return { success: true };
    }
    return { success: false, message: 'PIN yang Anda masukkan salah. Silakan coba lagi.' };
  };

  const lockToUserMode = () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_ACTIVE);
    } catch {}
  };

  const updateAdminPin = async (
    oldPin: string,
    newPin: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanOld = oldPin.trim();
    const cleanNew = newPin.trim();

    // Verify current PIN or Super User PIN
    if (cleanOld !== SUPER_USER_PIN && cleanOld !== adminPin) {
      return { success: false, message: 'PIN lama yang Anda masukkan tidak sesuai.' };
    }

    if (!/^\d{4,8}$/.test(cleanNew)) {
      return { success: false, message: 'PIN baru harus terdiri dari 4 sampai 8 digit angka.' };
    }

    setAdminPin(cleanNew);
    try {
      localStorage.setItem(STORAGE_KEY_PIN, cleanNew);
    } catch {}

    // Persist to Supabase Database
    try {
      await api.setAdminPin(cleanNew);
    } catch (err) {
      console.warn('Sync adminPin to Supabase warning', err);
    }

    return { success: true, message: 'PIN Admin berhasil disimpan ke Supabase Database!' };
  };

  // Local state fallbacks / cache
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CAT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse categories from storage', e);
    }
    return [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
  });

  const [accounts, setAccounts] = useState<AccountWallet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACC);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse accounts from storage', e);
    }
    return DEFAULT_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse transactions from storage', e);
    }
    return getInitialSampleTransactions();
  });

  // Function to load and sync data with Supabase backend
  const syncWithSupabase = useCallback(async () => {
    try {
      const data = await api.bootstrap();
      if (data.success) {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          setAccounts(data.accounts);
        }
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
        if (data.adminPin) {
          setAdminPin(data.adminPin);
          localStorage.setItem(STORAGE_KEY_PIN, data.adminPin);
        }
        setIsSupabaseActive(true);
        setSupabaseInfo((prev) => ({ ...prev, connected: true }));
      }
    } catch (err) {
      console.warn('Supabase sync offline or initializing:', err);
      setIsSupabaseActive(false);
      setSupabaseInfo((prev) => ({ ...prev, connected: false }));
    }
  }, []);

  // Initial load from Supabase on mount
  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Save to local storage cache for offline use
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEY_CAT, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEY_ACC, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Storage sync warn', e);
    }
  }, [transactions, categories, accounts]);

  // Derived category lists
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'pemasukan'),
    [categories]
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'pengeluaran'),
    [categories]
  );

  // Add transaction (Guarded for Admin mode)
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mencatat uang masuk atau uang keluar.');
      return;
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      ...data,
      id: txId,
      createdAt: Date.now(),
    };

    // Optimistic update
    setTransactions((prev) => [newTx, ...prev]);

    // Persist to Supabase Database
    try {
      await api.createTransaction(newTx);
    } catch (err) {
      console.error('Failed to save transaction to Supabase:', err);
    }
  };

  // Update transaction (Guarded for Admin mode)
  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mengedit data transaksi kas.');
      return;
    }

    // Optimistic update
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );

    // Persist to Supabase Database
    try {
      await api.updateTransaction(id, data);
    } catch (err) {
      console.error('Failed to update transaction in Supabase:', err);
    }
  };

  // Delete transaction (Guarded for Admin mode)
  const deleteTransaction = async (id: string) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menghapus transaksi kas.');
      return;
    }

    // Optimistic update
    setTransactions((prev) => prev.filter((item) => item.id !== id));

    // Persist to Supabase Database
    try {
      await api.deleteTransaction(id);
    } catch (err) {
      console.error('Failed to delete transaction from Supabase:', err);
    }
  };

  // Add category (Guarded for Admin mode)
  const addCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menambah kategori baru.');
      throw new Error('Hanya Admin yang dapat menambah kategori.');
    }

    const catId = `cat_${data.type.slice(0, 3)}_${Date.now()}`;
    const newCat: Category = {
      ...data,
      id: catId,
      isCustom: true,
    };

    setCategories((prev) => [...prev, newCat]);

    // Persist to Supabase Database
    try {
      await api.createCategory(newCat);
    } catch (err) {
      console.error('Failed to save category to Supabase:', err);
    }

    return newCat;
  };

  // Update category (Guarded for Admin mode)
  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mengubah kategori.');
      return;
    }

    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...data } : cat))
    );

    // Persist to Supabase Database
    try {
      await api.updateCategory(id, data);
    } catch (err) {
      console.error('Failed to update category in Supabase:', err);
    }
  };

  // Delete category (Guarded for Admin mode)
  const deleteCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menghapus kategori.');
      return { success: false, message: 'Hanya Admin yang dapat menghapus kategori.' };
    }

    const count = transactions.filter((t) => t.categoryId === id).length;
    if (count > 0) {
      return {
        success: false,
        message: `Kategori ini sedang digunakan oleh ${count} transaksi kas. Harap ubah kategori transaksi tersebut terlebih dahulu sebelum menghapus.`,
      };
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== id));

    // Delete in Supabase Database
    try {
      const res = await api.deleteCategory(id);
      if (!res.success) {
        return res;
      }
    } catch (err) {
      console.error('Failed to delete category in Supabase:', err);
    }

    return { success: true };
  };

  // Reset to default (Guarded for Admin mode)
  const resetToDefaultData = async () => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mereset data kas.');
      return;
    }

    const defaultCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    const defaultTxs = getInitialSampleTransactions();

    setCategories(defaultCats);
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions(defaultTxs);

    // Reset in Supabase Database
    try {
      await api.resetDatabase();
    } catch (err) {
      console.error('Failed to reset Supabase database:', err);
    }

    localStorage.removeItem(STORAGE_KEY_TX);
    localStorage.removeItem(STORAGE_KEY_CAT);
    localStorage.removeItem(STORAGE_KEY_ACC);
  };

  // Export JSON backup (Allowed in both modes for auditing)
  const exportBackupData = (): string => {
    const payload = {
      version: 2,
      appName: 'BukuKas Pro',
      database: 'Supabase',
      supabaseProject: SUPABASE_PROJECT_NAME,
      exportDate: new Date().toISOString(),
      categories,
      accounts,
      transactions,
    };
    return JSON.stringify(payload, null, 2);
  };

  // Import JSON backup (Guarded for Admin mode)
  const importBackupData = async (jsonStr: string): Promise<boolean> => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk memulihkan cadangan data.');
      return false;
    }

    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.categories) && Array.isArray(data.transactions)) {
        setCategories(data.categories);
        setTransactions(data.transactions);
        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }

        // Import into Supabase Database
        try {
          await api.importData({
            categories: data.categories,
            accounts: data.accounts,
            transactions: data.transactions,
          });
        } catch (err) {
          console.error('Failed to import into Supabase:', err);
        }

        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to parse backup JSON', e);
      return false;
    }
  };

  // Compute monthly report
  const getMonthlyReport = (targetMonth: number, targetYear: number): MonthlyReportData => {
    const monthStr = String(targetMonth).padStart(2, '0');
    const prefix = `${targetYear}-${monthStr}`;

    const monthTransactions = transactions.filter((tx) => tx.date.startsWith(prefix));

    let totalIncome = 0;
    let totalExpense = 0;

    const incomeMap = new Map<string, { total: number; count: number }>();
    const expenseMap = new Map<string, { total: number; count: number }>();

    monthTransactions.forEach((tx) => {
      if (tx.type === 'pemasukan') {
        totalIncome += tx.amount;
        const cur = incomeMap.get(tx.categoryId) || { total: 0, count: 0 };
        incomeMap.set(tx.categoryId, {
          total: cur.total + tx.amount,
          count: cur.count + 1,
        });
      } else {
        totalExpense += tx.amount;
        const cur = expenseMap.get(tx.categoryId) || { total: 0, count: 0 };
        expenseMap.set(tx.categoryId, {
          total: cur.total + tx.amount,
          count: cur.count + 1,
        });
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    const catMap = new Map(categories.map((c) => [c.id, c]));

    const incomeBreakdown: CategoryBreakdown[] = Array.from(incomeMap.entries())
      .map(([catId, stat]) => {
        const cat = catMap.get(catId) || {
          id: catId,
          name: 'Pemasukan Lainnya',
          type: 'pemasukan' as TransactionType,
          icon: 'DollarSign',
          color: '#10b981',
        };
        return {
          category: cat,
          totalAmount: stat.total,
          transactionCount: stat.count,
          percentage: totalIncome > 0 ? (stat.total / totalIncome) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const expenseBreakdown: CategoryBreakdown[] = Array.from(expenseMap.entries())
      .map(([catId, stat]) => {
        const cat = catMap.get(catId) || {
          id: catId,
          name: 'Pengeluaran Lainnya',
          type: 'pengeluaran' as TransactionType,
          icon: 'Tag',
          color: '#ef4444',
        };
        return {
          category: cat,
          totalAmount: stat.total,
          transactionCount: stat.count,
          percentage: totalExpense > 0 ? (stat.total / totalExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      month: targetMonth,
      year: targetYear,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      incomeBreakdown,
      expenseBreakdown,
      transactions: monthTransactions,
    };
  };

  const activeReport = useMemo(() => {
    return getMonthlyReport(currentMonth, currentYear);
  }, [transactions, categories, currentMonth, currentYear]);

  return (
    <FinanceContext.Provider
      value={{
        isSupabaseActive,
        supabaseInfo,
        syncWithSupabase,
        transactions,
        categories,
        incomeCategories,
        expenseCategories,
        accounts,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        resetToDefaultData,
        importBackupData,
        exportBackupData,
        getMonthlyReport,
        activeReport,

        // Role & PIN
        isAdmin,
        adminPin,
        unlockAdmin,
        lockToUserMode,
        updateAdminPin,
        pinModalOpen,
        pinModalReason,
        openPinModal,
        closePinModal,
        pinSettingsModalOpen,
        openPinSettingsModal,
        closePinSettingsModal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

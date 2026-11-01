import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType, loginWithGoogle, logoutUser, LoginResult } from '../firebase/config';
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

interface FinanceContextType {
  user: User | null;
  authLoading: boolean;
  isFirebaseActive: boolean;
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
  signInWithGoogle: () => Promise<LoginResult>;
  signOut: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_TX = 'bukukas_transactions_v2';
const STORAGE_KEY_CAT = 'bukukas_categories_v2';
const STORAGE_KEY_ACC = 'bukukas_accounts_v2';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

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

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Save to local storage cache for offline / guest use
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEY_CAT, JSON.stringify(categories));
      localStorage.setItem(STORAGE_KEY_ACC, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Storage sync warn', e);
    }
  }, [transactions, categories, accounts]);

  // Real-time Firestore sync when user is authenticated
  useEffect(() => {
    if (!user) return;

    // 1. Transactions subscription
    const txQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubTx = onSnapshot(
      txQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Transaction);
          });
          setTransactions(list);
        } else {
          // If Firestore is empty for this new user, seed initial sample data to Firestore
          const initialData = getInitialSampleTransactions().map((t) => ({
            ...t,
            userId: user.uid,
          }));
          initialData.forEach((t) => {
            setDoc(doc(db, 'transactions', t.id), t).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `transactions/${t.id}`)
            );
          });
          setTransactions(initialData);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      }
    );

    // 2. Categories subscription
    const catQuery = query(collection(db, 'categories'), where('userId', '==', user.uid));
    const unsubCat = onSnapshot(
      catQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Category[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Category);
          });
          setCategories(list);
        } else {
          // Seed default categories to Firestore
          const defaultCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES].map((c) => ({
            ...c,
            userId: user.uid,
          }));
          defaultCats.forEach((c) => {
            setDoc(doc(db, 'categories', c.id), c).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `categories/${c.id}`)
            );
          });
          setCategories(defaultCats);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    return () => {
      unsubTx();
      unsubCat();
    };
  }, [user]);

  // Derived category lists
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'pemasukan'),
    [categories]
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'pengeluaran'),
    [categories]
  );

  // Add transaction
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      ...data,
      id: txId,
      userId: user?.uid,
      createdAt: Date.now(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'transactions', txId), {
          ...newTx,
          userId: user.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `transactions/${txId}`);
      }
    }
  };

  // Update transaction
  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'transactions', id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `transactions/${id}`);
      }
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((item) => item.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`);
      }
    }
  };

  // Add category
  const addCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
    const catId = `cat_${data.type.slice(0, 3)}_${Date.now()}`;
    const newCat: Category = {
      ...data,
      id: catId,
      userId: user?.uid,
      isCustom: true,
    };

    setCategories((prev) => [...prev, newCat]);

    if (user) {
      try {
        await setDoc(doc(db, 'categories', catId), {
          ...newCat,
          userId: user.uid,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `categories/${catId}`);
      }
    }
    return newCat;
  };

  // Update category
  const updateCategory = async (id: string, data: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...data } : cat))
    );

    if (user) {
      try {
        await updateDoc(doc(db, 'categories', id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
      }
    }
  };

  // Delete category
  const deleteCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const count = transactions.filter((t) => t.categoryId === id).length;
    if (count > 0) {
      return {
        success: false,
        message: `Kategori ini sedang digunakan oleh ${count} transaksi kas. Harap ubah kategori transaksi tersebut terlebih dahulu sebelum menghapus.`,
      };
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== id));

    if (user) {
      try {
        await deleteDoc(doc(db, 'categories', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
      }
    }
    return { success: true };
  };

  // Reset to default
  const resetToDefaultData = async () => {
    const defaultCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    const defaultTxs = getInitialSampleTransactions();

    setCategories(defaultCats);
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions(defaultTxs);

    if (user) {
      // Overwrite Firestore records for user
      defaultTxs.forEach((t) => {
        setDoc(doc(db, 'transactions', t.id), { ...t, userId: user.uid }).catch(() => {});
      });
      defaultCats.forEach((c) => {
        setDoc(doc(db, 'categories', c.id), { ...c, userId: user.uid }).catch(() => {});
      });
    }

    localStorage.removeItem(STORAGE_KEY_TX);
    localStorage.removeItem(STORAGE_KEY_CAT);
    localStorage.removeItem(STORAGE_KEY_ACC);
  };

  // Export JSON backup
  const exportBackupData = (): string => {
    const payload = {
      version: 2,
      appName: 'BukuKas Pro',
      exportDate: new Date().toISOString(),
      userEmail: user?.email || 'guest',
      categories,
      accounts,
      transactions,
    };
    return JSON.stringify(payload, null, 2);
  };

  // Import JSON backup
  const importBackupData = async (jsonStr: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.categories) && Array.isArray(data.transactions)) {
        setCategories(data.categories);
        setTransactions(data.transactions);
        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }

        if (user) {
          for (const t of data.transactions) {
            await setDoc(doc(db, 'transactions', t.id), { ...t, userId: user.uid });
          }
          for (const c of data.categories) {
            await setDoc(doc(db, 'categories', c.id), { ...c, userId: user.uid });
          }
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to parse backup JSON', e);
      return false;
    }
  };

  // Compute monthly report for any month and year
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
        user,
        authLoading,
        isFirebaseActive: !!user,
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
        signInWithGoogle: loginWithGoogle,
        signOut: logoutUser,
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

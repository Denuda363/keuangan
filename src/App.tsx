import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { TransactionsView } from './components/TransactionsView';
import { CategoryManager } from './components/CategoryManager';
import { TransactionModal } from './components/TransactionModal';
import { CategoryModal } from './components/CategoryModal';
import { BackupModal } from './components/BackupModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminPinSettingsModal } from './components/AdminPinSettingsModal';
import { Transaction, Category, TransactionType } from './types/finance';
import { Lock } from 'lucide-react';
import { OfflineIndicator } from './components/OfflineIndicator';

function MainApp() {
  const {
    isAdmin,
    pinModalOpen,
    closePinModal,
    pinModalReason,
    openPinModal,
    pinSettingsModalOpen,
    closePinSettingsModal,
    openSupabaseModal,
    supabaseInfo,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'transactions' | 'categories'>('dashboard');

  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('pengeluaran');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catModalType, setCatModalType] = useState<TransactionType>('pengeluaran');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  // Open Transaction Modal (Guarded: Mode Pengguna prompts PIN)
  const handleOpenTransactionModal = (type: TransactionType = 'pengeluaran', tx?: Transaction) => {
    if (!isAdmin) {
      openPinModal(
        tx
          ? 'Masukkan PIN Admin untuk mengubah data transaksi kas.'
          : 'Masukkan PIN Admin untuk mencatat transaksi kas baru.'
      );
      return;
    }
    setTxModalType(type);
    setEditingTx(tx || null);
    setTxModalOpen(true);
  };

  // Open Category Modal (Guarded: Mode Pengguna prompts PIN)
  const handleOpenCategoryModal = (type: TransactionType = 'pengeluaran', cat?: Category) => {
    if (!isAdmin) {
      openPinModal(
        cat
          ? 'Masukkan PIN Admin untuk mengubah kategori kas.'
          : 'Masukkan PIN Admin untuk menambah kategori baru.'
      );
      return;
    }
    setCatModalType(type);
    setEditingCat(cat || null);
    setCatModalOpen(true);
  };

  const handleViewReceipt = (tx: Transaction) => {
    setViewingReceiptTx(tx);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
        onOpenBackupModal={() => setBackupModalOpen(true)}
      />

      {/* Main Content Area - Optimized for mobile viewports */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenTransactionModal={handleOpenTransactionModal}
            onNavigateToReports={() => setActiveTab('reports')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToCategories={() => setActiveTab('categories')}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenTransactionModal={handleOpenTransactionModal}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            onOpenCategoryModal={handleOpenCategoryModal}
          />
        )}
      </main>

      {/* Core Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        initialType={txModalType}
        editingTransaction={editingTx}
        onOpenAddCategory={(type) => handleOpenCategoryModal(type)}
      />

      <CategoryModal
        isOpen={catModalOpen}
        onClose={() => {
          setCatModalOpen(false);
          setEditingCat(null);
        }}
        initialType={catModalType}
        editingCategory={editingCat}
      />

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />

      <ReceiptViewerModal
        isOpen={!!viewingReceiptTx}
        transaction={viewingReceiptTx}
        onClose={() => setViewingReceiptTx(null)}
      />

      {/* PIN Verification & Settings Modals */}
      <AdminPinModal
        isOpen={pinModalOpen}
        onClose={closePinModal}
        reason={pinModalReason}
      />

      <AdminPinSettingsModal
        isOpen={pinSettingsModalOpen}
        onClose={closePinSettingsModal}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} BukuKas Pro · Sistem Kas Masuk & Kas Keluar</p>
          <div className="flex items-center gap-3 text-slate-500">
            <button
              onClick={openSupabaseModal}
              className="inline-flex items-center gap-1.5 hover:text-emerald-700 transition-colors cursor-pointer"
              title="Periksa status & uji koneksi Supabase Cloud (Denuda)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Supabase Cloud: {supabaseInfo.project}</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>Mode PIN</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => {
                if (isAdmin) setBackupModalOpen(true);
                else openPinModal('Masukkan PIN Admin untuk mengakses cadangan data.');
              }}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cadangan Data
            </button>
          </div>
        </div>
      </footer>

      {/* Offline connectivity indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}

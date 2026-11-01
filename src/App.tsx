import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { TransactionsView } from './components/TransactionsView';
import { CategoryManager } from './components/CategoryManager';
import { TransactionModal } from './components/TransactionModal';
import { CategoryModal } from './components/CategoryModal';
import { BackupModal } from './components/BackupModal';
import { Transaction, Category, TransactionType } from './types/finance';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'transactions' | 'categories'>('dashboard');

  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('pengeluaran');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catModalType, setCatModalType] = useState<TransactionType>('pengeluaran');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [backupModalOpen, setBackupModalOpen] = useState(false);

  // Open Transaction Modal
  const handleOpenTransactionModal = (type: TransactionType = 'pengeluaran', tx?: Transaction) => {
    setTxModalType(type);
    setEditingTx(tx || null);
    setTxModalOpen(true);
  };

  // Open Category Modal
  const handleOpenCategoryModal = (type: TransactionType = 'pengeluaran', cat?: Category) => {
    setCatModalType(type);
    setEditingCat(cat || null);
    setCatModalOpen(true);
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenTransactionModal={handleOpenTransactionModal}
            onNavigateToReports={() => setActiveTab('reports')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToCategories={() => setActiveTab('categories')}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenTransactionModal={handleOpenTransactionModal}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            onOpenCategoryModal={handleOpenCategoryModal}
          />
        )}
      </main>

      {/* Modals */}
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

      {/* Floating Action Button for Mobile screens (positioned conveniently for thumb) */}
      <div className="md:hidden fixed bottom-18 right-4 z-30">
        <button
          onClick={() => handleOpenTransactionModal('pengeluaran')}
          className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-full shadow-xl hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold cursor-pointer"
          aria-label="Catat Kas Baru"
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            +
          </span>
          <span>Catat Kas</span>
        </button>
      </div>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} BukuKas Pro · Pengelola Kas Masuk & Kas Keluar</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Dukungan Ekspor Excel & PDF</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setBackupModalOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Cadangan Data
            </button>
          </div>
        </div>
      </footer>
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

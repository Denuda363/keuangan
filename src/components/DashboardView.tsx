import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Plus,
  Minus,
  Edit2,
  Trash2,
  ArrowRight,
  CreditCard,
  DollarSign,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatTanggalIndo, formatBulanTahun, NAMA_BULAN_INDONESIA } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Transaction, TransactionType } from '../types/finance';

interface DashboardViewProps {
  onOpenTransactionModal: (type: TransactionType, tx?: Transaction) => void;
  onNavigateToReports: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToCategories: () => void;
  onViewReceipt?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenTransactionModal,
  onNavigateToReports,
  onNavigateToTransactions,
  onNavigateToCategories,
  onViewReceipt,
}) => {
  const {
    transactions,
    categories,
    accounts,
    currentMonth,
    currentYear,
    setCurrentMonth,
    setCurrentYear,
    activeReport,
    deleteTransaction,
    isAdmin,
    openPinModal,
  } = useFinance();

  // Overall Net Balance from all transactions
  const totalAllIncome = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllExpense = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalAllIncome - totalAllExpense;

  // Account balances
  const accountBalances = accounts.map((acc) => {
    const accTx = transactions.filter((t) => t.accountId === acc.id);
    const inc = accTx.filter((t) => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0);
    const exp = accTx.filter((t) => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0);
    return {
      ...acc,
      balance: inc - exp,
      txCount: accTx.length,
    };
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 6);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Last 6 months trend calculation
  const monthsTrend = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const prefix = `${y}-${String(m).padStart(2, '0')}`;
    const mTx = transactions.filter((t) => t.date.startsWith(prefix));
    const inc = mTx.filter((t) => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0);
    const exp = mTx.filter((t) => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0);

    monthsTrend.push({
      label: `${NAMA_BULAN_INDONESIA[m - 1].substring(0, 3)}`,
      fullLabel: `${NAMA_BULAN_INDONESIA[m - 1]} ${y}`,
      income: inc,
      expense: exp,
      net: inc - exp,
    });
  }

  const maxTrendVal = Math.max(
    ...monthsTrend.map((m) => Math.max(m.income, m.expense)),
    1000000
  );

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Top Controls: Quiet Mode Notice (if user) + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs self-start">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Bulan Sebelumnya"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatBulanTahun(currentMonth, currentYear)}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Bulan Berikutnya"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quiet Mode Banner for Read-Only / Pengguna Mode */}
        {!isAdmin ? (
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 text-slate-600">
            <span className="flex items-center gap-1.5 truncate">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Mode Lihat Saja (Pengguna)</span>
            </span>
            <button
              onClick={() => openPinModal('Masukkan PIN Admin untuk mencatat atau mengubah data transaksi.')}
              className="text-xs font-semibold text-slate-900 hover:underline shrink-0 cursor-pointer"
            >
              Buka Akses Admin
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mode Admin Aktif · Akses Penuh</span>
          </div>
        )}
      </div>

      {/* Hero Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Saldo Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Saldo Kas Tersedia</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono mt-2 sm:mt-3 text-white tracking-tight tabular-nums">
              {formatRupiah(totalBalance)}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <span>{transactions.length} total transaksi</span>
              <span aria-hidden="true">·</span>
              <span>{accounts.length} akun kas</span>
            </div>
          </div>

          {/* Quick Dual Actions */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenTransactionModal('pemasukan')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer min-h-[42px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Uang Masuk</span>
                </button>
                <button
                  onClick={() => onOpenTransactionModal('pengeluaran')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer min-h-[42px]"
                >
                  <Minus className="w-4 h-4" />
                  <span>- Uang Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => openPinModal('Masukkan PIN Admin untuk mencatat arus uang masuk atau keluar.')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all cursor-pointer min-h-[42px]"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Buka Akses Admin untuk Mencatat Kas</span>
              </button>
            )}
          </div>
        </div>

        {/* Uang Masuk Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Uang Masuk
              </span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <ArrowDownRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-2 tabular-nums">
              {formatRupiah(activeReport.totalIncome)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeReport.incomeBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)} transaksi di bulan ini
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dominan:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[140px]">
              {activeReport.incomeBreakdown[0]?.category.name || '-'}
            </span>
          </div>
        </div>

        {/* Uang Keluar Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Uang Keluar
              </span>
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-rose-600 mt-2 tabular-nums">
              {formatRupiah(activeReport.totalExpense)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeReport.expenseBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)} pengeluaran di bulan ini
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pengeluaran terbesar:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[140px]">
              {activeReport.expenseBreakdown[0]?.category.name || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Cash Flow Trend & Account Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend Arus Kas 6 Bulan Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tren Arus Kas (6 Bulan Terakhir)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Perbandingan uang masuk vs uang keluar</p>
            </div>
            <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <span className="text-slate-600">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-rose-400 rounded-full" />
                <span className="text-slate-600">Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4 pb-1">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-40 border-b border-slate-100 pb-2">
              {monthsTrend.map((m, idx) => {
                const incHeight = maxTrendVal > 0 ? (m.income / maxTrendVal) * 100 : 0;
                const expHeight = maxTrendVal > 0 ? (m.expense / maxTrendVal) * 100 : 0;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-32">
                      <div
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all"
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                        title={`${m.fullLabel} Masuk: ${formatRupiah(m.income)}`}
                      />
                      <div
                        className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t transition-all"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                        title={`${m.fullLabel} Keluar: ${formatRupiah(m.expense)}`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saldo per Rekening / Dompet */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Rekening & Kas</h3>
              <span className="text-xs text-slate-400">{accounts.length} Akun</span>
            </div>

            <div className="space-y-2">
              {accountBalances.map((acc) => (
                <div
                  key={acc.id}
                  className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
                      {acc.type === 'tunai' ? (
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      ) : acc.type === 'bank' ? (
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">{acc.name}</p>
                      <p className="text-[11px] text-slate-400">{acc.txCount} transaksi</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold font-mono text-slate-800 shrink-0 ml-2 tabular-nums">
                    {formatRupiah(acc.balance)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateToCategories}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-between cursor-pointer"
          >
            <span>Kustomisasi Kategori Kas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transaksi Kas Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Transaksi Kas Terakhir</h3>
            <p className="text-xs text-slate-500 mt-0.5">6 transaksi arus kas paling mutakhir</p>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Belum ada transaksi kas yang dicatat.
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isInc = tx.type === 'pemasukan';
              const cat = categoryMap.get(tx.categoryId);
              const acc = accountMap.get(tx.accountId);

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={16} className="text-white" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {tx.note || cat?.name || 'Transaksi'}
                        </p>
                        {tx.receiptUrl && (
                          <button
                            onClick={() => onViewReceipt && onViewReceipt(tx)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-medium cursor-pointer transition-colors"
                            title="Lihat Bukti Nota"
                          >
                            <FileText className="w-2.5 h-2.5 text-blue-600" />
                            <span>Nota</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 truncate">
                        <span>{formatTanggalIndo(tx.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{cat?.name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-400">{acc?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs sm:text-sm font-semibold tabular-nums ${
                        isInc ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => onOpenTransactionModal(tx.type, tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Ubah Transaksi"
                          aria-label="Ubah"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus transaksi "${tx.note || cat?.name}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Hapus Transaksi"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

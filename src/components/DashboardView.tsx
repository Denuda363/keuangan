import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Edit2,
  Trash2,
  ArrowRight,
  CreditCard,
  DollarSign,
  Smartphone,
  Cloud,
  CheckCircle2,
  FileText,
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
    activeReport,
    deleteTransaction,
    user,
    signInWithGoogle,
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

  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    try {
      const res = await signInWithGoogle();
      if (res && !res.success && res.blocked) {
        alert(res.message);
      }
    } catch {
      // Handled safely without unhandled error
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Cloud Sync Announcement if Guest */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Database Firebase Firestore Aktif
              </p>
              <p className="text-[11px] text-slate-600">
                Data Anda saat ini tersimpan di browser ini. Masuk dengan Google untuk menyinkronkan data secara realtime di PC, Tablet, dan Ponsel.
              </p>
            </div>
          </div>
          <button
            onClick={handleConnectGoogle}
            disabled={isConnecting}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {isConnecting ? 'Menghubungkan...' : 'Hubungkan Google'}
          </button>
        </div>
      )}

      {/* Hero Financial Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Saldo Card */}
        <div className="md:col-span-2 lg:col-span-1 bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Total Saldo Kas Tersedia</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 sm:mt-3 text-white tracking-tight">
              {formatRupiah(totalBalance)}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-2">
              <span className="text-emerald-400 font-medium">
                {transactions.length} total transaksi
              </span>
              <span aria-hidden="true">·</span>
              <span>{accounts.length} akun kas</span>
            </div>
          </div>

          {/* Quick Dual Actions */}
          <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 relative z-10">
            <button
              onClick={() => onOpenTransactionModal('pemasukan')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Uang Masuk</span>
            </button>
            <button
              onClick={() => onOpenTransactionModal('pengeluaran')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer min-h-[44px]"
            >
              <Minus className="w-4 h-4" />
              <span>- Uang Keluar</span>
            </button>
          </div>

          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Uang Masuk Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                Uang Masuk ({formatBulanTahun(currentMonth, currentYear)})
              </span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <ArrowDownRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-2">
              {formatRupiah(activeReport.totalIncome)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeReport.incomeBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)} transaksi tercatat di bulan ini
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Paling dominan:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[140px]">
              {activeReport.incomeBreakdown[0]?.category.name || '-'}
            </span>
          </div>
        </div>

        {/* Uang Keluar Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                Uang Keluar ({formatBulanTahun(currentMonth, currentYear)})
              </span>
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-rose-600 mt-2">
              {formatRupiah(activeReport.totalExpense)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeReport.expenseBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)} pengeluaran di bulan ini
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Pengeluaran terbesar:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[140px]">
              {activeReport.expenseBreakdown[0]?.category.name || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Cash Flow Trend Chart & Account Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Trend Arus Kas 6 Bulan Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tren Arus Kas (6 Bulan Terakhir)
              </h3>
              <p className="text-xs text-slate-500">Perbandingan uang masuk vs uang keluar</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium self-start sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 rounded-xs" />
                <span className="text-slate-600">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-400 rounded-xs" />
                <span className="text-slate-600">Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-40 sm:h-44 border-b border-slate-100 pb-2">
              {monthsTrend.map((m, idx) => {
                const incHeight = maxTrendVal > 0 ? (m.income / maxTrendVal) * 100 : 0;
                const expHeight = maxTrendVal > 0 ? (m.expense / maxTrendVal) * 100 : 0;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-32 sm:h-36">
                      <div
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-xs transition-all duration-300"
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                        title={`${m.fullLabel} Masuk: ${formatRupiah(m.income)}`}
                      />
                      <div
                        className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t-xs transition-all duration-300"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                        title={`${m.fullLabel} Keluar: ${formatRupiah(m.expense)}`}
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saldo per Rekening / Dompet */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm font-bold text-slate-900">Rekening & Kas</h3>
              <span className="text-xs text-slate-500">{accounts.length} Akun</span>
            </div>

            <div className="space-y-2.5">
              {accountBalances.map((acc) => (
                <div
                  key={acc.id}
                  className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
                      {acc.type === 'tunai' ? (
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      ) : acc.type === 'bank' ? (
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{acc.name}</p>
                      <p className="text-[11px] text-slate-400">{acc.txCount} transaksi</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold font-mono text-slate-900 shrink-0 ml-2">
                    {formatRupiah(acc.balance)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateToCategories}
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between cursor-pointer"
          >
            <span>Kustomisasi Kategori Kas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transaksi Kas Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Transaksi Kas Terakhir</h3>
            <p className="text-xs text-slate-500">6 transaksi arus kas paling mutakhir</p>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[36px]"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
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
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={16} className="text-white" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {tx.note || cat?.name || 'Transaksi'}
                        </p>
                        <span
                          className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                            isInc ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isInc ? 'Masuk' : 'Keluar'}
                        </span>
                        {tx.receiptUrl && (
                          <button
                            onClick={() => onViewReceipt && onViewReceipt(tx)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-semibold cursor-pointer transition-colors"
                            title="Lihat Bukti Nota"
                          >
                            <FileText className="w-2.5 h-2.5 text-blue-600" />
                            <span>Nota</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                        <span>{formatTanggalIndo(tx.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600">{cat?.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{acc?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs sm:text-sm font-bold ${
                        isInc ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => onOpenTransactionModal(tx.type, tx)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                        title="Hapus Transaksi"
                        aria-label="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

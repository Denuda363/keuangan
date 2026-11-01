import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Edit2,
  Trash2,
  ArrowUpDown,
  FileText,
  Lock,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Transaction, TransactionType } from '../types/finance';

interface TransactionsViewProps {
  onOpenTransactionModal: (type: TransactionType, tx?: Transaction) => void;
  onViewReceipt?: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenTransactionModal,
  onViewReceipt,
}) => {
  const { transactions, categories, accounts, deleteTransaction, isAdmin } = useFinance();

  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const filteredTransactions = transactions
    .filter((tx) => {
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchCat = categoryFilter === 'all' || tx.categoryId === categoryFilter;
      const matchAcc = accountFilter === 'all' || tx.accountId === accountFilter;

      const catName = categoryMap.get(tx.categoryId)?.name || '';
      const accName = accountMap.get(tx.accountId)?.name || '';
      const query = searchQuery.toLowerCase();

      const matchSearch =
        searchQuery === '' ||
        tx.note?.toLowerCase().includes(query) ||
        tx.recipientOrPayer?.toLowerCase().includes(query) ||
        catName.toLowerCase().includes(query) ||
        accName.toLowerCase().includes(query) ||
        tx.date.includes(query) ||
        tx.amount.toString().includes(query);

      return matchType && matchCat && matchAcc && matchSearch;
    })
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Semua Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh arus kas masuk dan uang keluar yang tercatat di database.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <button
            onClick={() => onOpenTransactionModal('pemasukan')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
          >
            {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-emerald-200" />}
            <span>{isAdmin ? '+ Uang Masuk' : '+ Masuk (PIN)'}</span>
          </button>
          <button
            onClick={() => onOpenTransactionModal('pengeluaran')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
          >
            {isAdmin ? <Plus className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-rose-200" />}
            <span>{isAdmin ? '- Uang Keluar' : '- Keluar (PIN)'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white cursor-pointer"
          >
            <option value="all">Semua Jenis Transaksi</option>
            <option value="pemasukan">Hanya Uang Masuk</option>
            <option value="pengeluaran">Hanya Uang Keluar</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === 'pemasukan' ? '🟢' : '🔴'} {c.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white cursor-pointer"
          >
            <option value="all">Semua Akun / Rekening</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick summary of filtered data */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-semibold">
              Masuk: {formatRupiah(totalFilteredIncome)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 font-semibold">
              Keluar: {formatRupiah(totalFilteredExpense)}
            </span>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Urutan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View: Clean Card List (< 768px) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada transaksi yang cocok dengan filter yang dipilih.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isInc = tx.type === 'pemasukan';
              const cat = categoryMap.get(tx.categoryId);
              const acc = accountMap.get(tx.accountId);

              return (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={18} className="text-white" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {tx.note || cat?.name || 'Transaksi'}
                        </p>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
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
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
                        <span>{formatTanggalIndo(tx.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600 truncate">{cat?.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{acc?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`font-mono text-xs font-bold ${isInc ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                    </p>
                    {isAdmin && (
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <button
                          onClick={() => onOpenTransactionModal(tx.type, tx)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus transaksi "${tx.note || cat?.name}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                          title="Hapus"
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

        {/* Desktop & Tablet Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Jenis</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Akun</th>
                <th className="py-3 px-4">Catatan / Penerima</th>
                <th className="py-3 px-4 text-center w-16">Nota</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                {isAdmin && <th className="py-3 px-4 text-center w-20">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi yang sesuai kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isInc = tx.type === 'pemasukan';
                  const cat = categoryMap.get(tx.categoryId);
                  const acc = accountMap.get(tx.accountId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-medium">{formatTanggalIndo(tx.date)}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{tx.time || '-'}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                            isInc ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isInc ? (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Uang Masuk</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                              <span>Uang Keluar</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: cat?.color || '#64748b' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} size={11} className="text-white" />
                          </span>
                          <span className="font-medium text-slate-800">
                            {cat?.name || 'Tanpa Kategori'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {acc?.name || 'Kas Tunai'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <div className="font-medium truncate">{tx.note || '-'}</div>
                        {tx.recipientOrPayer && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {isInc ? 'Dari: ' : 'Ke: '}
                            {tx.recipientOrPayer}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => onViewReceipt && onViewReceipt(tx)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                            title="Lihat Bukti Nota Transaksi"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Nota</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isInc ? 'text-emerald-600' : 'text-rose-600'}>
                          {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenTransactionModal(tx.type, tx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus transaksi "${tx.note || cat?.name}"?`)) {
                                  deleteTransaction(tx.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Hapus"
                              aria-label="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

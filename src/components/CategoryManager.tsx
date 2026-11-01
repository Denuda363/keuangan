import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, ArrowDownRight, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Category, TransactionType } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';

interface CategoryManagerProps {
  onOpenCategoryModal: (type: TransactionType, cat?: Category) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onOpenCategoryModal }) => {
  const {
    incomeCategories,
    expenseCategories,
    deleteCategory,
    transactions,
    resetToDefaultData,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TransactionType>('pengeluaran');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = activeTab === 'pemasukan' ? incomeCategories : expenseCategories;

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (cat: Category) => {
    setDeleteError(null);
    const result = await deleteCategory(cat.id);
    if (!result.success) {
      setDeleteError(result.message || 'Gagal menghapus kategori.');
    }
  };

  const getUsageCount = (catId: string) => {
    return transactions.filter((t) => t.categoryId === catId).length;
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Kustomisasi Kategori Kas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur dan kustomisasi pos uang masuk dan uang keluar sesuai operasional Anda.
          </p>
        </div>

        <button
          onClick={() => onOpenCategoryModal(activeTab)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all shrink-0 whitespace-nowrap cursor-pointer min-h-[40px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori {activeTab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}</span>
        </button>
      </div>

      {deleteError && (
        <div className="flex items-center gap-2 p-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        {/* Interactive Segmented Tabs */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => {
              setActiveTab('pengeluaran');
              setDeleteError(null);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'pengeluaran'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Pengeluaran ({expenseCategories.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('pemasukan');
              setDeleteError(null);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer min-h-[38px] ${
              activeTab === 'pemasukan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pemasukan ({incomeCategories.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-900"
          />
        </div>
      </div>

      {/* Category Grid: 1 col on mobile, 2 col on tablet, 3 col on PC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCategories.map((cat) => {
          const usageCount = getUsageCount(cat.id);
          return (
            <div
              key={cat.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-colors shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={20} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span>{usageCount} transaksi</span>
                      {cat.isCustom && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-blue-600 font-medium">Kustom</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onOpenCategoryModal(cat.type, cat)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Ubah Kategori"
                    aria-label={`Ubah ${cat.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title={
                      usageCount > 0
                        ? `Kategori tidak bisa dihapus karena dipakai di ${usageCount} transaksi`
                        : 'Hapus Kategori'
                    }
                    aria-label={`Hapus ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 line-clamp-2">
                  {cat.description}
                </p>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-slate-700">Tidak ada kategori yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">
              Coba kata kunci lain atau tambahkan kategori baru.
            </p>
            <button
              onClick={() => onOpenCategoryModal(activeTab)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 cursor-pointer min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Sekarang</span>
            </button>
          </div>
        )}
      </div>

      {/* Helpful Tip Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-800">Tips Kategori Kas: </span>
          Kategori yang Anda buat langsung tersinkron ke database Firebase dan laporan Excel/PDF.
        </div>
        <button
          onClick={() => {
            if (confirm('Kembalikan semua kategori ke standar default awal?')) {
              resetToDefaultData();
            }
          }}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset ke Kategori Awal</span>
        </button>
      </div>
    </div>
  );
};

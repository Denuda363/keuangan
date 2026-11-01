import React, { useState } from 'react';
import {
  Plus,
  Database,
  Cloud,
  CloudCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  BarChart3,
  ArrowUpDown,
  Tags,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types/finance';

interface NavbarProps {
  activeTab: 'dashboard' | 'reports' | 'transactions' | 'categories';
  setActiveTab: (tab: 'dashboard' | 'reports' | 'transactions' | 'categories') => void;
  onOpenTransactionModal: (type: TransactionType) => void;
  onOpenBackupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTransactionModal,
  onOpenBackupModal,
}) => {
  const { user, signInWithGoogle, signOut } = useFinance();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await signInWithGoogle();
      if (res && !res.success && res.blocked) {
        alert(res.message);
      }
    } catch {
      // User cancelled or closed window - handled cleanly
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      {/* Top Bar for Desktop, Tablet, and Mobile */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 md:gap-8 h-16">
            {/* Zone 1: Brand title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 text-left group focus:outline-hidden"
              >
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:bg-slate-800 transition-colors">
                  BK
                </div>
                <div>
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 block leading-tight">
                    BukuKas Pro
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-400 font-medium leading-none">
                    Keuangan Pribadi & Usaha
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Navigation Links (Desktop & Tablet) */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-600'
                }`}
              >
                Ringkasan Kas
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'reports'
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-600'
                }`}
              >
                Laporan Bulanan & Ekspor
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-600'
                }`}
              >
                Riwayat Transaksi
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'categories'
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-600'
                }`}
              >
                Kustomisasi Kategori
              </button>
            </nav>

            {/* Zone 3: Firebase Auth & Primary Action */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Cloud Sync Status / Google Sign-In */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors text-xs"
                    title="Akun Firebase Terhubung"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover border border-emerald-300"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="hidden lg:inline font-semibold text-emerald-900 max-w-[100px] truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500" title="Cloud Sync Aktif" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {user.displayName || 'Pengguna'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Firestore Cloud Aktif
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onOpenBackupModal();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                      >
                        <Database className="w-3.5 h-3.5 text-slate-500" />
                        <span>Cadangan & Ekspor JSON</span>
                      </button>
                      <button
                        onClick={() => {
                          signOut();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun (Logout)</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Hubungkan Akun Google untuk sinkronisasi cloud antar perangkat"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Sinkron Cloud</span>
                </button>
              )}

              {/* Primary "+ Catat Transaksi" CTA */}
              <button
                onClick={() => onOpenTransactionModal('pengeluaran')}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Catat Transaksi</span>
                <span className="xs:hidden">Catat</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Native-Feel Bottom Navigation Bar for Mobile (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-area-pb shadow-lg">
        <div className="grid grid-cols-4 items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] ${
              activeTab === 'dashboard'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Ringkasan</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] ${
              activeTab === 'reports'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'reports' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] ${
              activeTab === 'transactions'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ArrowUpDown className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Riwayat</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] ${
              activeTab === 'categories'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Tags className={`w-5 h-5 ${activeTab === 'categories' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Kategori</span>
          </button>
        </div>
      </nav>
    </>
  );
};

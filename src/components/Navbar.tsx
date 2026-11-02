import React, { useState } from 'react';
import {
  Plus,
  Database,
  LayoutDashboard,
  BarChart3,
  ArrowUpDown,
  Tags,
  ShieldCheck,
  Lock,
  KeyRound,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  Server,
  FolderArchive,
  Activity,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types/finance';
import { PWAInstallButton } from './PWAInstallButton';
import { api, SupabaseTestResult } from '../lib/supabase';

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
  const {
    isAdmin,
    openPinModal,
    lockToUserMode,
    openPinSettingsModal,
    isSupabaseActive,
    supabaseInfo,
    syncWithSupabase,
    transactions,
    categories,
    supabaseModalOpen,
    openSupabaseModal,
    closeSupabaseModal,
  } = useFinance();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<SupabaseTestResult | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        connected: false,
        message: err.message || 'Koneksi ke database gagal',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCatatKasClick = () => {
    if (!isAdmin) {
      openPinModal('Masukkan PIN Admin untuk mencatat transaksi uang masuk atau uang keluar.');
      return;
    }
    onOpenTransactionModal('pengeluaran');
  };

  return (
    <>
      {/* Top Bar for Desktop, Tablet, and Mobile */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Zone 1: Brand title */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs sm:text-sm tracking-wider shadow-2xs group-hover:bg-slate-800 transition-colors">
                  BK
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">
                      BukuKas
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 leading-none">
                      Pro
                    </span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-slate-400 font-normal mt-0.5">
                    Pengelola Uang Masuk & Keluar
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Navigation Links (Desktop & Tablet) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-600">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Ringkasan
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Laporan & Ekspor
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Riwayat Transaksi
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Kategori
              </button>
            </nav>

            {/* Zone 3: Database Status, Mode PIN & Action Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* PWA Install Button (Desktop & Tablet) */}
              <div className="hidden sm:block">
                <PWAInstallButton variant="navbar" />
              </div>

              {/* Supabase Status: Compact Dot on Mobile, Full Info on Desktop */}
              <button
                onClick={openSupabaseModal}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                  isSupabaseActive
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
                title="Status Database Supabase (Denuda) - Klik untuk rincian"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseActive ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-500'
                  }`}
                />
                <span className="hidden sm:inline text-[11px] font-medium text-slate-500">Supabase:</span>
                <span className="hidden sm:inline font-semibold text-[11px] text-slate-800">{supabaseInfo.project}</span>
              </button>

              {/* Role Indicator / Mode Switcher */}
              <div className="relative">
                {isAdmin ? (
                  // Admin Active Dropdown
                  <div>
                    <button
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/70 transition-all text-xs font-semibold cursor-pointer"
                      title="Mode Admin Aktif (Akses Penuh)"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs">Admin</span>
                      <ChevronDown className="w-3 h-3 text-emerald-600 opacity-70" />
                    </button>

                    {roleDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-900">Hak Akses: Admin</p>
                          <p className="text-[11px] text-emerald-600 font-medium">Akses Penuh (Input & Edit)</p>
                        </div>
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            openPinSettingsModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          <span>Atur PIN Admin</span>
                        </button>
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            onOpenBackupModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
                          <span>Cadangan & Impor JSON</span>
                        </button>
                        <div className="sm:hidden px-1 py-1 border-t border-slate-100">
                          <PWAInstallButton variant="compact" />
                        </div>
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            lockToUserMode();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 border-t border-slate-100 mt-1 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-rose-500" />
                          <span>Kunci ke Mode Pengguna</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Pengguna / Read-Only Mode Switcher
                  <button
                    onClick={() => openPinModal('Masukkan PIN Admin untuk mendapatkan akses penuh mengelola kas.')}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all text-xs font-medium cursor-pointer"
                    title="Klik untuk membuka Mode Admin dengan PIN"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700">PIN</span>
                  </button>
                )}
              </div>

              {/* Primary "+ Catat Transaksi" CTA (Only shown for Admin or desktop) */}
              {isAdmin && (
                <button
                  onClick={handleCatatKasClick}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl shadow-2xs transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[34px] sm:min-h-[38px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Catat Kas</span>
                  <span className="xs:hidden">Catat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Native-Feel Bottom Navigation Bar for Mobile (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-area-pb shadow-lg">
        <div className="grid grid-cols-4 items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
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
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
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
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
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
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
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

      {/* Supabase Database Connection Modal */}
      {supabaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Database Supabase Cloud</h3>
                  <p className="text-[11px] text-slate-500">PostgreSQL Managed Database</p>
                </div>
              </div>
              <button
                onClick={closeSupabaseModal}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Test Connection Result Banner (if run) */}
              {testResult ? (
                testResult.success ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Uji Koneksi Berhasil & Responsif!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-200/60 text-emerald-800">
                      <div>
                        <span className="text-emerald-600">Latensi Database:</span>{' '}
                        <strong>{testResult.dbLatencyMs} ms</strong>
                      </div>
                      <div>
                        <span className="text-emerald-600">REST API:</span>{' '}
                        <strong>{testResult.restApiStatus}</strong>
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-emerald-600">Engine:</span>{' '}
                        <span className="font-mono text-[10px]">{testResult.postgresVersion}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-emerald-200/40 text-[10px] text-emerald-700">
                        ✓ Terverifikasi: {testResult.counts?.transactions} Transaksi · {testResult.counts?.categories} Kategori · {testResult.counts?.accounts} Akun
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Uji Koneksi Gagal</p>
                      <p className="text-[11px] text-rose-600 mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )
              ) : (
                /* Default Status Banner */
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Database Supabase Aktif</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      Terhubung ke PostgreSQL Supabase & REST API dengan kunci otorisasi resmi.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Test Connection Trigger */}
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer min-h-[40px] disabled:opacity-60"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menguji Koneksi Supabase...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-emerald-200" />
                    <span>Uji Tes Koneksi Database Sekarang</span>
                  </>
                )}
              </button>

              {/* Details List */}
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Organization:</span>
                  <span className="font-semibold text-slate-900">{supabaseInfo.org}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Project Name:</span>
                  <span className="font-semibold text-slate-900">{supabaseInfo.project}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Project ID:</span>
                  <span className="font-mono text-[11px] bg-slate-200/70 text-slate-800 px-1.5 py-0.5 rounded">
                    {supabaseInfo.projectId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Data Tersimpan:</span>
                  <span className="font-semibold text-slate-900">
                    {transactions.length} transaksi · {categories.length} kategori
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium shrink-0">REST Endpoint:</span>
                  <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]" title="https://dlrlfvpmpobgeimmzdcw.supabase.co/rest/v1/">
                    https://{supabaseInfo.projectId}.supabase.co/rest/v1/
                  </span>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    try {
                      await syncWithSupabase();
                    } finally {
                      setTimeout(() => setIsSyncing(false), 500);
                    }
                  }}
                  disabled={isSyncing}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      closeSupabaseModal();
                      onOpenBackupModal();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
                  >
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cadangan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

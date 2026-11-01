import * as XLSX from 'xlsx';
import { MonthlyReportData, Category, AccountWallet } from '../types/finance';
import { formatBulanTahun, NAMA_BULAN_INDONESIA } from './formatters';

interface ExportExcelOptions {
  reportData: MonthlyReportData;
  categories: Category[];
  accounts: AccountWallet[];
  appName?: string;
}

export function exportMonthlyReportToExcel({
  reportData,
  categories,
  accounts,
  appName = 'BukuKas Pro',
}: ExportExcelOptions): void {
  const { month, year, totalIncome, totalExpense, netSavings, incomeBreakdown, expenseBreakdown, transactions } = reportData;
  const monthName = NAMA_BULAN_INDONESIA[month - 1] || `${month}`;
  const periodTitle = formatBulanTahun(month, year);

  // 1. Prepare Summary Sheet Data
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const summaryRows: (string | number)[][] = [
    [appName.toUpperCase()],
    ['LAPORAN ARUS KAS BULANAN (UANG MASUK & KELUAR)'],
    ['Periode:', periodTitle],
    ['Tanggal Cetak:', new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })],
    [],
    ['=== RINGKASAN EKSEKUTIF KAS ==='],
    ['Indikator Keuangan', 'Jumlah (Rp)', 'Keterangan'],
    ['Total Uang Masuk (Pemasukan)', totalIncome, 'Total akumulasi uang masuk bulan ini'],
    ['Total Uang Keluar (Pengeluaran)', totalExpense, 'Total akumulasi uang keluar bulan ini'],
    ['Arus Kas Bersih (Surplus / Defisit)', netSavings, netSavings >= 0 ? 'Surplus (Kas Positif)' : 'Defisit (Pengeluaran > Pemasukan)'],
    ['Tingkat Tabungan (Savings Rate)', totalIncome > 0 ? `${((netSavings / totalIncome) * 100).toFixed(1)}%` : '0%', 'Persentase uang yang tersisa'],
    ['Total Frekuensi Transaksi', transactions.length, `${transactions.filter(t => t.type === 'pemasukan').length} Pemasukan, ${transactions.filter(t => t.type === 'pengeluaran').length} Pengeluaran`],
    [],
    ['=== RINCIAN PENGELUARAN PER KATEGORI ==='],
    ['No', 'Nama Kategori', 'Jumlah Pengeluaran (Rp)', 'Porsi (%)', 'Jumlah Transaksi'],
  ];

  if (expenseBreakdown.length === 0) {
    summaryRows.push(['-', 'Tidak ada pengeluaran di periode ini', 0, '0%', 0]);
  } else {
    expenseBreakdown.forEach((item, idx) => {
      summaryRows.push([
        idx + 1,
        item.category.name,
        item.totalAmount,
        `${item.percentage.toFixed(1)}%`,
        item.transactionCount,
      ]);
    });
    summaryRows.push(['', 'TOTAL PENGELUARAN', totalExpense, '100%', expenseBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)]);
  }

  summaryRows.push([]);
  summaryRows.push(['=== RINCIAN PEMASUKAN PER KATEGORI ===']);
  summaryRows.push(['No', 'Nama Kategori', 'Jumlah Pemasukan (Rp)', 'Porsi (%)', 'Jumlah Transaksi']);

  if (incomeBreakdown.length === 0) {
    summaryRows.push(['-', 'Tidak ada pemasukan di periode ini', 0, '0%', 0]);
  } else {
    incomeBreakdown.forEach((item, idx) => {
      summaryRows.push([
        idx + 1,
        item.category.name,
        item.totalAmount,
        `${item.percentage.toFixed(1)}%`,
        item.transactionCount,
      ]);
    });
    summaryRows.push(['', 'TOTAL PEMASUKAN', totalIncome, '100%', incomeBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [
    { wch: 6 },
    { wch: 35 },
    { wch: 25 },
    { wch: 15 },
    { wch: 40 },
  ];

  // 2. Prepare Detailed Transactions Sheet Data
  const transactionRows: (string | number)[][] = [
    [appName.toUpperCase()],
    [`DAFTAR TRANSAKSI KAS - ${periodTitle.toUpperCase()}`],
    [],
    [
      'No',
      'Tanggal',
      'Jam',
      'Tipe Transaksi',
      'Kategori',
      'Akun / Dompet',
      'Pihak Terkait (Payer/Payee)',
      'Keterangan / Catatan',
      'Uang Masuk (Rp)',
      'Uang Keluar (Rp)',
    ],
  ];

  // Sort chronologically
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  sortedTx.forEach((tx, idx) => {
    const cat = categoryMap.get(tx.categoryId);
    const acc = accountMap.get(tx.accountId);
    const isIncome = tx.type === 'pemasukan';

    transactionRows.push([
      idx + 1,
      tx.date,
      tx.time || '-',
      isIncome ? 'Uang Masuk' : 'Uang Keluar',
      cat?.name || 'Tanpa Kategori',
      acc?.name || 'Kas Tunai',
      tx.recipientOrPayer || '-',
      tx.note || '-',
      isIncome ? tx.amount : 0,
      !isIncome ? tx.amount : 0,
    ]);
  });

  // Add Grand Total row
  transactionRows.push([]);
  transactionRows.push([
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    '',
    totalIncome,
    totalExpense,
  ]);
  transactionRows.push([
    '',
    'SALDO BERSIH (NET CASH FLOW)',
    '',
    '',
    '',
    '',
    '',
    '',
    netSavings >= 0 ? netSavings : 0,
    netSavings < 0 ? Math.abs(netSavings) : 0,
  ]);

  const transactionSheet = XLSX.utils.aoa_to_sheet(transactionRows);
  transactionSheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // Tanggal
    { wch: 8 },  // Jam
    { wch: 15 }, // Tipe
    { wch: 26 }, // Kategori
    { wch: 20 }, // Akun
    { wch: 25 }, // Pihak
    { wch: 35 }, // Keterangan
    { wch: 20 }, // Uang Masuk
    { wch: 20 }, // Uang Keluar
  ];

  // 3. Create Workbook and Append Sheets
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Kas');
  XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Rincian Transaksi');

  // 4. Download file
  const fileName = `Laporan_Kas_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

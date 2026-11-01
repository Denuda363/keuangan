# Security Specification: BukuKas Pro (Firestore Rules)

## 1. Data Invariants
- Setiap dokumen `users/{userId}` hanya boleh dibaca dan ditulis oleh pemilik akun (`request.auth.uid == userId`).
- Setiap transaksi kas (`transactions/{transactionId}`) WAJIB memiliki `userId == request.auth.uid`, `amount > 0`, format tanggal valid YYYY-MM-DD, dan `type` bernilai `'pemasukan'` atau `'pengeluaran'`.
- Setiap kategori kustom (`categories/{categoryId}`) WAJIB memiliki `userId == request.auth.uid`, `type` bernilai `'pemasukan'` atau `'pengeluaran'`, dan warna/ikon yang valid.
- Pengguna tidak dapat membaca, mengubah, atau menghapus transaksi milik pengguna lain.
- Query list terhadap `/transactions` harus selalu difilter berdasarkan kepemilikan `userId == request.auth.uid`.

## 2. The "Dirty Dozen" Threat Scenarios
1. **Unauthenticated Read**: Permintaan `read` tanpa token autentikasi harus ditolak (`PERMISSION_DENIED`).
2. **Unauthenticated Write**: Permintaan `create` transaksi tanpa auth harus ditolak.
3. **Impersonated Author**: User A mencoba menulis transaksi dengan `userId = User B`.
4. **Negative or Zero Amount**: User mencoba mengirim `amount = -50000` atau `amount = 0`.
5. **Arbitrary Type**: User mengirim field `type = 'transfer_gelap'` di luar enum `pemasukan` / `pengeluaran`.
6. **Path Traversal / Poisoned ID**: ID dokumen lebih dari 128 karakter atau mengandung karakter berbahaya.
7. **Cross-Tenant Data Leak**: User A mencoba query transaksi milik User B.
8. **Orphaned User Creation**: User mencoba memodifikasi profil user lain di `/users/{otherId}`.
9. **Payload Flooding / Deny of Wallet**: Pengiriman string berukuran lebih dari batas `maxLength` (misal deskripsi > 1000 karakter).
10. **Immutable Owner Tampering**: Upaya mengubah `userId` saat melakukan `update` transaksi.
11. **Shadow Ghost Fields Injection**: Penambahan field tak terdaftar seperti `isAdmin: true` atau `balanceOverride: 999999999`.
12. **Malicious Category Injection**: User A mencoba menghapus atau merusak kategori kustom milik User B.

## 3. Security Rules Matrix
- Global default: Deny-all catch-all.
- `/users/{userId}`: `allow read, write: if isSignedIn() && request.auth.uid == userId`.
- `/transactions/{txId}`:
  - `allow list`: `if isSignedIn() && resource.data.userId == request.auth.uid`
  - `allow get`: `if isSignedIn() && resource.data.userId == request.auth.uid`
  - `allow create`: `if isSignedIn() && incoming().userId == request.auth.uid && isValidTransaction(incoming())`
  - `allow update`: `if isSignedIn() && existing().userId == request.auth.uid && incoming().userId == request.auth.uid && isValidTransaction(incoming())`
  - `allow delete`: `if isSignedIn() && existing().userId == request.auth.uid`
- `/categories/{catId}`:
  - `allow read`: `if isSignedIn() && (resource.data.userId == request.auth.uid || resource.data.userId == 'system')`
  - `allow write`: `if isSignedIn() && (incoming().userId == request.auth.uid || existing().userId == request.auth.uid)`
- `/accounts/{accId}`:
  - `allow read, write`: `if isSignedIn() && (resource.data.userId == request.auth.uid || incoming().userId == request.auth.uid)`

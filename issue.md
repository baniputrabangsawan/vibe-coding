# Implementasi Fitur Login Pengguna (User Login & Sessions)

## Deskripsi Tugas
Tugas ini bertujuan untuk mengimplementasikan fitur autentikasi (login) untuk pengguna. Fitur ini mencakup pembuatan tabel `sessions` untuk mencatat aktivitas login dan pembuatan API endpoint untuk proses autentikasi.

## 1. Skema Database

Buat definisi tabel `sessions`. Gunakan ORM (seperti Drizzle ORM) dengan spesifikasi berikut:

- `id`: integer, auto increment, primary key
- `token`: varchar(255), not null, unique (akan menyimpan UUID/Token session pengguna)
- `user_id`: integer, not null (Foreign Key merujuk ke `id` di tabel `users`)
- `created_at`: timestamp, default current_timestamp

*(Catatan Arsitektur: Tidak perlu menyimpan `password` di dalam tabel `sessions` karena password yang di-hash sudah tersimpan dan divalidasi dari tabel `users`. Menyimpan ulang password di session menyalahi prinsip normalisasi dan praktik keamanan).*

## 2. API Endpoint Login

Buat endpoint REST API untuk proses login pengguna.

- **Method:** `POST`
- **Path:** `/api/users/login`

### Request Body (JSON)

```json
{
  "email" : "bani@localhost",
  "password" : "rahasia"
}
```

### Response Body - Sukses (200 OK)
Jika email ditemukan dan verifikasi password (menggunakan bcrypt) berhasil:

```json
{
  "data" : "token-uuid-atau-random-string-disini"
}
```

### Response Body - Gagal (400 Bad Request / 401 Unauthorized)
Jika email tidak ditemukan atau password tidak cocok:

```json
{
  "error" : "Email atau password salah"
}
```
*(Catatan Keamanan: Gunakan pesan error yang generik seperti di atas agar tidak memberi petunjuk kepada penyerang apakah email yang salah atau password yang salah).*

## 3. Struktur File dan Arsitektur

Lanjutkan arsitektur yang sudah ada pada direktori `src/`:

1. **`src/routes/users-route.ts`**
   - Tambahkan endpoint `POST /login` di dalam prefix `/api/users`.
   - Lakukan validasi request body (`email` dan `password`).
   - Panggil fungsi login dari layer service.
   - Kembalikan response HTTP yang sesuai.

2. **`src/services/users-services.ts`**
   - Tambahkan logika bisnis login.
   - Ambil data pengguna dari tabel `users` berdasarkan `email`.
   - Verifikasi kecocokan `password` (plaintext) dengan hash yang ada di database menggunakan fungsi verifikasi bawaan (misal `Bun.password.verify`).
   - Jika cocok, buatkan `token` unik (misal menggunakan `crypto.randomUUID()`).
   - Simpan `token` dan `user_id` ke dalam tabel `sessions`.
   - Kembalikan `token` tersebut.

## 4. Tahapan Implementasi (Panduan Pengerjaan)

Ikuti langkah-langkah berikut secara berurutan:

### Langkah 1: Persiapan Skema Database
1. Buka `src/db/schema.ts`.
2. Tambahkan definisi tabel `sessions` dengan relasi `user_id` ke tabel `users`.
3. Pastikan kolom `token` diset UNIQUE agar tidak ada tabrakan session.
4. Jalankan perintah migrasi (misal `drizzle-kit generate` dan `drizzle-kit push`) untuk memperbarui database.

### Langkah 2: Logika Bisnis di Service (`users-services.ts`)
1. Buka file `src/services/users-services.ts`.
2. Buat fungsi baru, misalnya `loginUserService(payload)`.
3. Cari data user di database berdasarkan `payload.email`. Jika tidak ada, lemparkan error `'Email atau password salah'`.
4. Lakukan pengecekan password menggunakan fungsi verifikasi bcrypt. Jika `false`, lemparkan error `'Email atau password salah'`.
5. Hasilkan string token acak (misalnya menggunakan `crypto.randomUUID()`).
6. Insert data baru ke tabel `sessions` berisi `token` dan `user_id` milik pengguna tersebut.
7. Return nilai string `token`.

### Langkah 3: Routing Endpoint (`users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Tambahkan handler `.post('/login', ...)` di bawah routing pendaftaran yang sudah ada.
3. Gunakan TypeBox untuk validasi schema request body memastikan `email` dan `password` bertipe string.
4. Panggil fungsi `loginUserService(body)`.
5. Tangkap error di dalam blok `catch`. Jika pesan error adalah "Email atau password salah", kembalikan HTTP status 401 (Unauthorized) atau 400 (Bad Request) dengan respons JSON `{"error": "Email atau password salah"}`.
6. Jika eksekusi berhasil, kembalikan respons `{"data": token}` dengan HTTP status 200.

### Langkah 4: Pengujian (Testing)
1. Jalankan aplikasi secara lokal.
2. Gunakan HTTP Client (seperti Postman atau cURL) untuk menembak endpoint login.
3. Uji skenario sukses dengan akun yang terdaftar pada implementasi sebelumnya. Pastikan respons mengembalikan token dan tabel `sessions` bertambah datanya.
4. Uji skenario gagal (email salah atau password salah) untuk memastikan respons keamanan berjalan dengan benar.

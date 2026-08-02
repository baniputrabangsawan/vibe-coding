# Vibe Coding Backend

Ini adalah sistem backend yang dibangun menggunakan **Bun**, **Elysia.js**, dan **MySQL** yang mengedepankan performa tinggi, struktur *Type-Safe*, dan validasi ujung ke ujung (*End-to-End Type Safety*).

## 🚀 Teknologi & Library Utama

- **[Bun](https://bun.sh/)**: Runtime JavaScript super cepat sekaligus *Test Runner* bawaan (`bun test`).
- **[Elysia.js](https://elysiajs.com/)**: Framework web minimalis berkinerja tinggi untuk Bun.
- **[Drizzle ORM](https://orm.drizzle.team/)**: ORM *Type-Safe* untuk interaksi database MySQL.
- **mysql2**: Driver koneksi database.
- **TypeBox**: Digunakan di belakang layar oleh Elysia untuk skema validasi (*Schema Validation*).

---

## 📁 Arsitektur Proyek

Aplikasi ini menggunakan pola **Service-Controller Pattern** ringan untuk memisahkan *Routing/Validasi* dari *Business Logic*. Aturan penamaan file menggunakan format `kebab-case`.

```text
vibe-coding/
├── src/
│   ├── index.ts                   # Entry point aplikasi (Inisialisasi Elysia)
│   ├── db/
│   │   ├── index.ts               # Konfigurasi & koneksi Drizzle ORM
│   │   └── schema.ts              # Definisi tabel database
│   ├── routes/
│   │   └── users-route.ts         # Endpoint/Controller untuk entitas Users
│   └── services/
│       └── users-services.ts      # Logika Bisnis (Registrasi, Autentikasi, dll)
├── tests/
│   └── users.test.ts              # File Unit Test
├── .env                           # Konfigurasi variabel lingkungan (Rahasia)
├── drizzle.config.ts              # Konfigurasi migrasi Drizzle
└── package.json                   # Dependensi & skrip eksekusi
```

---

## 🗄️ Skema Database

Aplikasi menggunakan 2 tabel yang berelasi `One-to-Many`:

1. **`users`**
   - `id` (INT, Primary Key, Auto Increment)
   - `name` (VARCHAR 255)
   - `email` (VARCHAR 255, Unique)
   - `password` (VARCHAR 255, Hashed)
   - `createdAt` (TIMESTAMP)

2. **`sessions`**
   - `id` (INT, Primary Key, Auto Increment)
   - `token` (VARCHAR 255, Unique) - Digunakan untuk Bearer Token
   - `userId` (INT, Foreign Key -> `users.id`)
   - `createdAt` (TIMESTAMP)

---

## 🔌 API yang Tersedia

Seluruh API menggunakan awalan `/api/users`.

| Endpoint | Method | Keterangan | Validasi Input | Autentikasi |
| :--- | :---: | :--- | :--- | :---: |
| `/api/users` | `POST` | Mendaftarkan pengguna baru. | `name` (max 255), `email`, `password` (min 6) | ❌ |
| `/api/users/login` | `POST` | Autentikasi dan mereturn Token. | `email`, `password` | ❌ |
| `/api/users/current` | `GET` | Mendapatkan profil pengguna aktif. | - | ✅ Bearer |
| `/api/users/logout` | `DELETE` | Menghapus sesi / Token aktif. | - | ✅ Bearer |

> **Catatan Autentikasi:** Endpoint bertanda ✅ memerlukan header `Authorization: Bearer <token>`. Jika token invalid/kosong, API otomatis menolak dengan status HTTP `401 Unauthorized`.

---

## 🛠️ Cara Setup Project

1. **Pastikan Bun terinstal** di sistem Anda ([Panduan Install Bun](https://bun.sh/)).
2. Install semua *dependencies*:
   ```bash
   bun install
   ```
3. Salin file contoh konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   ```
4. Ubah kredensial `DATABASE_URL` di dalam file `.env` menyesuaikan dengan server MySQL Anda.
5. Dorong skema database ke server MySQL:
   ```bash
   bun run db:push
   ```

---

## 🏃 Cara Menjalankan Aplikasi

Aplikasi dikonfigurasi dengan fitur *Hot-Reload* (otomatis restart jika ada perubahan file).
```bash
bun run dev
```
Secara bawaan, aplikasi akan berjalan di `http://localhost:3000`.

---

## 🧪 Cara Menjalankan Unit Test

Aplikasi sudah dibekali *Unit Test* lengkap untuk seluruh API (Positive & Negative Cases). Test runner akan mengosongkan tabel `sessions` dan `users` sebelum tiap pengujian. Pastikan database yang Anda gunakan saat menjalankan ini adalah database testing.

```bash
bun test
```
Ini akan mengeksekusi semua file yang ada di dalam folder `tests/` secara paralel.

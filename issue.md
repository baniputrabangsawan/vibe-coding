# Implementasi Fitur Get Current User (Profil Pengguna Login)

## Deskripsi Tugas
Tugas ini bertujuan untuk mengimplementasikan API endpoint `GET /api/users/current` untuk mengambil informasi profil pengguna yang sedang login berdasarkan token autentikasi yang dikirimkan pada HTTP Header.

## 1. Skema Database

Tabel `users` dan `sessions` sudah tersedia dari fitur sebelumnya:
- **Tabel `users`**: Menyimpan data pengguna (`id`, `name`, `email`, `password`, `created_at`).
- **Tabel `sessions`**: Menyimpan token sesi yang aktif (`id`, `token`, `user_id`, `created_at`).

*(Catatan Arsitektur: Token yang dikirimkan pada header `Authorization` akan dicocokkan dengan kolom `token` pada tabel `sessions` untuk mendapatkan data pengguna terkait).*

## 2. API Endpoint Get Current User

Buat endpoint REST API untuk mengambil data profil pengguna.

- **Method:** `GET`
- **Path:** `/api/users/current`

### Request Headers
Header wajib menyertakan token autentikasi dengan skema `Bearer`:

```http
Authorization: Bearer <token-session-uuid>
```

### Response Body - Sukses (200 OK)
Jika token valid dan ditemukan di tabel `sessions`:

```json
{
  "data" : {
    "id" : 1,
    "name": "bani",
    "email": "bani@localhost",
    "created_at": "2026-08-02T12:00:00.000Z"
  }
}
```

**Catatan Keamanan Penting:**
- **JANGAN PERNAH** mengembalikan kolom `password` dalam respons API demi keamanan.

### Response Body - Gagal (401 Unauthorized)
Jika header `Authorization` tidak ada, format token salah (tidak diawali `Bearer `), atau token tidak ditemukan di tabel `sessions`:

```json
{
  "error" : "Unauthorized"
}
```

## 3. Struktur File dan Arsitektur

Lanjutkan arsitektur yang ada pada direktori `src/`:

1. **`src/routes/users-route.ts`**
   - Tambahkan endpoint `GET /current` di dalam prefix `/api/users`.
   - Ambil header `authorization` dari request.
   - Panggil fungsi service `getCurrentUserService(token)`.
   - Kembalikan response HTTP 200 (sukses) atau 401 (Unauthorized jika gagal).

2. **`src/services/users-services.ts`**
   - Buat fungsi `getCurrentUserService(token)`.
   - Lakukan JOIN atau query relasi antara tabel `sessions` dan `users` berdasarkan `sessions.token`.
   - Jika token tidak ditemukan, lemparkan error `'Unauthorized'`.
   - Kembalikan data profil user tanpa menyertakan kolom `password`.

## 4. Tahapan Implementasi (Panduan Pengerjaan)

Ikuti langkah-langkah berikut secara berurutan:

### Langkah 1: Implementasi Service (`users-services.ts`)
1. Buka file `src/services/users-services.ts`.
2. Buat fungsi baru `getCurrentUserService(token: string)`.
3. Lakukan query pencarian ke database:
   - Cari data di tabel `sessions` yang cocok dengan `token`.
   - Dapatkan data `users` yang berelasi dengan `sessions.user_id`.
   - *Alternatif Drizzle query*:
     ```ts
     const [sessionWithUser] = await db
       .select({
         id: users.id,
         name: users.name,
         email: users.email,
         createdAt: users.createdAt,
       })
       .from(sessions)
       .innerJoin(users, eq(sessions.userId, users.id))
       .where(eq(sessions.token, token))
       .limit(1);
     ```
4. Jika hasil query kosong/tidak ditemukan, lemparkan error `'Unauthorized'`.
5. Kembalikan objek `{ data: sessionWithUser }`.

### Langkah 2: Implementasi Route (`users-route.ts`)
1. Buka file `src/routes/users-route.ts`.
2. Tambahkan handler `.get('/current', ...)` di bawah rute login.
3. Di dalam handler, ekstrak header `authorization` dari konteks request (`headers.authorization` atau `headers['authorization']`).
4. **Parsing Token Bearer**:
   - Cek apakah header `authorization` ada dan diawali dengan `"Bearer "`.
   - Potong string untuk mengambil token saja: `const token = authHeader.replace('Bearer ', '').trim();`.
   - Jika header tidak ada atau tidak valid, langsung kembalikan status 401 dengan `{ "error": "Unauthorized" }`.
5. Panggil fungsi `getCurrentUserService(token)`.
6. Tangkap error di dalam blok `catch`. Jika error adalah "Unauthorized", set HTTP status 401 dan kembalikan `{ "error": "Unauthorized" }`.
7. Jika berhasil, kembalikan data respons dengan HTTP status 200.

### Langkah 3: Pengujian (Testing)
1. Jalankan aplikasi secara lokal (`bun run dev`).
2. **Skenario Login**: Lakukan login via `POST /api/users/login` untuk mendapatkan string `token`.
3. **Skenario Sukses**: Kirim request `GET http://localhost:3000/api/users/current` dengan header `Authorization: Bearer <token>`. Pastikan respons mengembalikan data profil pengguna tanpa password.
4. **Skenario Gagal**: Kirim request tanpa header `Authorization` atau dengan token yang salah/asal. Pastikan respons mengembalikan status 401 `{ "error": "Unauthorized" }`.

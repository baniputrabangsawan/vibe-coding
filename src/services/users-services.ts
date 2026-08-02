import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, sessions } from '../db/schema';

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

/**
 * Mendaftarkan pengguna baru ke dalam sistem.
 * Fungsi ini akan mengecek apakah email sudah terdaftar, jika belum, password akan di-hash menggunakan bcrypt
 * lalu data pengguna akan disimpan ke dalam tabel users.
 * 
 * @param payload - Data pengguna baru (name, email, password)
 * @returns Object berisi { data: 'OK' } jika berhasil
 * @throws Error jika email sudah terdaftar
 */
export async function registerUserService(payload: RegisterUserPayload) {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error('Email sudah terdaftar');
  }

  const hashedPassword = await Bun.password.hash(payload.password, {
    algorithm: 'bcrypt',
    cost: 10,
  });

  await db.insert(users).values({
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
  });

  return { data: 'OK' };
}

/**
 * Melakukan autentikasi pengguna dan membuat sesi baru.
 * Fungsi ini akan memverifikasi keberadaan email dan mencocokkan password menggunakan bcrypt.
 * Jika valid, UUID (token) baru akan digenerate dan disimpan ke tabel sessions.
 * 
 * @param payload - Kredensial login pengguna (email, password)
 * @returns Object berisi { data: token } jika berhasil
 * @throws Error jika email atau password salah
 */
export async function loginUserService(payload: LoginUserPayload) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, payload.email))
    .limit(1);

  if (!user) {
    throw new Error('Email atau password salah');
  }

  const isPasswordValid = await Bun.password.verify(
    payload.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error('Email atau password salah');
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { data: token };
}

/**
 * Mengakhiri sesi pengguna (Logout).
 * Fungsi ini akan memvalidasi apakah token sesi ada di database,
 * jika ada, record sesi tersebut akan dihapus secara permanen dari tabel sessions.
 * 
 * @param token - Token sesi (Bearer token) milik pengguna yang sedang login
 * @returns Object berisi { data: 'OK' } jika berhasil
 * @throws Error jika token tidak valid (Unauthorized)
 */
export async function logoutUserService(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw new Error('Unauthorized');
  }

  await db.delete(sessions).where(eq(sessions.token, token));

  return { data: 'OK' };
}

/**
 * Mengambil profil pengguna yang saat ini sedang terautentikasi (login).
 * Fungsi ini akan melakukan INNER JOIN antara tabel sessions dan users
 * untuk mendapatkan data profil (id, name, email, createdAt) berdasarkan token sesi.
 * Data sensitif seperti password otomatis difilter dan tidak dikembalikan.
 * 
 * @param token - Token sesi (Bearer token) milik pengguna
 * @returns Object berisi data profil pengguna
 * @throws Error jika token tidak valid (Unauthorized)
 */
export async function getCurrentUserService(token: string) {
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

  if (!sessionWithUser) {
    throw new Error('Unauthorized');
  }

  return { data: sessionWithUser };
}

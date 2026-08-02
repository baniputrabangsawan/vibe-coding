import { Elysia, t } from 'elysia';
import {
  registerUserService,
  loginUserService,
  logoutUserService,
  getCurrentUserService,
} from '../services/users-services';

export const usersRoute = new Elysia({ prefix: '/api/users' })
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const result = await registerUserService(body);
        return result;
      } catch (error: any) {
        if (error.message === 'Email sudah terdaftar') {
          set.status = 400;
          return { error: 'Email sudah terdaftar' };
        }
        set.status = 500;
        return { error: error.message || 'Internal Server Error' };
      }
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Registrasi Pengguna Baru',
        description: 'Endpoint untuk mendaftarkan akun pengguna baru ke dalam sistem.',
      },
      body: t.Object({
        name: t.String({
          maxLength: 255,
          error: 'Nama maksimal 255 karakter',
          default: 'John Doe',
        }),
        email: t.String({
          format: 'email',
          error: 'Format email tidak valid',
          default: 'john@example.com',
        }),
        password: t.String({
          minLength: 6,
          error: 'Password minimal 6 karakter',
          default: 'password123',
        }),
      }),
      response: {
        200: t.Object(
          {
            data: t.String({ default: 'OK' }),
          },
          { description: 'Registrasi Berhasil' }
        ),
        400: t.Object(
          {
            error: t.String({ default: 'Email sudah terdaftar' }),
          },
          { description: 'Bad Request / Email sudah terdaftar' }
        ),
        500: t.Object(
          {
            error: t.String({ default: 'Internal Server Error' }),
          },
          { description: 'Internal Server Error' }
        ),
      },
    }

  )
  .post(
    '/login',
    async ({ body, set }) => {
      try {
        const result = await loginUserService(body);
        return result;
      } catch (error: any) {
        if (error.message === 'Email atau password salah') {
          set.status = 400;
          return { error: 'Email atau password salah' };
        }
        set.status = 500;
        return { error: error.message || 'Internal Server Error' };
      }
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Login Pengguna',
        description: 'Endpoint untuk autentikasi pengguna dan mereturn token sesi.',
      },
      body: t.Object({
        email: t.String({ default: 'john@example.com' }),
        password: t.String({ default: 'password123' }),
      }),
      response: {
        200: t.Object(
          {
            data: t.String({ default: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' }),
          },
          { description: 'Login Berhasil' }
        ),
        400: t.Object(
          {
            error: t.String({ default: 'Email atau password salah' }),
          },
          { description: 'Bad Request / Kredensial Salah' }
        ),
        500: t.Object(
          {
            error: t.String({ default: 'Internal Server Error' }),
          },
          { description: 'Internal Server Error' }
        ),
      },
    }
  )
  .derive(({ headers, set }) => {
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      set.status = 401;
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    return { token };
  })
  .delete(
    '/logout',
    async ({ token, set }) => {
      try {
        const result = await logoutUserService(token);
        return result;
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        set.status = 500;
        return { error: error.message || 'Internal Server Error' };
      }
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Logout Pengguna',
        description: 'Endpoint untuk menghapus sesi aktif berdasarkan token Bearer.',
      },
      response: {
        200: t.Object(
          {
            data: t.String({ default: 'OK' }),
          },
          { description: 'Logout Berhasil' }
        ),
        401: t.Object(
          {
            error: t.String({ default: 'Unauthorized' }),
          },
          { description: 'Token Tidak Valid / Kosong' }
        ),
        500: t.Object(
          {
            error: t.String({ default: 'Internal Server Error' }),
          },
          { description: 'Internal Server Error' }
        ),
      },
    }
  )
  .get(
    '/current',
    async ({ token, set }) => {
      try {
        const result = await getCurrentUserService(token);
        return result;
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          set.status = 401;
          return { error: 'Unauthorized' };
        }
        set.status = 500;
        return { error: error.message || 'Internal Server Error' };
      }
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Get Profile Pengguna',
        description: 'Endpoint untuk mengambil profil pengguna yang sedang terautentikasi.',
      },
      response: {
        200: t.Object(
          {
            data: t.Object({
              id: t.Number({ default: 1 }),
              name: t.String({ default: 'John Doe' }),
              email: t.String({ default: 'john@example.com' }),
              createdAt: t.Any({ default: '2026-08-02T12:00:00.000Z' }),
            }),
          },
          { description: 'Profil Pengguna Ditemukan' }
        ),
        401: t.Object(
          {
            error: t.String({ default: 'Unauthorized' }),
          },
          { description: 'Token Tidak Valid / Kosong' }
        ),
        500: t.Object(
          {
            error: t.String({ default: 'Internal Server Error' }),
          },
          { description: 'Internal Server Error' }
        ),
      },
    }
  );

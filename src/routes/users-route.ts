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
      body: t.Object({
        name: t.String({
          maxLength: 255,
          error: 'Nama maksimal 255 karakter',
        }),
        email: t.String({
          format: 'email',
          error: 'Format email tidak valid',
        }),
        password: t.String({
          minLength: 6,
          error: 'Password minimal 6 karakter',
        }),
      }),
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
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
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
  .delete('/logout', async ({ token, set }) => {
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
  })
  .get('/current', async ({ token, set }) => {
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
  });

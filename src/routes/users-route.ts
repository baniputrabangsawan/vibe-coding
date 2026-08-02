import { Elysia, t } from 'elysia';
import {
  registerUserService,
  loginUserService,
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
        name: t.String(),
        email: t.String(),
        password: t.String(),
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
  .get('/current', async ({ headers, set }) => {
    try {
      const authHeader = headers['authorization'] || headers['Authorization'];
      if (
        !authHeader ||
        typeof authHeader !== 'string' ||
        !authHeader.startsWith('Bearer ')
      ) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      const token = authHeader.replace('Bearer ', '').trim();
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

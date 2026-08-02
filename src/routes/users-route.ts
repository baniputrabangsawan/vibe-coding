import { Elysia, t } from 'elysia';
import { registerUserService } from '../services/users-services';

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
  );

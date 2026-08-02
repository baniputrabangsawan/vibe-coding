import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { db } from './db';
import { users } from './db/schema';
import { usersRoute } from './routes/users-route';

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Vibe Coding API Documentation',
          version: '1.0.0',
          description:
            'Dokumentasi interaktif untuk seluruh endpoint API aplikasi Vibe Coding.',
        },
        tags: [
          {
            name: 'Users',
            description:
              'Endpoint terkait autentikasi dan manajemen pengguna',
          },
        ],
      },
    })
  )
  .get('/', () => 'Hello from ElysiaJs!')
  .get('/users', async () => {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      return { error: 'Failed to fetch users. Is the database running?' };
    }
  })
  .use(usersRoute)
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

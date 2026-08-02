import { Elysia } from 'elysia';
import { db } from './db';
import { users } from './db/schema';
import { usersRoute } from './routes/users-route';

const app = new Elysia()
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

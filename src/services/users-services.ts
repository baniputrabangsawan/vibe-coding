import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

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

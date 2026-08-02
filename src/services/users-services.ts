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

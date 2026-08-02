import { describe, it, expect, beforeEach } from 'bun:test';
import { usersRoute } from '../src/routes/users-route';
import { db } from '../src/db';
import { users, sessions } from '../src/db/schema';

// Helper function to reset DB tables before each test case
async function resetDb() {
  await db.delete(sessions);
  await db.delete(users);
}

describe('User API Endpoints', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('POST /api/users (Registration)', () => {
    it('should register a new user successfully', async () => {
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ data: 'OK' });
    });

    it('should fail if email is already registered', async () => {
      // First registration
      await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password123',
          }),
        })
      );

      // Duplicate registration
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Duplicate',
            email: 'john@example.com',
            password: 'password456',
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Email sudah terdaftar' });
    });

    it('should fail if name exceeds 255 characters', async () => {
      const longName = 'A'.repeat(256);
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: longName,
            email: 'longname@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/users/login (Login)', () => {
    it('should login successfully with correct credentials', async () => {
      // Register first
      await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123',
          }),
        })
      );

      // Login
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'jane@example.com',
            password: 'password123',
          }),
        })
      );

      expect(response.status).toBe(200);
      const resData = await response.json();
      expect(resData.data).toBeDefined();
      expect(typeof resData.data).toBe('string');
    });

    it('should fail to login with wrong password', async () => {
      await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123',
          }),
        })
      );

      const response = await usersRoute.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'jane@example.com',
            password: 'wrongpassword',
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Email atau password salah' });
    });
  });

  describe('GET /api/users/current (Get Current User)', () => {
    it('should return profile for authenticated user', async () => {
      // Register & Login to get token
      await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Alice Smith',
            email: 'alice@example.com',
            password: 'password123',
          }),
        })
      );

      const loginRes = await usersRoute.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'alice@example.com',
            password: 'password123',
          }),
        })
      );
      const { data: token } = await loginRes.json();

      // Get Current User
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);
      const resData = await response.json();
      expect(resData.data.name).toBe('Alice Smith');
      expect(resData.data.email).toBe('alice@example.com');
      expect(resData.data.password).toBeUndefined();
    });

    it('should return 401 for invalid or missing token', async () => {
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
        })
      );

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/logout (Logout)', () => {
    it('should logout successfully with valid token', async () => {
      // Register & Login
      await usersRoute.handle(
        new Request('http://localhost/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Bob Ross',
            email: 'bob@example.com',
            password: 'password123',
          }),
        })
      );

      const loginRes = await usersRoute.handle(
        new Request('http://localhost/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'bob@example.com',
            password: 'password123',
          }),
        })
      );
      const { data: token } = await loginRes.json();

      // Logout
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(response.status).toBe(200);

      // Verify token is deleted by calling /current again
      const currentRes = await usersRoute.handle(
        new Request('http://localhost/api/users/current', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      expect(currentRes.status).toBe(401);
    });

    it('should return 401 when logging out with invalid token', async () => {
      const response = await usersRoute.handle(
        new Request('http://localhost/api/users/logout', {
          method: 'DELETE',
          headers: { Authorization: 'Bearer invalid-token-123' },
        })
      );

      expect(response.status).toBe(401);
    });
  });
});

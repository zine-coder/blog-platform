const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearDatabase } = require('../../config/test-db');
const User = require('../../models/User');

// Mock environment variables for tests
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRE = '1h';

let app;

// Setup connection to the database
beforeAll(async () => {
  await connectTestDB();
  app = require('../../server');
});

// Clear all test data after each test
afterEach(async () => {
  await clearDatabase();
});

// Disconnect and close connection
afterAll(async () => {
  await disconnectTestDB();
});

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', 'testuser');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not register a user with existing email', async () => {
      // Create a user first
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      });

      // Try to register with the same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should validate registration input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'te', // too short
          email: 'notanemail',
          password: '123' // too short
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123'
      });
      await user.save();
    });

    it('should login a user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('username', 'loginuser');
    });

    it('should not login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth/user', () => {
    let token;

    beforeEach(async () => {
      // Create a test user
      const user = new User({
        username: 'currentuser',
        email: 'current@example.com',
        password: 'password123'
      });
      await user.save();

      // Login to get token
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'current@example.com',
          password: 'password123'
        });

      token = res.body.token;
    });

    it('should get current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('username', 'currentuser');
      expect(res.body.user).toHaveProperty('email', 'current@example.com');
    });

    it('should not allow access without token', async () => {
      const res = await request(app)
        .get('/api/auth/user');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not allow access with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/user')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
}); 
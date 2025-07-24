const mongoose = require('mongoose');
const User = require('../../models/User');
const { connectTestDB, disconnectTestDB, clearDatabase } = require('../../config/test-db');

// Mock environment variables for tests
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRE = '1h';

// Setup connection to the database
beforeAll(async () => {
  await connectTestDB();
});

// Clear all test data after each test
afterEach(async () => {
  await clearDatabase();
});

// Disconnect and close connection
afterAll(async () => {
  await disconnectTestDB();
});

describe('User Model', () => {
  it('should hash the password before saving', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const user = await User.create(userData);
    
    // Password should be hashed and not equal to the original
    expect(user.password).not.toBe(userData.password);
    // Password should be a bcrypt hash (starts with $2b$)
    expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);
  });

  it('should not rehash the password if it has not changed', async () => {
    // Create a user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const originalHash = user.password;

    // Update something other than password
    user.username = 'updateduser';
    await user.save();

    // Password hash should remain the same
    expect(user.password).toBe(originalHash);
  });

  it('should generate a valid JWT token', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const token = user.getSignedJwtToken();
    
    // Token should be a string
    expect(typeof token).toBe('string');
    // Token should be a JWT (three parts separated by dots)
    expect(token.split('.')).toHaveLength(3);
  });

  it('should correctly match a valid password', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const isMatch = await user.matchPassword('password123');
    expect(isMatch).toBe(true);
  });

  it('should not match an invalid password', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const isMatch = await user.matchPassword('wrongpassword');
    expect(isMatch).toBe(false);
  });

  it('should enforce unique username', async () => {
    // Create first user
    await User.create({
      username: 'uniqueuser',
      email: 'unique1@example.com',
      password: 'password123'
    });

    // Try to create another user with the same username
    await expect(
      User.create({
        username: 'uniqueuser',
        email: 'unique2@example.com',
        password: 'password123'
      })
    ).rejects.toThrow();
  });

  it('should enforce unique email', async () => {
    // Create first user
    await User.create({
      username: 'user1',
      email: 'duplicate@example.com',
      password: 'password123'
    });

    // Try to create another user with the same email
    await expect(
      User.create({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password123'
      })
    ).rejects.toThrow();
  });
}); 
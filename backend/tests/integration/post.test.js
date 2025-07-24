const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearDatabase } = require('../../config/test-db');
const User = require('../../models/User');
const Post = require('../../models/Post');

// Mock environment variables for tests
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRE = '1h';

let app;
let token;
let userId;

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

describe('Post API', () => {
  beforeEach(async () => {
    // Create a test user
    const user = new User({
      username: 'postuser',
      email: 'post@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id;

    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'post@example.com',
        password: 'password123'
      });

    token = res.body.token;
  });

  describe('GET /api/posts', () => {
    it('should get all posts', async () => {
      // Create some test posts
      await Post.create([
        {
          title: 'Test Post 1',
          body: 'This is test post 1',
          author: userId
        },
        {
          title: 'Test Post 2',
          body: 'This is test post 2',
          author: userId
        }
      ]);

      const res = await request(app).get('/api/posts');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('posts');
      expect(res.body.posts.length).toEqual(2);
      expect(res.body).toHaveProperty('count', 2);
    });

    it('should support pagination', async () => {
      // Create 15 test posts
      const posts = [];
      for (let i = 1; i <= 15; i++) {
        posts.push({
          title: `Test Post ${i}`,
          body: `This is test post ${i}`,
          author: userId
        });
      }
      await Post.create(posts);

      // Get first page (limit = 10)
      const res1 = await request(app).get('/api/posts?page=1&limit=10');
      expect(res1.statusCode).toEqual(200);
      expect(res1.body.posts.length).toEqual(10);
      expect(res1.body).toHaveProperty('pagination.next.page', 2);

      // Get second page
      const res2 = await request(app).get('/api/posts?page=2&limit=10');
      expect(res2.statusCode).toEqual(200);
      expect(res2.body.posts.length).toEqual(5);
      expect(res2.body).toHaveProperty('pagination.prev.page', 1);
    });

    it('should support search functionality', async () => {
      // Create test posts with different content
      await Post.create([
        {
          title: 'JavaScript Tutorial',
          body: 'Learn JavaScript programming',
          author: userId
        },
        {
          title: 'Python Basics',
          body: 'Introduction to Python',
          author: userId
        },
        {
          title: 'Advanced JavaScript',
          body: 'Advanced topics in JS',
          author: userId
        }
      ]);

      // Search for JavaScript posts
      const res = await request(app).get('/api/posts?search=JavaScript');

      expect(res.statusCode).toEqual(200);
      expect(res.body.posts.length).toEqual(2);
      expect(res.body.posts[0].title).toMatch(/JavaScript/);
      expect(res.body.posts[1].title).toMatch(/JavaScript/);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get a single post by ID', async () => {
      // Create a test post
      const post = await Post.create({
        title: 'Single Post',
        body: 'This is a single test post',
        author: userId
      });

      const res = await request(app).get(`/api/posts/${post._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('post');
      expect(res.body.post).toHaveProperty('title', 'Single Post');
      expect(res.body.post).toHaveProperty('body', 'This is a single test post');
    });

    it('should return 404 for non-existent post ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/posts/${fakeId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post with valid token', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Post',
          body: 'This is a new post created in test'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('post');
      expect(res.body.post).toHaveProperty('title', 'New Post');
      expect(res.body.post).toHaveProperty('body', 'This is a new post created in test');
      expect(res.body.post).toHaveProperty('author', userId.toString());
    });

    it('should not create post without authentication', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          title: 'Unauthorized Post',
          body: 'This should not be created'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should validate post input', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '', // Empty title
          body: 'Missing title'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      // Create a test post
      const post = await Post.create({
        title: 'Post to Update',
        body: 'This post will be updated',
        author: userId
      });
      postId = post._id;
    });

    it('should update a post by owner', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Updated Post',
          body: 'This post has been updated'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('post');
      expect(res.body.post).toHaveProperty('title', 'Updated Post');
      expect(res.body.post).toHaveProperty('body', 'This post has been updated');
    });

    it('should not update post without authentication', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .send({
          title: 'Unauthorized Update',
          body: 'This should not update'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not allow non-owner to update post', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123'
      });

      // Login as another user
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'another@example.com',
          password: 'password123'
        });

      const anotherToken = loginRes.body.token;

      // Try to update the post
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          title: 'Unauthorized Update',
          body: 'This should not update'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      // Create a test post
      const post = await Post.create({
        title: 'Post to Delete',
        body: 'This post will be deleted',
        author: userId
      });
      postId = post._id;
    });

    it('should delete a post by owner', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Post deleted');

      // Verify post is deleted
      const deletedPost = await Post.findById(postId);
      expect(deletedPost).toBeNull();
    });

    it('should not delete post without authentication', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not allow non-owner to delete post', async () => {
      // Create another user
      const anotherUser = await User.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123'
      });

      // Login as another user
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'another@example.com',
          password: 'password123'
        });

      const anotherToken = loginRes.body.token;

      // Try to delete the post
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });
}); 
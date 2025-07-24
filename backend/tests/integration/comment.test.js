const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearDatabase } = require('../../config/test-db');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');

// Mock environment variables for tests
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRE = '1h';

let app;
let token;
let userId;
let postId;

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

describe('Comment API', () => {
  beforeEach(async () => {
    // Create a test user
    const user = new User({
      username: 'commentuser',
      email: 'comment@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id;

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'comment@example.com',
        password: 'password123'
      });

    token = loginRes.body.token;

    // Create a test post
    const post = await Post.create({
      title: 'Test Post for Comments',
      body: 'This post will have comments',
      author: userId
    });
    postId = post._id;
  });

  describe('GET /api/posts/:id/comments', () => {
    it('should get all comments for a post', async () => {
      // Create some test comments
      const comments = await Comment.create([
        {
          postId,
          author: userId,
          body: 'First comment'
        },
        {
          postId,
          author: userId,
          body: 'Second comment'
        }
      ]);

      // Add comments to post
      const post = await Post.findById(postId);
      post.comments = comments.map(comment => comment._id);
      await post.save();

      const res = await request(app).get(`/api/posts/${postId}/comments`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('comments');
      expect(res.body.comments.length).toEqual(2);
      expect(res.body).toHaveProperty('count', 2);
    });

    it('should return 404 for comments on non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/posts/${fakeId}/comments`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should support pagination for comments', async () => {
      // Create 15 test comments
      const comments = [];
      for (let i = 1; i <= 15; i++) {
        comments.push({
          postId,
          author: userId,
          body: `Comment ${i}`
        });
      }
      const createdComments = await Comment.create(comments);

      // Add comments to post
      const post = await Post.findById(postId);
      post.comments = createdComments.map(comment => comment._id);
      await post.save();

      // Get first page (limit = 10)
      const res1 = await request(app).get(`/api/posts/${postId}/comments?page=1&limit=10`);
      expect(res1.statusCode).toEqual(200);
      expect(res1.body.comments.length).toEqual(10);
      expect(res1.body).toHaveProperty('pagination.next.page', 2);

      // Get second page
      const res2 = await request(app).get(`/api/posts/${postId}/comments?page=2&limit=10`);
      expect(res2.statusCode).toEqual(200);
      expect(res2.body.comments.length).toEqual(5);
      expect(res2.body).toHaveProperty('pagination.prev.page', 1);
    });
  });

  describe('POST /api/posts/:id/comments', () => {
    it('should add a comment to a post with valid token', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          body: 'This is a test comment'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('comment');
      expect(res.body.comment).toHaveProperty('body', 'This is a test comment');
      expect(res.body.comment).toHaveProperty('author');
      expect(res.body.comment.author).toHaveProperty('username', 'commentuser');

      // Verify comment was added to post
      const updatedPost = await Post.findById(postId);
      expect(updatedPost.comments.length).toEqual(1);
    });

    it('should not add comment without authentication', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .send({
          body: 'This should not be added'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should validate comment input', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          body: '' // Empty comment
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 404 for commenting on non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/posts/${fakeId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          body: 'Comment on fake post'
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('PUT /api/comments/:id', () => {
    let commentId;

    beforeEach(async () => {
      // Create a test comment
      const comment = await Comment.create({
        postId,
        author: userId,
        body: 'Comment to update'
      });
      commentId = comment._id;

      // Add comment to post
      const post = await Post.findById(postId);
      post.comments.push(commentId);
      await post.save();
    });

    it('should update a comment by owner', async () => {
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          body: 'Updated comment'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('comment');
      expect(res.body.comment).toHaveProperty('body', 'Updated comment');
    });

    it('should not update comment without authentication', async () => {
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .send({
          body: 'Unauthorized update'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not allow non-owner to update comment', async () => {
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

      // Try to update the comment
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          body: 'Unauthorized update'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let commentId;

    beforeEach(async () => {
      // Create a test comment
      const comment = await Comment.create({
        postId,
        author: userId,
        body: 'Comment to delete'
      });
      commentId = comment._id;

      // Add comment to post
      const post = await Post.findById(postId);
      post.comments.push(commentId);
      await post.save();
    });

    it('should delete a comment by owner', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Comment deleted');

      // Verify comment is deleted
      const deletedComment = await Comment.findById(commentId);
      expect(deletedComment).toBeNull();

      // Verify comment was removed from post
      const updatedPost = await Post.findById(postId);
      expect(updatedPost.comments.length).toEqual(0);
    });

    it('should not delete comment without authentication', async () => {
      const res = await request(app)
        .delete(`/api/comments/${commentId}`);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not allow non-owner to delete comment', async () => {
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

      // Try to delete the comment
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('success', false);
    });
  });
}); 
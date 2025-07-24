# Blog Platform Backend

## Introduction

This is the backend API for the Blog Platform, built with Node.js, Express, and MongoDB. It provides a RESTful API for managing blog posts, user authentication, comments, and more.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [API Endpoints](#api-endpoints)
4. [Database Models](#database-models)
5. [Authentication](#authentication)
6. [File Uploads](#file-uploads)
7. [Testing](#testing)
8. [Error Handling](#error-handling)
9. [Environment Variables](#environment-variables)
10. [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone https://github.com/zine-coder/blog-platform.git
cd blog-platform/backend
```

2. Install dependencies
```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=24h
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. Start the development server
```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`.

## Project Structure

```
backend/
├── config/              # Configuration files
│   ├── db.js            # Database connection
│   └── test-db.js       # Test database configuration
├── controllers/         # Request handlers
│   ├── authController.js
│   ├── commentController.js
│   ├── feedController.js
│   ├── notificationController.js
│   ├── postController.js
│   ├── uploadController.js
│   └── userController.js
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication middleware
│   ├── errorHandler.js  # Global error handler
│   └── validation.js    # Request validation
├── models/              # Mongoose models
│   ├── Comment.js
│   ├── HashtagFollow.js
│   ├── Notification.js
│   ├── Post.js
│   ├── User.js
│   └── UserInteraction.js
├── routes/              # API routes
│   ├── api/
│   │   ├── auth.js
│   │   ├── comments.js
│   │   ├── feed.js
│   │   ├── notifications.js
│   │   ├── posts.js
│   │   ├── upload.js
│   │   └── users.js
│   └── index.js
├── tests/               # Test files
│   ├── integration/
│   └── unit/
├── uploads/             # Temporary upload directory
├── utils/               # Utility functions
│   └── swagger.json     # API documentation
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── server.js            # Entry point
```

## API Endpoints

### Authentication

| Method | Endpoint           | Description                | Access  |
|--------|-------------------|----------------------------|---------|
| POST   | /api/auth/register | Register a new user        | Public  |
| POST   | /api/auth/login    | User login                 | Public  |
| GET    | /api/auth/user     | Get current user info      | Private |

### Posts

| Method | Endpoint                | Description                 | Access  |
|--------|------------------------|-----------------------------|---------|
| GET    | /api/posts              | Get all posts (paginated)   | Public  |
| GET    | /api/posts/:id          | Get a single post by ID     | Public  |
| POST   | /api/posts              | Create a new post           | Private |
| PUT    | /api/posts/:id          | Update a post               | Private |
| DELETE | /api/posts/:id          | Delete a post               | Private |
| POST   | /api/posts/:id/like     | Like a post                 | Private |
| DELETE | /api/posts/:id/like     | Unlike a post               | Private |
| POST   | /api/posts/:id/bookmark | Bookmark a post             | Private |
| DELETE | /api/posts/:id/bookmark | Remove bookmark from a post | Private |
| GET    | /api/posts/hashtag/:tag | Get posts by hashtag        | Public  |

### Comments

| Method | Endpoint                | Description               | Access  |
|--------|------------------------|---------------------------|---------|
| GET    | /api/posts/:id/comments | Get comments for a post   | Public  |
| POST   | /api/posts/:id/comments | Add a comment to a post   | Private |
| PUT    | /api/comments/:id       | Update a comment          | Private |
| DELETE | /api/comments/:id       | Delete a comment          | Private |

### Users

| Method | Endpoint                   | Description                  | Access  |
|--------|---------------------------|------------------------------|---------|
| GET    | /api/users/:username       | Get user profile             | Public  |
| GET    | /api/users/:id/posts       | Get posts by user            | Public  |
| PUT    | /api/users/profile         | Update user profile          | Private |
| PUT    | /api/users/profile-image   | Update profile image         | Private |
| PUT    | /api/users/banner-image    | Update banner image          | Private |
| PUT    | /api/users/email           | Update email                 | Private |
| PUT    | /api/users/password        | Update password              | Private |
| DELETE | /api/users/account         | Delete user account          | Private |
| POST   | /api/users/:id/follow      | Follow a user                | Private |
| DELETE | /api/users/:id/follow      | Unfollow a user              | Private |
| GET    | /api/users/:id/followers   | Get user followers           | Public  |
| GET    | /api/users/:id/following   | Get users followed by user   | Public  |
| GET    | /api/users/search          | Search users                 | Public  |
| GET    | /api/users/liked-posts     | Get posts liked by user      | Private |
| GET    | /api/users/bookmarks       | Get posts bookmarked by user | Private |

### Uploads

| Method | Endpoint          | Description           | Access  |
|--------|-----------------|-----------------------|---------|
| POST   | /api/upload      | Upload a single image | Private |
| POST   | /api/upload/multiple | Upload multiple images | Private |

### Feed

| Method | Endpoint                              | Description                    | Access  |
|--------|--------------------------------------|--------------------------------|---------|
| GET    | /api/feed                             | Get personalized feed          | Private |
| GET    | /api/feed/chronological               | Get chronological feed         | Private |
| POST   | /api/feed/interaction                 | Record user interaction        | Private |
| POST   | /api/feed/hashtags/:hashtag/follow    | Follow a hashtag               | Private |
| DELETE | /api/feed/hashtags/:hashtag/follow    | Unfollow a hashtag             | Private |
| GET    | /api/feed/hashtags/following          | Get followed hashtags          | Private |
| PUT    | /api/feed/preferences                 | Update feed preferences        | Private |

### Notifications

| Method | Endpoint                      | Description                  | Access  |
|--------|------------------------------|------------------------------|---------|
| GET    | /api/notifications             | Get user notifications       | Private |
| PUT    | /api/notifications/:id/read    | Mark notification as read    | Private |
| PUT    | /api/notifications/read-all    | Mark all notifications read  | Private |
| GET    | /api/notifications/unread-count | Get unread notification count | Private |

## Database Models

### User Model

```javascript
{
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}
```

### Post Model

```javascript
{
  title: { type: String, required: true },
  body: { type: String },
  content: [{
    text: { type: String, required: true, trim: true },
    image: { type: String, default: null }
  }],
  imageUrl: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hashtags: [{ type: String }]
}
```

### Comment Model

```javascript
{
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

### Notification Model

```javascript
{
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

### HashtagFollow Model

```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hashtag: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

### UserInteraction Model

```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interactionType: { type: String, required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hashtag: { type: String },
  createdAt: { type: Date, default: Date.now }
}
```

## Authentication

The API uses JSON Web Tokens (JWT) for authentication. 

### Login Flow

1. Client sends credentials to `/api/auth/login`
2. Server validates credentials and returns a JWT token
3. Client stores the token (e.g., in localStorage)
4. Client includes the token in the Authorization header for subsequent requests

### Protected Routes

Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The `auth.js` middleware verifies the token and adds the user ID to the request object.

## File Uploads

The API supports file uploads using Multer and Cloudinary.

### Single Image Upload

```javascript
// Example using fetch
const formData = new FormData();
formData.append('image', file);

fetch('http://localhost:5000/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data.imageUrl));
```

### Multiple Image Upload

```javascript
// Example using fetch
const formData = new FormData();
files.forEach(file => {
  formData.append('images', file);
});

fetch('http://localhost:5000/api/upload/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data.imageUrls));
```

## Testing

The project uses Jest for testing.

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

### Writing Tests

Example of a controller test:

```javascript
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });
});
```

## Error Handling

The API uses a global error handler middleware that catches all errors and returns appropriate responses.

```javascript
// Example error response
{
  "success": false,
  "error": "Post not found",
  "statusCode": 404
}
```

Common HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| NODE_ENV | Environment (development, production, test) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT |
| JWT_EXPIRE | JWT expiration time |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| CORS_ORIGINS | Comma-separated list of allowed origins |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request 
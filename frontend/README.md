# Blog Platform Frontend

## Introduction

This is the frontend application for the Blog Platform, built with React, TypeScript, and Tailwind CSS. It provides a modern, responsive user interface for creating, reading, and interacting with blog posts.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Key Features](#key-features)
4. [Components](#components)
5. [Contexts](#contexts)
6. [Services](#services)
7. [Testing](#testing)
8. [Performance Optimizations](#performance-optimizations)
9. [Contributing](#contributing)

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)

### Installation

1. Clone the repository
```bash
git clone https://github.com/zine-coder/blog-platform.git
cd blog-platform/frontend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the frontend directory with the following content:
```
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Project Structure

```
frontend/
├── public/              # Static files
├── src/                 # Source code
│   ├── components/      # Reusable components
│   │   ├── Auth/        # Authentication components
│   │   ├── Layout/      # Layout components
│   │   ├── Posts/       # Post-related components
│   │   ├── Profile/     # Profile-related components
│   │   └── UI/          # UI components
│   ├── contexts/        # React contexts
│   ├── models/          # TypeScript interfaces
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── tests/           # Test files
│   ├── App.tsx          # Main application component
│   ├── index.css        # Global styles
│   └── main.tsx         # Entry point
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Key Features

- **Authentication**: User registration and login with JWT
- **Blog Posts**: Create, read, update, and delete blog posts
- **Rich Content**: Support for structured content with paragraphs and images
- **Comments**: Add and manage comments on posts
- **User Profiles**: View and edit user profiles
- **Search**: Search for posts and users with advanced filters
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Personalized Feed**: Customized content based on user preferences

## Components

### Auth Components

- `LoginForm`: Handles user login
- `RegisterForm`: Handles user registration

### Layout Components

- `Header`: Main navigation header
- `Footer`: Page footer
- `Layout`: Main layout wrapper

### Posts Components

- `PostList`: Displays a list of posts
- `PostCard`: Card component for post previews
- `PostDetail`: Detailed view of a post
- `CreatePost`: Form for creating new posts
- `EditPost`: Form for editing existing posts

### Profile Components

- `ProfileImageUpload`: Handles profile and banner image uploads

### UI Components

- `ConfirmModal`: Reusable confirmation dialog

## Contexts

### AuthContext

Manages authentication state and provides user information throughout the application.

```tsx
// Example usage
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // ...
};
```

### FeedContext

Manages the personalized feed and user preferences.

```tsx
// Example usage
import { useFeed } from '../contexts/FeedContext';

const MyComponent = () => {
  const { feed, refreshFeed, preferences } = useFeed();
  
  // ...
};
```

## Services

### API Service

The `api.ts` file contains all API calls to the backend. It's organized into different sections:

- `authAPI`: Authentication-related endpoints
- `postsAPI`: Post-related endpoints
- `commentsAPI`: Comment-related endpoints
- `userAPI`: User-related endpoints
- `notificationAPI`: Notification-related endpoints
- `uploadAPI`: File upload endpoints
- `feedAPI`: Feed-related endpoints

```tsx
// Example usage
import { postsAPI } from '../services/api';

const fetchPosts = async () => {
  try {
    const response = await postsAPI.getAllPosts(1, 10);
    return response.posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
};
```

## Testing

We use Jest and React Testing Library for testing components and services.

### Running Tests

```bash
npm test
```

### Test Structure

Tests are organized to mirror the structure of the source code:

```
tests/
├── components/      # Component tests
├── contexts/        # Context tests
├── pages/           # Page tests
└── services/        # Service tests
```

### Writing Tests

Example of a component test:

```tsx
import { render, screen } from '@testing-library/react';
import PostCard from '../components/Posts/PostCard';

describe('PostCard', () => {
  test('renders post title', () => {
    const post = {
      _id: '1',
      title: 'Test Post',
      // ...other required props
    };
    
    render(<PostCard post={post} />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });
});
```

## Performance Optimizations

### Lazy Loading

Images are lazy loaded to improve initial page load performance:

```tsx
<img 
  src={imageUrl} 
  alt={alt}
  loading="lazy"
/>
```

### Component Memoization

Components are memoized using React.memo to prevent unnecessary re-renders:

```tsx
export default React.memo(MyComponent);
```

### Pagination

All list views implement pagination to limit the number of items loaded at once:

```tsx
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

// Load data for the current page
useEffect(() => {
  loadData(currentPage);
}, [currentPage]);
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request 
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostDetail from '../../../components/Posts/PostDetail';
import { postsAPI, commentsAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

// Mock the modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '123' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../../services/api', () => ({
  postsAPI: {
    getPost: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    bookmarkPost: jest.fn(),
    unbookmarkPost: jest.fn(),
  },
  commentsAPI: {
    getComments: jest.fn(),
    addComment: jest.fn(),
    deleteComment: jest.fn(),
  },
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('PostDetail Component', () => {
  const mockPost = {
    _id: '123',
    title: 'Test Post Title',
    body: 'This is the test post body content.',
    imageUrl: 'https://example.com/image.jpg',
    hashtags: ['test', 'react', 'jest'],
    author: {
      _id: 'user1',
      username: 'testuser',
      profileImage: 'https://example.com/profile.jpg'
    },
    createdAt: '2023-04-15T10:30:00.000Z',
    likes: 10,
    isLiked: false,
    isBookmarked: false,
    content: [
      {
        text: 'First paragraph of content',
        image: 'https://example.com/paragraph1.jpg'
      },
      {
        text: 'Second paragraph with no image',
        image: null
      }
    ]
  };

  const mockComments = [
    {
      _id: 'comment1',
      body: 'This is a test comment',
      author: {
        _id: 'user2',
        username: 'commenter',
        profileImage: 'https://example.com/commenter.jpg'
      },
      createdAt: '2023-04-16T10:30:00.000Z'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API responses
    (postsAPI.getPost as jest.Mock).mockResolvedValue({ post: mockPost });
    (commentsAPI.getComments as jest.Mock).mockResolvedValue({ 
      comments: mockComments, 
      pages: 1 
    });
    
    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1', username: 'testuser' },
      refreshUser: jest.fn()
    });
  });

  const renderWithRouter = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('renders post title and content', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
      expect(screen.getByText('First paragraph of content')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph with no image')).toBeInTheDocument();
    });
  });

  test('renders post images with lazy loading', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      const mainImage = screen.getByAltText('Test Post Title');
      expect(mainImage).toBeInTheDocument();
      expect(mainImage).toHaveAttribute('loading', 'lazy');
      
      const paragraphImage = screen.getByAltText('Paragraph 1 image');
      expect(paragraphImage).toBeInTheDocument();
      expect(paragraphImage).toHaveAttribute('loading', 'lazy');
    });
  });

  test('renders author information', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByAltText('testuser')).toBeInTheDocument();
    });
  });

  test('renders hashtags', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('react')).toBeInTheDocument();
      expect(screen.getByText('jest')).toBeInTheDocument();
    });
  });

  test('renders comments', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('This is a test comment')).toBeInTheDocument();
      expect(screen.getByText('commenter')).toBeInTheDocument();
    });
  });

  test('handles like button click', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Initial likes count
    });
    
    // Mock the like response
    (postsAPI.likePost as jest.Mock).mockResolvedValue({ likes: 11 });
    
    // Click the like button
    const likeButton = screen.getByText('10').closest('button');
    fireEvent.click(likeButton!);
    
    await waitFor(() => {
      expect(postsAPI.likePost).toHaveBeenCalledWith('123');
    });
  });

  test('handles bookmark button click', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument(); // Initial bookmark state
    });
    
    // Click the bookmark button
    const bookmarkButton = screen.getByText('Save').closest('button');
    fireEvent.click(bookmarkButton!);
    
    await waitFor(() => {
      expect(postsAPI.bookmarkPost).toHaveBeenCalledWith('123');
    });
  });

  test('handles comment submission', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add your comment...')).toBeInTheDocument();
    });
    
    // Type a comment
    const commentInput = screen.getByPlaceholderText('Add your comment...');
    fireEvent.change(commentInput, { target: { value: 'New test comment' } });
    
    // Submit the comment
    const commentForm = commentInput.closest('form');
    fireEvent.submit(commentForm!);
    
    await waitFor(() => {
      expect(commentsAPI.addComment).toHaveBeenCalledWith('123', 'New test comment');
    });
  });

  test('shows edit and delete buttons for own posts', async () => {
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  test('does not show edit and delete buttons for others posts', async () => {
    // Mock a different user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'different-user', username: 'otheruser' },
      refreshUser: jest.fn()
    });
    
    renderWithRouter(<PostDetail />);
    
    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });
}); 
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '../../../components/Posts/PostCard';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('PostCard Component', () => {
  const mockPost = {
    _id: '1',
    title: 'Test Post Title',
    body: 'This is a test post body content that should be long enough to test the excerpt functionality and ensure it works correctly.',
    author: {
      _id: 'user1',
      username: 'testuser',
      profileImage: 'https://example.com/profile.jpg'
    },
    createdAt: '2023-04-15T10:30:00.000Z',
    hashtags: ['test', 'react', 'jest'],
    commentCount: 5
  };

  const renderWithRouter = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('renders post title and excerpt', () => {
    renderWithRouter(<PostCard post={mockPost} />);
    
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText(/This is a test post body content/)).toBeInTheDocument();
  });

  test('renders author information', () => {
    renderWithRouter(<PostCard post={mockPost} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByAltText('testuser')).toBeInTheDocument();
  });

  test('renders date in correct format', () => {
    renderWithRouter(<PostCard post={mockPost} />);
    
    // April 15, 2023 - the exact format may vary based on locale
    expect(screen.getByText(/April 15, 2023/)).toBeInTheDocument();
  });

  test('renders hashtags correctly', () => {
    renderWithRouter(<PostCard post={mockPost} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('jest')).toBeInTheDocument();
  });

  test('renders comment count', () => {
    renderWithRouter(<PostCard post={mockPost} />);
    
    expect(screen.getByText('5 comments')).toBeInTheDocument();
  });

  test('renders image with lazy loading', () => {
    const postWithImage = {
      ...mockPost,
      imageUrl: 'https://example.com/image.jpg'
    };
    
    renderWithRouter(<PostCard post={postWithImage} />);
    
    const image = screen.getByAltText('Test Post Title');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  test('renders placeholder when no image is provided', () => {
    renderWithRouter(<PostCard post={mockPost} />);
    
    // The image container should not be present
    const imageContainers = document.querySelectorAll('.w-full.h-48.overflow-hidden');
    expect(imageContainers.length).toBe(0);
  });

  test('renders placeholder when author has no profile image', () => {
    const postWithoutAuthorImage = {
      ...mockPost,
      author: {
        ...mockPost.author,
        profileImage: undefined
      }
    };
    
    renderWithRouter(<PostCard post={postWithoutAuthorImage} />);
    
    // Should render the User icon instead
    expect(document.querySelector('.text-blue-600')).toBeInTheDocument();
  });

  test('truncates long post body for excerpt', () => {
    const longBodyPost = {
      ...mockPost,
      body: 'A'.repeat(200) // Create a very long body
    };
    
    renderWithRouter(<PostCard post={longBodyPost} />);
    
    const excerpt = screen.getByText(/A+\.\.\./); // Should end with ...
    expect(excerpt).toBeInTheDocument();
    expect(excerpt.textContent?.length).toBeLessThan(200);
  });
}); 
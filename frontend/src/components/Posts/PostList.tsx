import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { postsAPI } from '../../services/api';
import PostCard from './PostCard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Post {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  hashtags?: string[];
  author: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
  comments?: string[];
  commentCount?: number;
  content?: { text: string; image: string | null }[];
}

// Memoized PostCard component to prevent unnecessary re-renders
const MemoizedPostCard = React.memo(PostCard);

// Pagination component extracted for better reusability and memoization
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = React.memo(({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
      >
        <ChevronLeft size={16} />
        <span>Previous</span>
      </button>

      <span className="text-sm text-gray-700 order-first sm:order-none">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
});

const PostList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Memoize the loadPosts function to prevent unnecessary re-renders
  const loadPosts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await postsAPI.getAllPosts(page, 9);
      setPosts(response.posts);
      setTotalPages(response.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading articles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle page change with useCallback to prevent unnecessary re-renders
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadPosts(currentPage);
  }, [currentPage, loadPosts]);

  // Memoize the content based on loading, error, and posts states
  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading articles...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No articles published
          </h3>
          <p className="text-gray-600">
            Be the first to share your ideas!
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <MemoizedPostCard key={post._id} post={post} />
        ))}
      </div>
    );
  }, [loading, error, posts]);

  return (
    <div className="space-y-8">
      {content}

      {!loading && !error && posts.length > 0 && totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={handlePageChange} 
        />
      )}
    </div>
  );
};

export default React.memo(PostList);
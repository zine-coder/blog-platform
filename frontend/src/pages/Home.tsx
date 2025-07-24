import React from 'react';
import PostList from '../components/Posts/PostList';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PenTool, BookOpen } from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-xl sm:rounded-2xl text-white p-6 sm:p-8 md:p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white/10 rounded-full -translate-y-16 translate-x-16 sm:-translate-y-24 sm:translate-x-24 md:-translate-y-32 md:translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 bg-white/5 rounded-full translate-y-12 -translate-x-12 sm:translate-y-18 sm:-translate-x-18 md:translate-y-24 md:-translate-x-24"></div>
        
        <div className="max-w-3xl relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
            Welcome to BlogPlatform
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed">
            Discover exciting articles and share your own ideas with our community.
          </p>
          
          {user ? (
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <PenTool size={18} className="sm:w-5 sm:h-5" />
              <span>Write an Article</span>
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center space-x-2 bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <span>Join the Community</span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center space-x-2 border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-medium hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Articles Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <BookOpen className="text-gray-600" size={24} />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Articles</h2>
        </div>
        
        <PostList />
      </div>
    </div>
  );
};

export default Home;
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { postsAPI, userAPI, searchAPI } from '../services/api';
import PostCard from '../components/Posts/PostCard';
import { ChevronLeft, ChevronRight, Loader2, Search, ArrowLeft, User, FileText } from 'lucide-react';
import { User as UserType } from '../models';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const hashtagFilter = searchParams.get('hashtag') || '';
  const authorFilter = searchParams.get('author') || '';
  const dateFilter = searchParams.get('date') || '';
  const sortBy = searchParams.get('sort') || 'recent';
  
  // Posts state
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [postsCurrentPage, setPostsCurrentPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  
  // Users state
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'articles' | 'users'>(
    searchParams.get('tab') as 'articles' | 'users' || 'articles'
  );

  // Record search when query changes
  useEffect(() => {
    const recordSearchQuery = async () => {
      if (query) {
        try {
          await searchAPI.recordSearch(query);
        } catch (error) {
          console.error('Error recording search:', error);
        }
      }
    };
    
    recordSearchQuery();
  }, [query]);

  // Effect to fetch data when search params change
  useEffect(() => {
    if (query) {
      searchPosts(query, postsCurrentPage);
      searchUsers(query, usersCurrentPage);
    } else if (hashtagFilter) {
      searchPostsByHashtag(hashtagFilter, postsCurrentPage);
      setActiveTab('articles'); // Force articles tab when searching by hashtag
    } else if (authorFilter) {
      searchPostsByAuthor(authorFilter, postsCurrentPage);
      setActiveTab('articles'); // Force articles tab when searching by author
    } else if (dateFilter || sortBy !== 'recent') {
      // If only date filter or sort is specified, show all posts with those filters
      searchPosts('', postsCurrentPage);
      setActiveTab('articles');
    }
  }, [query, hashtagFilter, authorFilter, dateFilter, sortBy, postsCurrentPage, usersCurrentPage]);

  const searchPosts = async (searchQuery: string, page: number) => {
    setPostsLoading(true);
    try {
      // Build search options
      const searchOptions: Record<string, string> = {};
      if (dateFilter) searchOptions.date = dateFilter;
      if (sortBy) searchOptions.sort = sortBy;
      
      // In a real implementation, these options would be passed to the API
      const response = await postsAPI.getAllPosts(page, 5, searchQuery);
      setPosts(response.posts);
      setPostsTotalPages(response.pages || 1);
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Error while searching');
    } finally {
      setPostsLoading(false);
    }
  };
  
  const searchPostsByHashtag = async (hashtag: string, page: number) => {
    setPostsLoading(true);
    try {
      const response = await postsAPI.getPostsByHashtag(hashtag, page, 5);
      setPosts(response.posts);
      setPostsTotalPages(response.pages || 1);
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Error while searching');
    } finally {
      setPostsLoading(false);
    }
  };
  
  const searchPostsByAuthor = async (author: string, page: number) => {
    setPostsLoading(true);
    try {
      // This would be an API call to get posts by author username
      const response = await postsAPI.getAllPosts(page, 5, '');
      setPosts(response.posts);
      setPostsTotalPages(response.pages || 1);
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Error while searching');
    } finally {
      setPostsLoading(false);
    }
  };
  
  const searchUsers = async (searchQuery: string, page: number) => {
    setUsersLoading(true);
    try {
      const response = await userAPI.searchUsers(searchQuery, page, 5);
      setUsers(response.users);
      setUsersTotalPages(response.pages || 1);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Error while searching');
    } finally {
      setUsersLoading(false);
    }
  };
  
  const renderUserCard = (user: UserType) => {
    return (
      <Link 
        to={`/users/${user.username}`}
        key={user.id}
        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 overflow-hidden">
          {user.profileImage ? (
            <img 
              src={user.profileImage} 
              alt={user.username} 
              className="w-full h-full object-cover" 
              loading="lazy"
            />
          ) : (
          <User size={24} className="text-blue-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{user.username}</h3>
          {user.bio && (
            <p className="text-sm text-gray-600 line-clamp-1">{user.bio}</p>
          )}
        </div>
        <div className="text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <FileText size={12} />
            <span>{user.articlesCount || 0} articles</span>
          </div>
        </div>
      </Link>
    );
  };

  const renderLoading = (message: string) => (
    <div className="flex justify-center items-center py-16">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search size={16} className="text-blue-600" />
        </div>
      </div>
      <span className="ml-3 text-gray-600 font-medium">{message}</span>
    </div>
  );

  // Generate search title based on filters
  const getSearchTitle = () => {
    if (query) return `Results for "${query}"`;
    if (hashtagFilter) return `Posts tagged with #${hashtagFilter}`;
    if (authorFilter) return `Posts by ${authorFilter}`;
    return 'Search Results';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 group">
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back to home</span>
        </Link>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Search size={24} className="text-blue-600" />
            {getSearchTitle()}
          </h1>
          {dateFilter && (
            <p className="text-gray-600 mt-1">
              {dateFilter === 'today' && 'Published today'}
              {dateFilter === 'this-week' && 'Published this week'}
              {dateFilter === 'this-month' && 'Published this month'}
              {dateFilter === 'this-year' && 'Published this year'}
            </p>
          )}
          {sortBy && sortBy !== 'recent' && (
            <p className="text-gray-600 mt-1">
              Sorted by: {sortBy === 'relevant' ? 'Relevance' : sortBy === 'popular' ? 'Popularity' : 'Most commented'}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('articles')}
            className={`pb-4 px-1 font-medium text-sm flex items-center ${
              activeTab === 'articles'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} className="mr-2" />
            Articles {posts.length > 0 && `(${posts.length})`}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 font-medium text-sm flex items-center ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={!!hashtagFilter || !!authorFilter}
          >
            <User size={16} className="mr-2" />
            Users {users.length > 0 && `(${users.length})`}
          </button>
        </div>
      </div>

      {/* Articles Tab */}
      {activeTab === 'articles' && (
        <>
          {postsError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {postsError}
            </div>
          )}

          {postsLoading ? (
            renderLoading('Searching articles...')
          ) : posts.length > 0 ? (
            <div className="space-y-8">
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>

              {postsTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                  <button
                    onClick={() => setPostsCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={postsCurrentPage === 1}
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <span className="text-sm text-gray-700 order-first sm:order-none">
                    Page {postsCurrentPage} of {postsTotalPages}
                  </span>

                  <button
                    onClick={() => setPostsCurrentPage(prev => Math.min(prev + 1, postsTotalPages))}
                    disabled={postsCurrentPage === postsTotalPages}
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText size={40} className="text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-3">
                No articles found
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {query && `We couldn't find any articles matching "${query}".`}
                {hashtagFilter && `We couldn't find any articles tagged with #${hashtagFilter}.`}
                {authorFilter && `We couldn't find any articles by ${authorFilter}.`}
                {!query && !hashtagFilter && !authorFilter && "No articles found matching your search criteria."}
                {" Try using different keywords."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {usersError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {usersError}
            </div>
          )}

          {usersLoading ? (
            renderLoading('Searching users...')
          ) : users.length > 0 ? (
            <div className="space-y-8">
              <div className="space-y-3">
                {users.map(user => renderUserCard(user))}
              </div>

              {usersTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                  <button
                    onClick={() => setUsersCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={usersCurrentPage === 1}
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <span className="text-sm text-gray-700 order-first sm:order-none">
                    Page {usersCurrentPage} of {usersTotalPages}
                  </span>

                  <button
                    onClick={() => setUsersCurrentPage(prev => Math.min(prev + 1, usersTotalPages))}
                    disabled={usersCurrentPage === usersTotalPages}
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={40} className="text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-3">
                No users found
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any users matching your search{query ? ` "${query}"` : ''}. Try using different keywords.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(SearchPage); 
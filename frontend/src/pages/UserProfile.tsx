import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userAPI, postsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Edit, Users, FileText, Calendar, Loader2, UserPlus, UserCheck } from 'lucide-react';
import PostCard from '../components/Posts/PostCard';
import { User as UserType } from '../models';

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  
  const [user, setUser] = useState<UserType | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Refresh current user data when component mounts
  useEffect(() => {
    if (currentUser) {
      refreshUser();
    }
  }, []);

  // Load user profile when username changes or when current user refreshes
  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username, currentUser]);

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user, currentPage]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      if (!username) {
        setError('Username is missing');
        setLoading(false);
        return;
      }
      
      const userData = await userAPI.getUserByUsername(username);
      setUser(userData.user);
      
      // Set following state based on API response
      setIsFollowing(userData.user.isFollowing || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    if (!user) return;
    
    setPostsLoading(true);
    try {
      const response = await postsAPI.getUserPosts(user.id, currentPage, 9);
      setUserPosts(response.posts);
      setTotalPages(response.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading articles');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !currentUser) {
      navigate('/login');
      return;
    }
    
    setFollowLoading(true);
    try {
      let response;
      if (isFollowing) {
        // Unfollow action
        response = await userAPI.unfollowUser(user.id);
        
        // Update following state based on API response
        setIsFollowing(response.isFollowing);
        
        // Update user data with new follower count from API response
        setUser({
          ...user,
          followersCount: response.followersCount,
          isFollowing: response.isFollowing
        });
      } else {
        // Follow action
        response = await userAPI.followUser(user.id);
        
        // Update following state based on API response
        setIsFollowing(response.isFollowing);
        
        // Update user data with new follower count from API response
        setUser({
          ...user,
          followersCount: response.followersCount,
          isFollowing: response.isFollowing
        });
      }
      
      // Refresh current user data to update following list
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mr-3" />
        <span className="text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  const isCurrentUser = currentUser && currentUser.id === user.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 group"
        >
          <span className="group-hover:underline">Back</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <span className="font-medium">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className={`${user.bannerImage ? '' : 'bg-gradient-to-r from-blue-600 to-purple-600'} h-32 relative`}>
          {user.bannerImage && (
            <img 
              src={user.bannerImage} 
              alt={`${user.username}'s banner`} 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute -bottom-12 left-8 w-24 h-24 bg-white rounded-full p-1 shadow-md">
            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-blue-600" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              {user.bio && (
                <p className="text-gray-600 mt-2 max-w-lg">{user.bio}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                <Calendar size={14} className="inline mr-1" />
                Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {currentUser && !isCurrentUser && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`mt-4 sm:mt-0 inline-flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                  isFollowing
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${followLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
              >
                {followLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isFollowing ? (
                  <UserCheck size={16} />
                ) : (
                  <UserPlus size={16} />
                )}
                <span>{isFollowing ? 'Following' : 'Follow'}</span>
              </button>
            )}

            {isCurrentUser && (
              <Link
                to="/profile"
                className="mt-4 sm:mt-0 inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                <Edit size={16} />
                <span>Edit Profile</span>
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 border-t border-gray-200 pt-6">
            <div className="text-center">
              <div className="flex items-center">
                <FileText size={18} className="text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">{user.articlesCount || 0}</span>
              </div>
              <span className="text-sm text-gray-600">Articles</span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center">
                <Users size={18} className="text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">{user.followersCount || 0}</span>
              </div>
              <span className="text-sm text-gray-600">Followers</span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center">
                <Users size={18} className="text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">{user.followingCount || 0}</span>
              </div>
              <span className="text-sm text-gray-600">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Articles */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FileText size={20} className="text-blue-600 mr-2" />
          Articles by {user.username}
        </h2>
        
        {postsLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <span className="text-gray-600">Loading articles...</span>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
            <p className="text-gray-600">
              {isCurrentUser ? "You haven't published any articles yet." : `${user.username} hasn't published any articles yet.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPosts.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm bg-gray-100 rounded-md">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 
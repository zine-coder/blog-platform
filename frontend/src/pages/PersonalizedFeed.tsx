import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../contexts/FeedContext';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/Posts/PostCard';
import { 
  Loader2, 
  RefreshCw, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  Hash, 
  Plus, 
  X,
  Settings
} from 'lucide-react';

const PersonalizedFeed: React.FC = () => {
  const { 
    posts, 
    loading, 
    error, 
    currentPage, 
    totalPages, 
    feedType,
    followedHashtags,
    refreshFeed, 
    loadMorePosts, 
    setFeedType,
    followHashtag,
    unfollowHashtag,
    recordInteraction
  } = useFeed();
  
  const { user } = useAuth();
  
  // Record view interactions when posts are loaded
  useEffect(() => {
    if (posts.length > 0 && !loading) {
      // Record view interactions for visible posts
      posts.slice(0, 5).forEach(post => {
        recordInteraction('view', post._id, post.author._id);
        
        // Record hashtag interactions
        if (post.hashtags && post.hashtags.length > 0) {
          post.hashtags.forEach(tag => {
            recordInteraction('view', undefined, undefined, tag);
          });
        }
      });
    }
  }, [posts, loading]);

  const handlePostClick = (postId: string, authorId: string) => {
    // Record click interaction
    recordInteraction('view', postId, authorId);
  };

  const handleToggleFeedType = () => {
    setFeedType(feedType === 'personalized' ? 'chronological' : 'personalized');
  };

  const handleFollowHashtag = async (hashtag: string) => {
    await followHashtag(hashtag);
  };

  const handleUnfollowHashtag = async (hashtag: string) => {
    await unfollowHashtag(hashtag);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Feed</h1>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFeedType}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={feedType === 'personalized' ? 'Switch to chronological feed' : 'Switch to personalized feed'}
          >
            {feedType === 'personalized' ? (
              <>
                <Sparkles size={16} className="text-blue-600" />
                <span>Personalized</span>
              </>
            ) : (
              <>
                <Clock size={16} className="text-gray-600" />
                <span>Latest</span>
              </>
            )}
          </button>
          
          <Link
            to="/feed/preferences"
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Feed preferences"
          >
            <Settings size={18} />
          </Link>
          
          <button
            onClick={() => refreshFeed()}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      
      {/* Followed Hashtags */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-700">Followed Topics</h2>
          <Link to="/hashtags" className="text-xs text-blue-600 hover:text-blue-800">
            Explore more
          </Link>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {followedHashtags.length > 0 ? (
            followedHashtags.map(tag => (
              <div key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <Hash size={14} className="mr-1" />
                <span>{tag}</span>
                <button 
                  onClick={() => handleUnfollowHashtag(tag)}
                  className="ml-1 p-0.5 rounded-full hover:bg-blue-200"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 italic">
              Follow topics to personalize your feed
            </div>
          )}
          
          <Link 
            to="/hashtags" 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus size={14} className="mr-1" />
            <span>Add topics</span>
          </Link>
        </div>
      </div>
      
      {/* Feed Content */}
      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {loading && posts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
            <span className="text-gray-600">Loading your personalized feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your feed is empty</h3>
            <p className="text-gray-600 mb-6">
              {feedType === 'personalized' 
                ? "Follow more users and topics to personalize your feed" 
                : "There are no recent posts to display"}
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/users"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Find users to follow
              </Link>
              <Link
                to="/hashtags"
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                Explore topics
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post._id} onClick={() => handlePostClick(post._id, post.author._id)}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
            
            {currentPage < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMorePosts}
                  disabled={loading}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load more</span>
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PersonalizedFeed; 
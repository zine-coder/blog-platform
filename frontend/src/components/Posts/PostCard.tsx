import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, MessageCircle, ArrowRight, Hash } from 'lucide-react';

interface PostCardProps {
  post: {
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
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExcerpt = (text: string, maxLength: number = 150) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Determine comment count - use commentCount if available, otherwise fallback to comments array length
  const commentCount = post.commentCount !== undefined 
    ? post.commentCount 
    : (post.comments ? post.comments.length : 0);
    
  const handleHashtagClick = (tag: string) => {
    navigate(`/hashtag/${tag}`);
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Image section with lazy loading */}
      {post.imageUrl && (
        <div className="w-full h-48 overflow-hidden bg-gray-100 relative">
          {!imageError && (
            <img 
              src={post.imageUrl} 
              alt={post.title} 
              className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          )}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-gray-400 text-sm">Image unavailable</div>
            </div>
          )}
        </div>
      )}
      
      <div className="p-5">
        {/* Title and content */}
        <div className="mb-4">
          <Link to={`/posts/${post._id}`} className="block group">
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {post.title}
            </h3>
          </Link>
          
          <p className="text-gray-600 mb-3 line-clamp-2">
            {getExcerpt(post.body)}
          </p>
        </div>
        
        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.hashtags.map((tag, index) => (
              <button
                key={index}
                onClick={() => handleHashtagClick(tag)}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              >
                <Hash size={10} className="mr-0.5" />
                {tag}
              </button>
            ))}
          </div>
        )}
        
        {/* Author and metadata */}
        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <Link to={`/users/${post.author.username}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {post.author.profileImage ? (
                  <img 
                    src={post.author.profileImage} 
                    alt={post.author.username} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <User size={14} className="text-blue-600" />
                )}
              </div>
              <span className="font-medium">{post.author.username}</span>
            </Link>
            
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-gray-400" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <MessageCircle size={16} className="text-gray-400" />
              <span>{commentCount} comments</span>
            </div>
          </div>
          
          {/* Read more button */}
          <Link 
            to={`/posts/${post._id}`}
            className="inline-flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 transition-colors group"
          >
            Read article
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default React.memo(PostCard);
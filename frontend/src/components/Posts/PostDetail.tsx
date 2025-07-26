import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, User, Edit, Trash2, ArrowLeft, MessageCircle, Send, ChevronDown, Loader2, Clock, Heart, Share2, Bookmark, BookmarkCheck, Hash } from 'lucide-react';
import ConfirmModal from '../UI/ConfirmModal';

interface Comment {
  _id: string;
  body: string;
  author: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
}

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
  likes: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  content?: { text: string; image?: string }[]; // New field for content structure
}

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post>({} as Post);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowMore, setShouldShowMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // States for UI loading
  // Note: isLiked, isBookmarked, and likes count come directly from post object
  const [readTime, setReadTime] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (id) {
      loadPost();
      loadComments();
    }
  }, [id, currentPage]);

  useEffect(() => {
    if (post && post.body) {
      const wordsPerMinute = 200;
      const wordCount = post.body.trim().split(/\s+/).length;
      const readTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
      setReadTime(`${readTimeMinutes} min read`);
    }
  }, [post]);

  // Check if content needs "See more" button
  useEffect(() => {
    if (post && post.body && contentRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(contentRef.current).lineHeight);
      const contentHeight = contentRef.current.scrollHeight;
      const approxLines = Math.ceil(contentHeight / (lineHeight || 24)); // Default to 24px if lineHeight is 'normal'

      setShouldShowMore(approxLines > 5);
    }
  }, [post]);

  // No need for useEffect to set like/bookmark state as we use post properties directly

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getPost(id!);
      setPost(response.post);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading post');
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await commentsAPI.getComments(id!, currentPage, 10);
      setComments(commentsData.comments);
      setTotalPages(commentsData.pages || 1);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleDeletePost = async () => {
    try {
      await postsAPI.deletePost(id!);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting post');
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setLikeLoading(true);
    try {
      if (post.isLiked) {
        const response = await postsAPI.unlikePost(post._id);
        // Update post object directly
        setPost({
          ...post,
          isLiked: false,
          likes: response.likes
        });
      } else {
        const response = await postsAPI.likePost(post._id);
        // Update post object directly
        setPost({
          ...post,
          isLiked: true,
          likes: response.likes
        });
      }
    } catch (err) {
      console.error('Error updating like status:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setBookmarkLoading(true);
    try {
      if (post.isBookmarked) {
        const response = await postsAPI.unbookmarkPost(post._id);
        // Update post object directly
        setPost({
          ...post,
          isBookmarked: false
        });
      } else {
        const response = await postsAPI.bookmarkPost(post._id);
        // Update post object directly
        setPost({
          ...post,
          isBookmarked: true
        });
      }
      
      // Refresh user data to get updated bookmarks
      await refreshUser();
    } catch (err) {
      console.error('Error updating bookmark status:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: `Check out this article: ${post?.title}`,
        url: window.location.href
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Error copying to clipboard:', err));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await commentsAPI.addComment(id!, newComment);
      setNewComment('');
      loadComments(); // Reload comments after adding a new one
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const openDeleteCommentModal = (commentId: string) => {
    setCommentToDelete(commentId);
  };

  const confirmDeleteComment = async () => {
    if (commentToDelete) {
      try {
        await commentsAPI.deleteComment(commentToDelete);
        loadComments(); // Reload comments after deleting
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error deleting comment');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add new function to handle hashtag click
  const handleHashtagClick = (tag: string) => {
    navigate(`/hashtag/${tag}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mr-3" />
        <span className="text-gray-600">Loading article...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 group"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Articles</span>
        </button>
      </div>

      <article className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        {/* Article Header */}
        <div className="p-6 sm:p-8">
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <Link to={`/users/${post.author?.username}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {post.author?.profileImage ? (
                    <img 
                      src={post.author.profileImage} 
                      alt={post.author.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-blue-600" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {post.author?.username}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <Clock size={14} className="text-gray-400" />
                    <span>{readTime}</span>
                  </div>
                </div>
              </Link>

              {user && user.id === post.author?._id && (
                <div className="flex space-x-2">
                  <Link
                    to={`/posts/${post._id}/edit`}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-colors border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.imageUrl && (
            <div className="mb-8 -mx-6 sm:-mx-8">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-auto max-h-[500px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose max-w-none">
            {post.content && Array.isArray(post.content) && post.content.length > 0 ? (
              // New content structure with paragraphs and images
              <div className="space-y-8">
                {post.content.map((paragraph, index) => (
                  <div key={index} className="space-y-4">
                    <div 
                      className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg"
                    >
                      {paragraph.text}
                    </div>
                    
                    {paragraph.image && (
                      <div className="my-6">
                        <img 
                          src={paragraph.image} 
                          alt={`Paragraph ${index + 1} image`} 
                          className="w-full max-h-[500px] object-cover rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Legacy content structure
            <div 
              ref={contentRef}
              className={`text-gray-800 leading-relaxed whitespace-pre-wrap text-lg ${!isExpanded && shouldShowMore ? 'line-clamp-5' : ''}`}
            >
              {post.body}
            </div>
            )}
            
            {!post.content && shouldShowMore && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="mt-3 flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <span>{isExpanded ? 'See less' : '...See more'}</span>
                <ChevronDown 
                  size={16} 
                  className={`ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
            )}
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.hashtags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleHashtagClick(tag)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                >
                  <Hash size={14} className="mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Article Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                    post.isLiked 
                      ? 'border-red-200 bg-red-50 text-red-600' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {likeLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Heart size={16} className={post.isLiked ? 'fill-red-500 text-red-500' : ''} />
                  )}
                  <span>{post.likes}</span>
                </button>
                
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
              
              <button 
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                  post.isBookmarked 
                    ? 'border-blue-200 bg-blue-50 text-blue-600' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {bookmarkLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {post.isBookmarked ? (
                      <BookmarkCheck size={16} className="fill-blue-500 text-blue-500" />
                    ) : (
                      <Bookmark size={16} />
                    )}
                    <span>{post.isBookmarked ? 'Saved' : 'Save'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Comments section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle size={20} className="text-blue-600" />
            <span>Comments ({comments.length})</span>
          </h2>
        </div>

        <div className="p-6">
          {user && (
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  rows={3}
                  placeholder="Add your comment..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {commentLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Comment</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <>
                {comments.map(comment => (
                  <div key={comment._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <Link to={`/users/${comment.author.username}`} className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                          {comment.author.profileImage ? (
                            <img 
                              src={comment.author.profileImage} 
                              alt={comment.author.username} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={16} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{comment.author.username}</div>
                          <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
                        </div>
                      </Link>
                      
                      {user && user.id === comment.author._id && (
                        <button
                          onClick={() => openDeleteCommentModal(comment._id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                          title="Delete comment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{comment.body}</p>
                  </div>
                ))}

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
              </>
            )}
          </div>
        </div>
      </section>

      {/* Delete article confirmation modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePost}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Delete comment confirmation modal */}
      <ConfirmModal
        isOpen={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default PostDetail;
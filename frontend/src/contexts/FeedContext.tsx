import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { feedAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { Post } from '../models';

interface FeedContextType {
  posts: Post[];
  loading: boolean;
  error: string;
  currentPage: number;
  totalPages: number;
  feedType: 'personalized' | 'chronological';
  followedHashtags: string[];
  refreshFeed: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
  setFeedType: (type: 'personalized' | 'chronological') => void;
  followHashtag: (hashtag: string) => Promise<void>;
  unfollowHashtag: (hashtag: string) => Promise<void>;
  recordInteraction: (interactionType: string, postId?: string, authorId?: string, hashtag?: string) => Promise<void>;
  updateFeedPreferences: (preferences: { feedPersonalization?: boolean, contentLanguages?: string[] }) => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [feedType, setFeedType] = useState<'personalized' | 'chronological'>('personalized');
  const [followedHashtags, setFollowedHashtags] = useState<string[]>([]);

  // Load feed when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadFeed();
      loadFollowedHashtags();
    }
  }, [user, feedType]);

  // Load followed hashtags
  const loadFollowedHashtags = async () => {
    try {
      const response = await feedAPI.getFollowedHashtags();
      setFollowedHashtags(response.hashtags.map((h: any) => h.hashtag));
    } catch (err) {
      console.error('Error loading followed hashtags:', err);
    }
  };

  // Load feed based on selected type
  const loadFeed = async (page = 1) => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = feedType === 'personalized'
        ? await feedAPI.getPersonalizedFeed(page)
        : await feedAPI.getChronologicalFeed(page);
      
      if (page === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...response.posts]);
      }
      
      setCurrentPage(page);
      setTotalPages(response.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading feed');
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh feed (reset to page 1)
  const refreshFeed = async () => {
    setCurrentPage(1);
    await loadFeed(1);
  };

  // Load more posts (next page)
  const loadMorePosts = async () => {
    if (currentPage < totalPages) {
      await loadFeed(currentPage + 1);
    }
  };

  // Change feed type
  const changeFeedType = (type: 'personalized' | 'chronological') => {
    setFeedType(type);
    setCurrentPage(1);
  };

  // Follow hashtag
  const handleFollowHashtag = async (hashtag: string) => {
    try {
      await feedAPI.followHashtag(hashtag);
      setFollowedHashtags(prev => [...prev, hashtag]);
      // Record interaction
      await feedAPI.recordInteraction('follow_hashtag', undefined, undefined, hashtag);
      // Refresh feed to reflect changes
      refreshFeed();
    } catch (err) {
      console.error('Error following hashtag:', err);
    }
  };

  // Unfollow hashtag
  const handleUnfollowHashtag = async (hashtag: string) => {
    try {
      await feedAPI.unfollowHashtag(hashtag);
      setFollowedHashtags(prev => prev.filter(h => h !== hashtag));
      // Refresh feed to reflect changes
      refreshFeed();
    } catch (err) {
      console.error('Error unfollowing hashtag:', err);
    }
  };

  // Record user interaction
  const recordInteraction = async (interactionType: string, postId?: string, authorId?: string, hashtag?: string) => {
    try {
      await feedAPI.recordInteraction(interactionType, postId, authorId, hashtag);
    } catch (err) {
      console.error('Error recording interaction:', err);
    }
  };

  // Update feed preferences
  const updateFeedPreferences = async (preferences: { feedPersonalization?: boolean, contentLanguages?: string[] }) => {
    try {
      await feedAPI.updateFeedPreferences(preferences);
      // If personalization is toggled, refresh feed
      if (preferences.feedPersonalization !== undefined) {
        refreshFeed();
      }
    } catch (err) {
      console.error('Error updating feed preferences:', err);
    }
  };

  const value = {
    posts,
    loading,
    error,
    currentPage,
    totalPages,
    feedType,
    followedHashtags,
    refreshFeed,
    loadMorePosts,
    setFeedType: changeFeedType,
    followHashtag: handleFollowHashtag,
    unfollowHashtag: handleUnfollowHashtag,
    recordInteraction,
    updateFeedPreferences
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

export const useFeed = (): FeedContextType => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
}; 
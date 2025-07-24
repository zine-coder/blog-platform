export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profileImage?: string;
  bannerImage?: string;
  followersCount?: number;
  followingCount?: number;
  articlesCount?: number;
  isFollowing?: boolean;
  createdAt?: string;
  bookmarks?: string[];
  followingHashtags?: string[];
  preferences?: {
    feedPersonalization?: boolean;
    contentLanguages?: string[];
  };
}

export interface Post {
  _id: string;
  title: string;
  body: string;
  author: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
  comments: string[];
  likedBy?: string[];
  likes?: number;
  isLiked?: boolean;
  hashtags?: string[];
  _score?: number; // Used for personalized feed ranking
}

export interface Comment {
  _id: string;
  body: string;
  author: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: 'new_post' | 'new_follower' | 'comment';
  sender: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  post?: {
    _id: string;
    title: string;
  };
  read: boolean;
  createdAt: string;
} 
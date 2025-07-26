const API_URL = import.meta.env.VITE_API_URL;

// Vérifier si le token est valide
export const checkTokenValidity = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found in localStorage');
    return false;
  }
  
  try {
    const response = await fetch(`${API_URL}/auth/user`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.warn('Token validation failed:', response.status);
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found');
    return {
      'Content-Type': 'application/json'
    };
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      const error: any = new Error(errorData.message || errorData.error || 'An error occurred');
      
      // Add additional error information if available
      if (errorData.field) {
        error.field = errorData.field;
      }
      
      if (errorData.suggestions) {
        error.suggestions = errorData.suggestions;
      }
      
      // Store the original response status
      error.status = response.status;
      error.statusText = response.statusText;
      
      // Add validation errors if available
      if (errorData.errors && Array.isArray(errorData.errors)) {
        error.validationErrors = errorData.errors;
      }
      
      // Add specific error code if available
      if (errorData.code) {
        error.code = errorData.code;
      }
      
      console.error(`API Error (${response.status}):`, errorData);
      
      // Handle specific error cases
      if (response.status === 401) {
        // Unauthorized - token might be expired
        localStorage.removeItem('token');
        // You could trigger a logout event here if needed
        // Example: window.dispatchEvent(new Event('auth:logout'));
      }
      
      throw error;
    } catch (jsonError) {
      // If we can't parse the error as JSON, return a generic error
      console.error(`API Error (${response.status}): Could not parse error response`);
      throw new Error(`Server error (${response.status}): ${response.statusText}`);
    }
  }
  
  try {
    return await response.json();
  } catch (jsonError) {
    console.error('Error parsing JSON response:', jsonError);
    throw new Error('Invalid response from server');
  }
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  },

  register: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    return handleResponse(response);
  },
  
  checkUsername: async (username: string) => {
    const response = await fetch(`${API_URL}/auth/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/auth/user`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  updateProfile: async (bio: string) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bio })
    });
    return handleResponse(response);
  },
  
  updateProfileImage: async (imageUrl: string) => {
    // Ensure imageUrl is at least an empty string, not undefined or null
    const safeImageUrl = imageUrl === null || imageUrl === undefined ? '' : imageUrl;
    
    const response = await fetch(`${API_URL}/users/profile-image`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ imageUrl: safeImageUrl })
    });
    return handleResponse(response);
  },
  
  updateBannerImage: async (imageUrl: string) => {
    // Ensure imageUrl is at least an empty string, not undefined or null
    const safeImageUrl = imageUrl === null || imageUrl === undefined ? '' : imageUrl;
    
    const response = await fetch(`${API_URL}/users/banner-image`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ imageUrl: safeImageUrl })
    });
    return handleResponse(response);
  },
  
  updateEmail: async (email: string, currentPassword: string) => {
    const response = await fetch(`${API_URL}/users/email`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, currentPassword })
    });
    return handleResponse(response);
  },
  
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/users/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return handleResponse(response);
  },
  
  deleteAccount: async () => {
    const response = await fetch(`${API_URL}/users/account`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export const postsAPI = {
  getAllPosts: async (page = 1, limit = 10, search = '') => {
    let url = `${API_URL}/posts?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url);
    return handleResponse(response);
  },

  getPostsByHashtag: async (tag: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/posts/hashtag/${tag}?page=${page}&limit=${limit}`);
    return handleResponse(response);
  },

  searchPosts: async (query: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/posts?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return handleResponse(response);
  },

  getPost: async (id: string) => {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  createPost: async (title: string, body: string, imageUrl?: string, hashtags?: string[], content?: Array<{text: string, image: string | null}>) => {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        title, 
        body,
        imageUrl: imageUrl || '',
        hashtags: hashtags || [],
        content: content || []
      })
    });
    return handleResponse(response);
  },

  updatePost: async (id: string, title: string, body: string, imageUrl: string = '', hashtags: string[] = [], content?: Array<{text: string, image: string | null}>) => {
    try {
      // Validate inputs
      if (!id) throw new Error('Post ID is required');
      if (!title.trim()) throw new Error('Title is required');
      if (!body.trim()) throw new Error('Content is required');
      
      // Ensure hashtags is always an array of valid strings
      const safeHashtags = Array.isArray(hashtags) 
        ? hashtags.filter(tag => tag && typeof tag === 'string') 
        : [];
      
      console.log(`Sending update request for post ${id}:`, {
        title, body, imageUrl, hashtags: safeHashtags, content
      });
      
      const response = await fetch(`${API_URL}/posts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          title, 
          body,
          imageUrl,
          hashtags: safeHashtags,
          content: content || []
        })
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error in updatePost:', error);
      throw error;
    }
  },

  deletePost: async (id: string) => {
    const response = await fetch(`${API_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getUserPosts: async (userId: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/users/${userId}/posts?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  likePost: async (postId: string) => {
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  unlikePost: async (postId: string) => {
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  bookmarkPost: async (postId: string) => {
    const response = await fetch(`${API_URL}/posts/${postId}/bookmark`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  unbookmarkPost: async (postId: string) => {
    const response = await fetch(`${API_URL}/posts/${postId}/bookmark`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export const commentsAPI = {
  getComments: async (postId: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/posts/${postId}/comments?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  addComment: async (postId: string, body: string) => {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ body })
    });
    return handleResponse(response);
  },
  
  updateComment: async (commentId: string, body: string) => {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ body })
    });
    return handleResponse(response);
  },

  deleteComment: async (commentId: string) => {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export const userAPI = {
  getUserByUsername: async (username: string) => {
    const response = await fetch(`${API_URL}/users/${username}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  followUser: async (userId: string) => {
    const response = await fetch(`${API_URL}/users/${userId}/follow`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  unfollowUser: async (userId: string) => {
    const response = await fetch(`${API_URL}/users/${userId}/follow`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getFollowers: async (userId: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/users/${userId}/followers?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getFollowing: async (userId: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/users/${userId}/following?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  searchUsers: async (query: string, page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getLikedPosts: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/users/liked-posts?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getBookmarkedPosts: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/users/bookmarks?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

export const notificationAPI = {
  getNotifications: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/notifications?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  markAsRead: async (notificationId: string) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  markAllAsRead: async () => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getUnreadCount: async () => {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      // Get auth token if available
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          try {
            errorMessage = await response.text() || errorMessage;
          } catch (textError) {
            // Fallback to default error message
          }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
};

// Feed API
export const feedAPI = {
  getPersonalizedFeed: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/feed?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getChronologicalFeed: async (page = 1, limit = 10) => {
    const response = await fetch(`${API_URL}/feed/chronological?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  recordInteraction: async (interactionType: string, postId?: string, authorId?: string, hashtag?: string) => {
    const response = await fetch(`${API_URL}/feed/interaction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        interactionType,
        postId,
        authorId,
        hashtag
      })
    });
    return handleResponse(response);
  },
  
  followHashtag: async (hashtag: string) => {
    const response = await fetch(`${API_URL}/feed/hashtags/${encodeURIComponent(hashtag)}/follow`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  unfollowHashtag: async (hashtag: string) => {
    const response = await fetch(`${API_URL}/feed/hashtags/${encodeURIComponent(hashtag)}/follow`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getFollowedHashtags: async () => {
    const response = await fetch(`${API_URL}/feed/hashtags/following`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  updateFeedPreferences: async (preferences: { feedPersonalization?: boolean, contentLanguages?: string[] }) => {
    const response = await fetch(`${API_URL}/feed/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
    return handleResponse(response);
  }
};

// Add a new search API object at the end of the file
export const searchAPI = {
  getPopularSearches: async () => {
    const response = await fetch(`${API_URL}/search/popular`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getFilterOptions: async () => {
    const response = await fetch(`${API_URL}/search/filters`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  getPopularHashtags: async () => {
    const response = await fetch(`${API_URL}/search/hashtags/popular`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  
  recordSearch: async (query: string) => {
    const response = await fetch(`${API_URL}/search/record`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query })
    });
    return handleResponse(response);
  }
};
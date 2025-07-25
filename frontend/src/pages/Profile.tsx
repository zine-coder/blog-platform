import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, postsAPI, userAPI } from '../services/api';
import { User, Edit, Trash2, Save, X, Loader2, PenTool, ArrowLeft, Users, FileText, Calendar, Heart, Bookmark, Mail, Lock, Eye, EyeOff, ExternalLink, Camera } from 'lucide-react';
import PostCard from '../components/Posts/PostCard';
import ConfirmModal from '../components/UI/ConfirmModal';
import ErrorBoundary from '../components/ErrorBoundary';
import ProfileImageUpload from '../components/Profile/ProfileImageUpload';
import { Post } from '../models';

type TabType = 'my-posts' | 'liked-posts' | 'bookmarked-posts';
type EditSectionType = 'bio' | 'email' | 'password' | null;
type ModalType = 'followers' | 'following' | null;
type ImageUploadType = 'profile' | 'banner' | null;

interface UserItem {
  id: string;
  username: string;
  bio?: string;
  profileImage?: string;
}

const ProfileContent: React.FC = () => {
  const { user, logout, refreshUser, ensureAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Loading state for the entire profile
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Local state for images to ensure immediate updates
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [bannerImage, setBannerImage] = useState<string | undefined>(undefined);
  const [imageLoading, setImageLoading] = useState<'profile' | 'banner' | null>(null);
  
  // Existing states
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedLoading, setLikedLoading] = useState(true);
  const [bookmarkedLoading, setBookmarkedLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [likedPage, setLikedPage] = useState(1);
  const [bookmarkedPage, setBookmarkedPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likedTotalPages, setLikedTotalPages] = useState(1);
  const [bookmarkedTotalPages, setBookmarkedTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('my-posts');
  
  // Profile edit state
  const [editSection, setEditSection] = useState<EditSectionType>(null);
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Stats
  const [articlesCount, setArticlesCount] = useState(0);
  
  // Modal states
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  // New states for followers/following modals
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  // New state for image upload
  const [imageUploadType, setImageUploadType] = useState<ImageUploadType>(null);

  // Refresh user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      setProfileLoading(true);
      try {
        if (user) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data. Please try again.');
      } finally {
        setProfileLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setEmail(user.email || '');
      setProfileImage(user.profileImage);
      setBannerImage(user.bannerImage);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Load content based on active tab
      if (activeTab === 'my-posts') {
        loadUserPosts();
      } else if (activeTab === 'liked-posts') {
        loadLikedPosts();
      } else if (activeTab === 'bookmarked-posts') {
        loadBookmarkedPosts();
      }
    } else {
      navigate('/login');
    }
  }, [user, activeTab, currentPage, likedPage, bookmarkedPage]);

  // Load followers or following when modal is opened
  useEffect(() => {
    if (activeModal && user) {
      loadUsersList(activeModal);
    }
  }, [activeModal, usersPage]);

  const loadUsersList = async (type: ModalType) => {
    if (!user || !type) return;
    
    setUsersLoading(true);
    setUsersError('');
    
    try {
      const response = type === 'followers' 
        ? await userAPI.getFollowers(user.id, usersPage, 10)
        : await userAPI.getFollowing(user.id, usersPage, 10);
      
      setUsersList(response.users || []);
      setUsersTotalPages(response.pages || 1);
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
      setUsersError(err instanceof Error ? err.message : `Error loading ${type}`);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRetryLoadUsers = () => {
    if (activeModal) {
      loadUsersList(activeModal);
    }
  };

  const openFollowersModal = () => {
    setUsersPage(1);
    setActiveModal('followers');
  };

  const openFollowingModal = () => {
    setUsersPage(1);
    setActiveModal('following');
  };

  const closeUsersModal = () => {
    setActiveModal(null);
    setUsersList([]);
  };

  const navigateToUserProfile = (username: string) => {
    navigate(`/users/${username}`);
    closeUsersModal();
  };

  const loadUserPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await postsAPI.getUserPosts(user.id, currentPage, 9);
      setUserPosts(response.posts || []);
      setTotalPages(response.pages || 1);
      setArticlesCount(response.total || response.posts?.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading articles');
    } finally {
      setLoading(false);
    }
  };
  
  const loadLikedPosts = async () => {
    if (!user) return;
    setLikedLoading(true);
    try {
      const response = await userAPI.getLikedPosts(likedPage, 9);
      setLikedPosts(response.posts || []);
      setLikedTotalPages(response.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading liked articles');
    } finally {
      setLikedLoading(false);
    }
  };
  
  const loadBookmarkedPosts = async () => {
    if (!user) return;
    setBookmarkedLoading(true);
    try {
      await authAPI.getCurrentUser();
      const response = await userAPI.getBookmarkedPosts(bookmarkedPage, 9);
      setBookmarkedPosts(response.posts || []);
      setBookmarkedTotalPages(response.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading bookmarked articles');
    } finally {
      setBookmarkedLoading(false);
    }
  };

  const handleUpdateBio = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');
    
    try {
      // Ensure user is authenticated before making API call
      const isAuthenticated = await ensureAuthenticated();
      if (!isAuthenticated) {
        setError('Authentication failed. Please log in again.');
        logout();
        navigate('/login');
        return;
      }
      
      // Afficher les en-têtes d'authentification pour le débogage
      const token = localStorage.getItem('token');
      console.log('Using token for API call:', token ? token.substring(0, 10) + '...' : 'None');
      
      await authAPI.updateProfile(bio);
      await refreshUser();
      setEditSection(null);
      setSuccessMessage('Bio updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
      console.error('Bio update error:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdateEmail = async () => {
    if (!user) return;
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email cannot be empty');
      return;
    }
    
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (!currentPassword) {
      setEmailError('Please enter your current password');
      return;
    }
    
    // Debug authentication info
    console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Not present');
    console.log('Current user:', user ? user.username : 'Not logged in');
    
    setSaving(true);
    setEmailError('');
    setError('');
    
    try {
      // Ensure user is authenticated before making API call
      const isAuthenticated = await ensureAuthenticated();
      if (!isAuthenticated) {
        setEmailError('Authentication failed. Please log in again.');
        logout();
        navigate('/login');
        return;
      }
      
      // Afficher les en-têtes d'authentification pour le débogage
      const token = localStorage.getItem('token');
      console.log('Using token for API call:', token ? token.substring(0, 10) + '...' : 'None');
      
      await authAPI.updateEmail(email, currentPassword);
      await refreshUser();
      setEditSection(null);
      setCurrentPassword('');
      setSuccessMessage('Email updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating email';
      setEmailError(errorMessage);
      console.error('Email update error:', err);
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    if (!user) return;
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setSaving(true);
    setPasswordError('');
    setError('');
    
    try {
      // Ensure user is authenticated before making API call
      const isAuthenticated = await ensureAuthenticated();
      if (!isAuthenticated) {
        setPasswordError('Authentication failed. Please log in again.');
        logout();
        navigate('/login');
        return;
      }
      
      // Afficher les en-têtes d'authentification pour le débogage
      const token = localStorage.getItem('token');
      console.log('Using token for API call:', token ? token.substring(0, 10) + '...' : 'None');
      
      await authAPI.updatePassword(currentPassword, newPassword);
      setEditSection(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating password';
      setPasswordError(errorMessage);
      console.error('Password update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authAPI.deleteAccount();
      logout();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting account');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await postsAPI.deletePost(postId);
      loadUserPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting article');
    }
  };

  const resetForm = () => {
    setEditSection(null);
    setBio(user?.bio || '');
    setEmail(user?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Handle image upload success
  const handleImageUploadSuccess = async (imageUrl: string) => {
    const uploadType = imageUploadType; // Store current type before resetting
    setImageUploadType(null);
    
    try {
      // Update local state immediately for better UX
      if (uploadType === 'profile') {
        setImageLoading('profile');
        setProfileImage(imageUrl || undefined); // Handle empty string for removal
      } else if (uploadType === 'banner') {
        setImageLoading('banner');
        setBannerImage(imageUrl || undefined); // Handle empty string for removal
      }
      
      // Force refresh user data to get updated image URLs
      await refreshUser();
      
      // Clear loading state
      setImageLoading(null);
      
      // Show success message
      const action = imageUrl ? 'updated' : 'removed';
      setSuccessMessage(`${uploadType === 'profile' ? 'Profile' : 'Banner'} image ${action} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      setImageLoading(null);
      console.error('Error refreshing user data after image upload:', error);
      setError('Image uploaded but failed to refresh profile. Please reload the page.');
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mr-3" />
        <span className="text-lg text-gray-700">Loading profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
        <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 group">
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back to home</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        {/* Banner Image */}
        <div className="relative">
          <div className={`h-32 ${bannerImage ? '' : 'bg-gradient-to-r from-blue-600 to-purple-600'} relative`}>
            {bannerImage && (
              <img 
                src={bannerImage} 
                alt="Profile Banner" 
                className="w-full h-full object-cover"
              />
            )}
            {imageLoading === 'banner' && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Loader2 size={32} className="text-white animate-spin" />
              </div>
            )}
            <button 
              onClick={() => setImageUploadType('banner')}
              className="absolute bottom-2 right-2 bg-white bg-opacity-75 p-2 rounded-full hover:bg-opacity-100 transition-opacity"
              title="Change banner image"
            >
              <Camera size={16} className="text-gray-700" />
            </button>
          </div>
          
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-8">
            <div className="relative w-24 h-24">
              <div className="w-full h-full bg-white rounded-full p-1 shadow-md">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={user.username} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={40} className="text-blue-600" />
                  </div>
                )}
                {imageLoading === 'profile' && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => setImageUploadType('profile')}
                className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                title="Change profile picture"
              >
                <Camera size={14} className="text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium">{error}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium">{successMessage}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSuccessMessage('')}
                className="text-green-500 hover:text-green-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.username}</h1>
              <p className="text-gray-600 mt-1">{user?.email}</p>
              <p className="text-sm text-gray-500 mt-2">
                <Calendar size={14} className="inline mr-1" />
                Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setEditSection('bio')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm border rounded-lg transition-colors ${
                  editSection === 'bio'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <Edit size={16} />
                <span>Edit Bio</span>
              </button>
              
              <button
                onClick={() => setEditSection('email')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm border rounded-lg transition-colors ${
                  editSection === 'email'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <Mail size={16} />
                <span>Change Email</span>
              </button>
              
              <button
                onClick={() => setEditSection('password')}
                className={`flex items-center space-x-1 px-4 py-2 text-sm border rounded-lg transition-colors ${
                  editSection === 'password'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <Lock size={16} />
                <span>Change Password</span>
              </button>
            </div>
          </div>

          {/* Bio Edit Section */}
          {editSection === 'bio' && (
            <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Bio</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={resetForm}
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleUpdateBio}
                  disabled={saving}
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Email Edit Section */}
          {editSection === 'email' && (
            <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Change Email</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 bg-gray-100 rounded-lg text-gray-500"
                  readOnly
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    emailError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your new email"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      emailError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {emailError && (
                <p className="mt-1 text-sm text-red-600 mb-4">{emailError}</p>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={resetForm}
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleUpdateEmail}
                  disabled={saving}
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Password Edit Section */}
          {editSection === 'password' && (
            <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your new password"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
              
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 mb-4">{passwordError}</p>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={resetForm}
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleUpdatePassword}
                  disabled={saving}
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Bio Display Section (when not editing) */}
          {!editSection && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">
                Bio
              </h2>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                {user.bio || "No bio yet."}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 border-t border-gray-200 pt-6">
            <div className="text-center">
              <div className="flex items-center">
                <FileText size={18} className="text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">{articlesCount}</span>
              </div>
              <span className="text-sm text-gray-600">Articles</span>
            </div>
            
            <div 
              className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={openFollowersModal}
              title="View followers"
            >
              <div className="flex items-center">
                <Users size={18} className="text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">{user?.followersCount || 0}</span>
              </div>
              <span className="text-sm text-gray-600">Followers</span>
            </div>
            
            <div 
              className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={openFollowingModal}
              title="View following"
            >
              <div className="flex items-center">
                <Users size={18} className="text-blue-600 mr-2" />
                <span className="text-lg font-bold text-gray-900">{user?.followingCount || 0}</span>
              </div>
              <span className="text-sm text-gray-600">Following</span>
            </div>
            
            <div className="ml-auto">
              <button
                onClick={() => setIsDeleteAccountModalOpen(true)}
                className="flex items-center space-x-1 px-4 py-2 text-sm text-red-600 hover:text-red-800 transition-colors border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={16} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => handleTabChange('my-posts')}
            className={`pb-4 px-1 font-medium text-sm flex items-center ${
              activeTab === 'my-posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} className="mr-2" />
            My Articles
          </button>
          <button
            onClick={() => handleTabChange('liked-posts')}
            className={`pb-4 px-1 font-medium text-sm flex items-center ${
              activeTab === 'liked-posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart size={16} className="mr-2" />
            Liked Articles
          </button>
          <button
            onClick={() => handleTabChange('bookmarked-posts')}
            className={`pb-4 px-1 font-medium text-sm flex items-center ${
              activeTab === 'bookmarked-posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bookmark size={16} className="mr-2" />
            Saved Articles
          </button>
        </div>
      </div>

      {/* My Articles Tab */}
      {activeTab === 'my-posts' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText size={20} className="text-blue-600 mr-2" />
              My Articles
            </h2>
            
            <Link 
              to="/create"
              className="inline-flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <PenTool size={16} />
              <span>Write New Article</span>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-10 w-10 text-blue-600 mr-3" />
              <span className="text-gray-600">Loading articles...</span>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600 mb-6">You haven't published any articles yet.</p>
              <button
                onClick={() => navigate('/create')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <PenTool size={16} />
                <span>Write Your First Article</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPosts.map(post => (
                <div key={post._id} className="relative">
                  <PostCard post={post} />
                  <div className="absolute top-4 right-4 flex space-x-2 bg-white bg-opacity-90 rounded-md shadow-sm p-1">
                    <button
                      onClick={() => navigate(`/posts/${post._id}/edit`)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit article"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setPostToDelete(post._id)}
                      className="p-1.5 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete article"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
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
      )}

      {/* Liked Articles Tab */}
      {activeTab === 'liked-posts' && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Heart size={20} className="text-red-500 mr-2" />
              Articles You Liked
            </h2>
          </div>
          
          {likedLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-10 w-10 text-blue-600 mr-3" />
              <span className="text-gray-600">Loading liked articles...</span>
            </div>
          ) : likedPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No liked articles yet</h3>
              <p className="text-gray-600 mb-6">You haven't liked any articles yet.</p>
              <Link
                to="/"
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>Browse Articles</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedPosts.map(post => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

          {likedTotalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLikedPage(prev => Math.max(prev - 1, 1))}
                  disabled={likedPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm bg-gray-100 rounded-md">
                  Page {likedPage} of {likedTotalPages}
                </span>
                <button
                  onClick={() => setLikedPage(prev => Math.min(prev + 1, likedTotalPages))}
                  disabled={likedPage === likedTotalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Articles Tab */}
      {activeTab === 'bookmarked-posts' && (
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Bookmark size={20} className="text-blue-600 mr-2" />
              Saved Articles
            </h2>
          </div>
          
          {bookmarkedLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-10 w-10 text-blue-600 mr-3" />
              <span className="text-gray-600">Loading saved articles...</span>
            </div>
          ) : bookmarkedPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved articles yet</h3>
              <p className="text-gray-600 mb-6">You haven't saved any articles yet.</p>
              <Link
                to="/"
                className="inline-flex items-center space-x-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>Browse Articles</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedPosts.map(post => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

          {bookmarkedTotalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setBookmarkedPage(prev => Math.max(prev - 1, 1))}
                  disabled={bookmarkedPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm bg-gray-100 rounded-md">
                  Page {bookmarkedPage} of {bookmarkedTotalPages}
                </span>
                <button
                  onClick={() => setBookmarkedPage(prev => Math.min(prev + 1, bookmarkedTotalPages))}
                  disabled={bookmarkedPage === bookmarkedTotalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete account confirmation modal */}
      <ConfirmModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will delete all your articles and comments."
        confirmText="Delete Account"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Delete article confirmation modal */}
      <ConfirmModal
        isOpen={postToDelete !== null}
        onClose={() => setPostToDelete(null)}
        onConfirm={() => {
          if (postToDelete) {
            handleDeletePost(postToDelete);
            setPostToDelete(null);
          }
        }}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />

      {/* Followers Modal */}
      {activeModal === 'followers' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {user?.username}'s Followers
              </h3>
              <button onClick={closeUsersModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            {usersLoading ? (
              <div className="p-6 text-center text-gray-600">
                <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" />
                Loading followers...
              </div>
            ) : usersError ? (
              <div className="p-6 text-center text-red-600">
                <p>{usersError}</p>
                <button onClick={handleRetryLoadUsers} className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg">
                  Retry
                </button>
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                <p>No followers yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {usersList.map(follower => (
                  <div key={follower.id} className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => navigateToUserProfile(follower.username)}>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                        {follower.profileImage ? (
                          <img src={follower.profileImage} alt={follower.username} className="w-full h-full object-cover" />
                        ) : (
                        <User size={20} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{follower.username}</p>
                        {follower.bio && <p className="text-xs text-gray-500">{follower.bio}</p>}
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            )}
            {usersTotalPages > 1 && (
              <div className="p-4 flex justify-center border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                    disabled={usersPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm bg-gray-100 rounded-md">
                    Page {usersPage} of {usersTotalPages}
                  </span>
                  <button
                    onClick={() => setUsersPage(prev => Math.min(prev + 1, usersTotalPages))}
                    disabled={usersPage === usersTotalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {activeModal === 'following' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6 flex justify-between items-center border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {user?.username}'s Following
              </h3>
              <button onClick={closeUsersModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            {usersLoading ? (
              <div className="p-6 text-center text-gray-600">
                <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" />
                Loading following...
              </div>
            ) : usersError ? (
              <div className="p-6 text-center text-red-600">
                <p>{usersError}</p>
                <button onClick={handleRetryLoadUsers} className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg">
                  Retry
                </button>
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                <p>You are not following anyone yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {usersList.map(following => (
                  <div key={following.id} className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => navigateToUserProfile(following.username)}>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                        {following.profileImage ? (
                          <img src={following.profileImage} alt={following.username} className="w-full h-full object-cover" />
                        ) : (
                        <User size={20} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{following.username}</p>
                        {following.bio && <p className="text-xs text-gray-500">{following.bio}</p>}
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
            )}
            {usersTotalPages > 1 && (
              <div className="p-4 flex justify-center border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                    disabled={usersPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm bg-gray-100 rounded-md">
                    Page {usersPage} of {usersTotalPages}
                  </span>
                  <button
                    onClick={() => setUsersPage(prev => Math.min(prev + 1, usersTotalPages))}
                    disabled={usersPage === usersTotalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {imageUploadType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-auto">
            <ProfileImageUpload 
              type={imageUploadType}
              currentImageUrl={imageUploadType === 'profile' ? profileImage : bannerImage}
              onSuccess={handleImageUploadSuccess}
              onCancel={() => setImageUploadType(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component with ErrorBoundary
const Profile: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  );
};

export default Profile; 
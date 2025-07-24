import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import { Bell, ArrowLeft, User, FileText, UserPlus, Check, Loader2 } from 'lucide-react';
import { Notification } from '../models';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadNotifications();
  }, [currentPage]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationAPI.getNotifications(currentPage, 10);
      setNotifications(response.notifications);
      setTotalPages(response.pages || 1);
      
      // Mark all as read
      await notificationAPI.markAllAsRead();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'new_post':
        return (
          <Link 
            to={`/posts/${notification.post?._id}`}
            className="flex items-start p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors rounded-lg"
          >
            <div className="mr-4 mt-1 bg-blue-100 rounded-full p-2 overflow-hidden w-10 h-10 flex items-center justify-center">
              {notification.sender.profileImage ? (
                <img src={notification.sender.profileImage} alt={notification.sender.username} className="w-full h-full object-cover" />
              ) : (
              <FileText size={20} className="text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-medium">{notification.sender.username}</span> published a new article
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.post?.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </Link>
        );
      
      case 'new_follower':
        return (
          <Link 
            to={`/users/${notification.sender.username}`}
            className="flex items-start p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors rounded-lg"
          >
            <div className="mr-4 mt-1 bg-blue-100 rounded-full p-2 overflow-hidden w-10 h-10 flex items-center justify-center">
              {notification.sender.profileImage ? (
                <img src={notification.sender.profileImage} alt={notification.sender.username} className="w-full h-full object-cover" />
              ) : (
              <UserPlus size={20} className="text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-medium">{notification.sender.username}</span> started following you
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </Link>
        );
      
      case 'comment':
        return (
          <Link 
            to={`/posts/${notification.post?._id}`}
            className="flex items-start p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors rounded-lg"
          >
            <div className="mr-4 mt-1 bg-blue-100 rounded-full p-2 overflow-hidden w-10 h-10 flex items-center justify-center">
              {notification.sender.profileImage ? (
                <img src={notification.sender.profileImage} alt={notification.sender.username} className="w-full h-full object-cover" />
              ) : (
              <User size={20} className="text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-900">
                <span className="font-medium">{notification.sender.username}</span> commented on your article
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.post?.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </Link>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 group"
        >
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Bell size={20} className="text-blue-600 mr-2" />
            Notifications
          </h1>
          
          <button 
            onClick={loadNotifications}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <Check size={16} className="inline mr-1" />
            Mark all as read
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
              <span className="text-gray-600">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You don't have any notifications yet.</p>
            </div>
          ) : (
            <>
              {notifications.map(notification => (
                <div key={notification._id}>
                  {getNotificationContent(notification)}
                </div>
              ))}
              
              {totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
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
    </div>
  );
};

export default NotificationsPage; 
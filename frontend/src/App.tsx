import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FeedProvider } from './contexts/FeedContext';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import CreatePost from './components/Posts/CreatePost';
import EditPost from './components/Posts/EditPost';
import PostDetail from './components/Posts/PostDetail';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import SearchPage from './pages/SearchPage';
import Notifications from './pages/Notifications';
import HashtagPage from './pages/HashtagPage';
import PersonalizedFeed from './pages/PersonalizedFeed';
import FeedPreferences from './pages/FeedPreferences';
import AboutPage from './pages/AboutPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <FeedProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/posts/:id" element={<PostDetail />} />
                <Route path="/users/:username" element={<UserProfile />} />
                <Route path="/hashtag/:tag" element={<HashtagPage />} />
                <Route path="/about" element={<AboutPage />} />
                
                {/* Protected Routes */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/feed" element={<ProtectedRoute><PersonalizedFeed /></ProtectedRoute>} />
                <Route path="/feed/preferences" element={<ProtectedRoute><FeedPreferences /></ProtectedRoute>} />
              </Routes>
            </Layout>
          </FeedProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
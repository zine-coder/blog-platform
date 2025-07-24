import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Github, 
  Linkedin, 
  Mail, 
  Code, 
  Lock, 
  Image, 
  Hash, 
  Sparkles, 
  Bell, 
  MessageSquare, 
  Heart, 
  Bookmark, 
  Users, 
  Search, 
  Smartphone, 
  Shield, 
  Share2, 
  Palette,
  Globe,
  Database,
  ChevronRight
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 group">
          <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back to home</span>
        </Link>
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-xl shadow-lg mb-12 overflow-hidden">
        <div className="px-8 py-16 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Modern Blog Platform</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            A feature-rich publishing platform designed for creators, writers, and developers
          </p>
        </div>
        </div>
        
      {/* About Platform Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-12 overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Platform</h2>
          
          <div className="prose max-w-none text-gray-700 space-y-4">
            <p>
              Welcome to our modern blog platform! This application was built with a focus on clean design, 
              intuitive user experience, and powerful features that make content creation and sharing a breeze.
            </p>
            
            <p>
              Built with React, Node.js, Express, and MongoDB, this platform demonstrates modern web development 
              practices and showcases how a full-featured content management system can be implemented with the MERN stack.
            </p>
            
            <p>
              Whether you're a writer looking to share your thoughts, a developer showcasing your projects, 
              or a business sharing updates, this platform provides all the tools you need to create engaging content.
            </p>
            
            <p>
              The platform emphasizes security, performance, and accessibility, ensuring a great experience for 
              both content creators and readers across all devices.
            </p>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4">
            {!user && (
              <Link 
                to="/register" 
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span>Get Started</span>
                <ChevronRight size={16} />
              </Link>
            )}
            
            <a 
              href="https://github.com/yourusername/blog-platform" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Github size={18} />
              <span>View Source</span>
            </a>
          </div>
        </div>
      </div>
      
      {/* Platform Features Section */}
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Platform Features</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Lock size={24} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User Authentication</h3>
          <p className="text-gray-600">
            Secure registration and authentication with password hashing and JWT for protected routes and user data.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Code size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Management</h3>
          <p className="text-gray-600">
            Create, edit, and delete blog posts with rich text formatting and multi-paragraph support with images.
                </p>
            </div>
            
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Image size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Image Upload</h3>
          <p className="text-gray-600">
            Upload and manage images for posts, profiles, and banners with cloud storage integration.
                </p>
            </div>
            
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Hash size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Hashtags</h3>
          <p className="text-gray-600">
            Add and manage hashtags for better content categorization and discovery by readers.
                </p>
            </div>
            
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Sparkles size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent Feed</h3>
          <p className="text-gray-600">
            Personalized content based on user interactions and followed hashtags for a tailored reading experience.
                </p>
            </div>
            
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Bell size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Notifications</h3>
          <p className="text-gray-600">
            Real-time notifications for new comments, likes, and follows to keep users engaged.
                </p>
            </div>
            
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <MessageSquare size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Comments</h3>
          <p className="text-gray-600">
            Interactive commenting system with nested replies for engaging discussions on articles.
                </p>
            </div>
            
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Heart size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Likes & Bookmarks</h3>
          <p className="text-gray-600">
            Like and bookmark posts for easy access later and to show appreciation for content.
                </p>
            </div>
            
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow p-6">
          <div className="bg-blue-100 p-3 rounded-lg inline-block mb-4">
            <Users size={24} className="text-blue-600" />
              </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User Profiles</h3>
          <p className="text-gray-600">
            Follow other users and view their profiles and posts to build a community of readers and writers.
                </p>
              </div>
            </div>
            
      {/* Technology Stack */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technology Stack</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Frontend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>React with TypeScript</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>Tailwind CSS for styling</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>React Router for navigation</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>Context API for state management</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>Lucide React for icons</span>
                </li>
              </ul>
            </div>
            
              <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Backend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>Node.js with Express</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>MongoDB with Mongoose</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>JWT for authentication</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>Cloudinary for image storage</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={16} className="text-blue-600 mr-2" />
                  <span>Swagger for API documentation</span>
                </li>
              </ul>
            </div>
              </div>
              </div>
            </div>
            
      {/* Contact Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Get In Touch</h2>
          <p className="text-gray-600 mb-6">
            Have questions about the platform? Want to contribute or report an issue?
          </p>
            
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:contact@example.com" 
              className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Mail size={18} />
              <span>Email Us</span>
            </a>
            
            <a 
              href="https://github.com/yourusername/blog-platform/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Github size={18} />
              <span>Report Issue</span>
            </a>
            
            <a 
              href="https://linkedin.com/in/yourusername" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Linkedin size={18} />
              <span>Connect</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 
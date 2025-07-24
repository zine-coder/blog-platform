import React from 'react';
import { Link } from 'react-router-dom';
import { PenTool, Heart, Code, Github, Linkedin, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Footer: React.FC = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg sm:rounded-xl blur opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                  <PenTool size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  BlogPlatform
                </span>
                <span className="text-sm text-gray-400">Powered by Zeno Coder</span>
              </div>
            </div>
            <p className="text-gray-300 mb-4 sm:mb-6 max-w-md leading-relaxed text-sm sm:text-base">
              A modern and intuitive blog platform to share your ideas, 
              discover new content and connect with a passionate community.
            </p>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400 flex-wrap">
              <Code size={16} />
              <span>Developed with</span>
              <Heart size={16} className="text-red-400 animate-pulse" />
              <span>by</span>
              <span className="text-blue-400 font-medium">Zeno Coder</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Navigation</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2 group text-sm sm:text-base"
                >
                  <span>Home</span>
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2 group text-sm sm:text-base"
                >
                  <span>About</span>
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link 
                  to="/create" 
                  className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2 group text-sm sm:text-base"
                >
                  <span>Create Article</span>
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              {!user && (
                <>
                  <li>
                    <Link 
                      to="/login" 
                      className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2 group text-sm sm:text-base"
                    >
                      <span>Login</span>
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      className="text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center space-x-2 group text-sm sm:text-base"
                    >
                      <span>Sign Up</span>
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="text-xs sm:text-sm break-all">contact@blogplatform.com</span>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-gray-400 mb-3">Follow Us</p>
                <div className="flex space-x-4">
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200 hover:scale-110 group"
                    aria-label="GitHub"
                  >
                    <Github size={16} className="text-gray-300 group-hover:text-white sm:w-[18px] sm:h-[18px]" />
                  </a>
                  <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-200 hover:scale-110 group"
                    aria-label="LinkedIn"
                  >
                    <Linkedin size={16} className="text-gray-300 group-hover:text-white sm:w-[18px] sm:h-[18px]" />
                  </a>
                  <a 
                    href="https://portfolio.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-all duration-200 hover:scale-110 group"
                    aria-label="Personal Website"
                  >
                    <ExternalLink size={16} className="text-gray-300 group-hover:text-white sm:w-[18px] sm:h-[18px]" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-center">
            <div className="text-sm text-gray-400 text-center">
              © {currentYear} BlogPlatform. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PenTool, LogOut, User, Home, Menu, X, ChevronDown, Search, Bell, Info, Filter, Clock, TrendingUp, Hash, Calendar, MessageCircle, Loader } from 'lucide-react';
import { notificationAPI, searchAPI } from '../../services/api';

// Remove static data
// const POPULAR_HASHTAGS = ['technology', 'programming', 'webdev', 'javascript', 'react', 'nodejs'];
// const POPULAR_SEARCHES = ['React hooks', 'MongoDB', 'Express API', 'TypeScript', 'Authentication'];

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Advanced search states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  
  // Dynamic data states
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [popularHashtags, setPopularHashtags] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>({
    dateRanges: [],
    sortOptions: []
  });
  const [isLoadingSearchData, setIsLoadingSearchData] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node) && 
          event.target !== searchInputRef.current) {
        setShowSearchDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Load unread notification count
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const response = await notificationAPI.getUnreadCount();
          setUnreadNotifications(response.count);
        } catch (error) {
          console.error('Error fetching notifications count:', error);
        }
      };
      
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);
  
  // Load dynamic search data when dropdown is shown
  useEffect(() => {
    if (showSearchDropdown) {
      fetchSearchData();
    }
  }, [showSearchDropdown]);
  
  // Fetch search data from API
  const fetchSearchData = async () => {
    setIsLoadingSearchData(true);
    try {
      // Fetch popular searches
      const searchesResponse = await searchAPI.getPopularSearches();
      if (searchesResponse.popularSearches) {
        setPopularSearches(
          searchesResponse.popularSearches
            .map((item: any) => item.query)
            .slice(0, 5)
        );
      }
      
      // Fetch popular hashtags
      const hashtagsResponse = await searchAPI.getPopularHashtags();
      if (hashtagsResponse.popularHashtags) {
        setPopularHashtags(
          hashtagsResponse.popularHashtags
            .map((item: any) => item.tag)
            .slice(0, 6)
        );
      }
      
      // Fetch filter options
      const filtersResponse = await searchAPI.getFilterOptions();
      if (filtersResponse.filters) {
        setFilterOptions(filtersResponse.filters);
      }
    } catch (error) {
      console.error('Error fetching search data:', error);
      // Fallback to empty arrays if API fails
      setPopularSearches([]);
      setPopularHashtags([]);
    } finally {
      setIsLoadingSearchData(false);
    }
  };

  const saveToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    
    const updatedSearches = [
      query,
      ...recentSearches.filter(s => s !== query)
    ].slice(0, 5); // Keep only 5 most recent searches
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Record search in backend
      try {
        await searchAPI.recordSearch(searchQuery.trim());
      } catch (error) {
        console.error('Error recording search:', error);
      }
      
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      saveToRecentSearches(searchQuery.trim());
      setSearchQuery('');
      setShowSearchDropdown(false);
      setMobileMenuOpen(false);
    }
  };
  
  const handleSearchInputFocus = () => {
    setShowSearchDropdown(true);
  };
  
  const handleSuggestionClick = async (suggestion: string) => {
    // Record search in backend
    try {
      await searchAPI.recordSearch(suggestion);
    } catch (error) {
      console.error('Error recording search:', error);
    }
    
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    saveToRecentSearches(suggestion);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setMobileMenuOpen(false);
  };
  
  const handleHashtagClick = (tag: string) => {
    navigate(`/search?hashtag=${encodeURIComponent(tag)}`);
    saveToRecentSearches(`#${tag}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setMobileMenuOpen(false);
  };
  
  const handleAdvancedSearch = () => {
    navigate('/search');
    setShowSearchDropdown(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Helper function to render date filters from API data
  const renderDateFilters = () => {
    if (filterOptions.dateRanges && filterOptions.dateRanges.length > 0) {
      return filterOptions.dateRanges.slice(0, 2).map((dateRange: any, index: number) => (
        <button
          key={`date-${index}`}
          type="button"
          onClick={() => navigate(`/search?date=${dateRange.id}`)}
          className="text-left px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
        >
          <Calendar size={14} className="text-blue-500 mr-1.5" />
          <span>{dateRange.label}</span>
          {dateRange.count > 0 && (
            <span className="ml-1 text-xs text-gray-500">({dateRange.count})</span>
          )}
        </button>
      ));
    }
    
    // Fallback if no data
    return (
      <>
        <button
          type="button"
          onClick={() => navigate('/search?date=today')}
          className="text-left px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
        >
          <Calendar size={14} className="text-blue-500 mr-1.5" />
          <span>Today</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/search?date=this-week')}
          className="text-left px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
        >
          <Calendar size={14} className="text-blue-500 mr-1.5" />
          <span>This Week</span>
        </button>
      </>
    );
  };
  
  // Helper function to render sort filters from API data
  const renderSortFilters = () => {
    if (filterOptions.sortOptions && filterOptions.sortOptions.length > 0) {
      return filterOptions.sortOptions.slice(1, 3).map((sortOption: any, index: number) => (
        <button
          key={`sort-${index}`}
          type="button"
          onClick={() => navigate(`/search?sort=${sortOption.id}`)}
          className="text-left px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
        >
          {sortOption.id === 'popular' ? (
            <TrendingUp size={14} className="text-blue-500 mr-1.5" />
          ) : (
            <MessageCircle size={14} className="text-blue-500 mr-1.5" />
          )}
          <span>{sortOption.label}</span>
        </button>
      ));
    }
    
    // Fallback if no data
    return (
      <>
        <button
          type="button"
          onClick={() => navigate('/search?sort=popular')}
          className="text-left px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
        >
          <TrendingUp size={14} className="text-blue-500 mr-1.5" />
          <span>Most Popular</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/search?sort=comments')}
          className="text-left px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
        >
          <MessageCircle size={14} className="text-blue-500 mr-1.5" />
          <span>Most Comments</span>
        </button>
      </>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-[2px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-1.5 rounded-lg">
                <PenTool size={18} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BlogPlatform
              </span>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block">Powered by Zeno Coder</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-6 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchInputFocus}
                  placeholder="Search articles or users..."
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <button
                    type="button"
                    onClick={handleAdvancedSearch}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Advanced search"
                  >
                    <Filter size={16} />
                  </button>
                </div>
              </div>
            </form>
            
            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div 
                ref={searchDropdownRef}
                className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                {searchQuery && (
                  <div className="p-2 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={handleSearch}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md flex items-center"
                    >
                      <Search size={16} className="text-blue-600 mr-2" />
                      <span>Search for "{searchQuery}"</span>
                    </button>
                  </div>
                )}
                
                {/* Quick filters */}
                <div className="p-2 border-b border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 px-3 mb-1">Quick Filters</h3>
                  <div className="grid grid-cols-2 gap-2 px-3 py-2">
                    {renderDateFilters()}
                    {renderSortFilters()}
                  </div>
                </div>
                
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div className="p-2 border-b border-gray-100">
                    <h3 className="text-xs font-medium text-gray-500 px-3 mb-1">Recent Searches</h3>
                    {recentSearches.map((search, index) => (
                      <button
                        key={`recent-${index}`}
                        type="button"
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md flex items-center"
                      >
                        <Clock size={16} className="text-gray-400 mr-2" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Popular searches */}
                <div className="p-2 border-b border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 px-3 mb-1">Popular Searches</h3>
                  {isLoadingSearchData ? (
                    <div className="flex justify-center py-2">
                      <Loader size={16} className="text-blue-500 animate-spin" />
                    </div>
                  ) : popularSearches.length > 0 ? (
                    popularSearches.map((search, index) => (
                      <button
                        key={`popular-${index}`}
                        type="button"
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md flex items-center"
                      >
                        <TrendingUp size={16} className="text-gray-400 mr-2" />
                        <span>{search}</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 px-3 py-2">No popular searches found</p>
                  )}
                </div>
                
                {/* Popular hashtags */}
                <div className="p-2">
                  <h3 className="text-xs font-medium text-gray-500 px-3 mb-1">Popular Hashtags</h3>
                  {isLoadingSearchData ? (
                    <div className="flex justify-center py-2">
                      <Loader size={16} className="text-blue-500 animate-spin" />
                    </div>
                  ) : popularHashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 px-3 py-2">
                      {popularHashtags.map((tag, index) => (
                        <button
                          key={`hashtag-${index}`}
                          type="button"
                          onClick={() => handleHashtagClick(tag)}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          <Hash size={12} className="mr-1" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 px-3 py-2">No popular hashtags found</p>
                  )}
                </div>
                
                <div className="p-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleAdvancedSearch}
                    className="w-full text-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center"
                  >
                    <Filter size={16} className="mr-2" />
                    <span>Advanced Search</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-6">
            <Link
              to="/"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center">
                <Home size={16} className="mr-1.5" />
                <span>Home</span>
              </span>
            </Link>
            
            <Link
              to="/about"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center">
                <Info size={16} className="mr-1.5" />
                <span>About</span>
              </span>
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/notifications"
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors relative"
                >
                  <span className="flex items-center">
                    <span className="relative">
                      <Bell size={16} className="mr-1.5" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </span>
                    <span>Notifications</span>
                  </span>
                </Link>
                
                <Link
                  to="/create"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <span className="flex items-center">
                    <PenTool size={16} className="mr-1.5" />
                    <span className="hidden lg:inline">Create Article</span>
                    <span className="lg:hidden">Create</span>
                  </span>
                </Link>
                
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors px-2 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate hidden sm:block">{user.username}</span>
                    <ChevronDown size={16} className={`transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200">
                      <Link 
                        to="/profile" 
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User size={16} className="mr-2.5" />
                        Profile
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button 
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} className="mr-2.5" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-3 md:hidden">
            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            
            {/* Mobile Notifications Button */}
            {user && (
              <Link
                to="/notifications"
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Link>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          {/* Mobile Search */}
          <div className="p-4 border-b border-gray-200">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles or users..."
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <button
                    type="button"
                    onClick={handleAdvancedSearch}
                    className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title="Advanced search"
                  >
                    <Filter size={16} />
                  </button>
                </div>
              </div>
            </form>
            
            {/* Mobile Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mt-3">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Recent Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <button
                      key={`recent-mobile-${index}`}
                      type="button"
                      onClick={() => handleSuggestionClick(search)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      <Clock size={12} className="mr-1" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mobile Quick Filters */}
            <div className="mt-3">
              <h3 className="text-xs font-medium text-gray-500 mb-1">Quick Filters</h3>
              <div className="grid grid-cols-2 gap-2">
                {filterOptions.dateRanges && filterOptions.dateRanges.length > 0 ? (
                  <>
                    {filterOptions.dateRanges.slice(0, 2).map((dateRange: any, index: number) => (
                      <button
                        key={`mobile-date-${index}`}
                        type="button"
                        onClick={() => {
                          navigate(`/search?date=${dateRange.id}`);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        <Calendar size={12} className="text-blue-500 mr-1" />
                        <span>{dateRange.label}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/search?date=today');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      <Calendar size={12} className="text-blue-500 mr-1" />
                      <span>Today</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/search?date=this-week');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      <Calendar size={12} className="text-blue-500 mr-1" />
                      <span>This Week</span>
                    </button>
                  </>
                )}
                
                {filterOptions.sortOptions && filterOptions.sortOptions.length > 0 ? (
                  <>
                    {filterOptions.sortOptions.slice(1, 3).map((sortOption: any, index: number) => (
                      <button
                        key={`mobile-sort-${index}`}
                        type="button"
                        onClick={() => {
                          navigate(`/search?sort=${sortOption.id}`);
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                      >
                        {sortOption.id === 'popular' ? (
                          <TrendingUp size={12} className="text-blue-500 mr-1" />
                        ) : (
                          <MessageCircle size={12} className="text-blue-500 mr-1" />
                        )}
                        <span>{sortOption.label}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/search?sort=popular');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      <TrendingUp size={12} className="text-blue-500 mr-1" />
                      <span>Popular</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/search?sort=comments');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      <MessageCircle size={12} className="text-blue-500 mr-1" />
                      <span>Most Comments</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile Popular Hashtags */}
            <div className="mt-3">
              <h3 className="text-xs font-medium text-gray-500 mb-1">Popular Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {isLoadingSearchData ? (
                  <div className="flex justify-center w-full py-2">
                    <Loader size={14} className="text-blue-500 animate-spin" />
                  </div>
                ) : popularHashtags.length > 0 ? (
                  popularHashtags.slice(0, 4).map((tag: string, index: number) => (
                    <button
                      key={`hashtag-mobile-${index}`}
                      type="button"
                      onClick={() => handleHashtagClick(tag)}
                      className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      <Hash size={12} className="mr-1" />
                      {tag}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No popular hashtags found</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-3 space-y-3">
            <Link
              to="/"
              className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home size={18} className="mr-3" />
              <span className="font-medium">Home</span>
            </Link>
            
            <Link
              to="/about"
              className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Info size={18} className="mr-3" />
              <span className="font-medium">About</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/create"
                  className="flex items-center px-3 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PenTool size={18} className="mr-3" />
                  <span className="font-medium">Create Article</span>
                </Link>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={18} className="text-blue-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={18} className="mr-3" />
                      <span className="font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} className="mr-3" />
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                <Link
                  to="/login"
                  className="block px-3 py-2.5 rounded-lg text-center font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2.5 rounded-lg text-center font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
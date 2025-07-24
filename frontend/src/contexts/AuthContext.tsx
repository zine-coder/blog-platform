import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI, checkTokenValidity } from '../services/api';
import { User } from '../models';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  ensureAuthenticated: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authAPI.getCurrentUser();
          setUser(data.user);
        } catch (error) {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const data = await authAPI.register(username, email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error: any) {
      // Handle specific registration errors
      if (error.response) {
        const errorData = await error.response.json();
        
        // Format the error with field information
        const enhancedError: any = new Error(errorData.error || 'Registration failed');
        
        // Add field information if available
        if (errorData.field) {
          enhancedError.field = errorData.field;
        }
        
        // Add suggestions if available
        if (errorData.suggestions) {
          enhancedError.suggestions = errorData.suggestions;
        }
        
        throw enhancedError;
      }
      
      // Re-throw original error if not from our API
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  const refreshUser = async () => {
    try {
      const data = await authAPI.getCurrentUser();
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };
  
  const ensureAuthenticated = async (): Promise<boolean> => {
    // Vérifier d'abord si le token est valide
    const isTokenValid = await checkTokenValidity();
    if (!isTokenValid) {
      console.warn('Token invalid or expired');
      logout();
      return false;
    }
    
    // Si nous n'avons pas de données utilisateur, essayer de les récupérer
    if (!user) {
      try {
        await refreshUser();
        return true;
      } catch (error) {
        console.error('Authentication failed:', error);
        logout();
        return false;
      }
    }
    
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        ensureAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
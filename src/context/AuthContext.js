import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, TICKETS_CACHE_KEY } from '../services/apiService';
import {
  loadAuthToken,
  saveAuthToken,
  clearAuthToken,
  setUnauthorizedHandler,
} from '../services/authToken';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('student'); // 'student' | 'staff' | 'admin'
  const [academicYear, setAcademicYear] = useState('1st Year');
  const [isLoading, setIsLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        await loadAuthToken();
        const storedUserJson = await AsyncStorage.getItem('@campuswash_user_session');
        if (storedUserJson) {
          const storedUser = JSON.parse(storedUserJson);
          setUser(storedUser);
          setProfile(storedUser);
          setRole(storedUser.role || 'student');
          setAcademicYear(storedUser.academic_year || '1st Year');
        }
      } catch (err) {
        console.log('Error restoring session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Sign In via GoDaddy API
  const signIn = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await apiService.login(email, password);
      const authenticatedUser = response.user;
      await saveAuthToken(response.token);

      setUser(authenticatedUser);
      setProfile(authenticatedUser);
      setRole(authenticatedUser.role || 'student');
      setAcademicYear(authenticatedUser.academic_year || '1st Year');

      try {
        await AsyncStorage.setItem(
          '@campuswash_user_session',
          JSON.stringify(authenticatedUser)
        );
      } catch (storageErr) {
        console.warn('AsyncStorage cache full, keeping session in memory:', storageErr);
      }

      setIsLoading(false);
      return authenticatedUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  // Sign Up via GoDaddy API
  const signUp = async (userData) => {
    setIsLoading(true);
    try {
      const response = await apiService.register(userData);
      const registeredUser = response.user;
      await saveAuthToken(response.token);

      setUser(registeredUser);
      setProfile(registeredUser);
      setRole(registeredUser.role || 'student');
      setAcademicYear(registeredUser.academic_year || '1st Year');

      try {
        await AsyncStorage.setItem(
          '@campuswash_user_session',
          JSON.stringify(registeredUser)
        );
      } catch (storageErr) {
        console.warn('AsyncStorage cache full, keeping session in memory:', storageErr);
      }

      setIsLoading(false);
      return registeredUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  // Sign Out. `remote: false` skips telling the server (used when the session already expired).
  const signOut = async ({ remote = true } = {}) => {
    setIsLoading(true);
    // Reads the token synchronously before it is cleared below; no need to wait for the server
    if (remote) apiService.logout();
    await clearAuthToken();
    setUser(null);
    setProfile(null);
    setRole('student');
    setAcademicYear('1st Year');
    try {
      await AsyncStorage.removeItem('@campuswash_user_session');
      await AsyncStorage.removeItem('@vastra_user_avatar');
      await AsyncStorage.removeItem(TICKETS_CACHE_KEY);
    } catch (e) {
      console.log('Error clearing session:', e);
    }
    setIsLoading(false);
  };

  // Server says the session is missing/expired: return to the login screen,
  // but only if someone is logged in (logged-out background polls also get 401s)
  const userRef = useRef(null);
  userRef.current = user;
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current) signOut({ remote: false });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Update Profile across the entire app instantly
  const updateProfile = async (updatedUserData) => {
    try {
      const mergedUser = { ...(profile || user || {}), ...updatedUserData };
      setUser(mergedUser);
      setProfile(mergedUser);
      if (mergedUser.role) setRole(mergedUser.role);
      if (mergedUser.academic_year) setAcademicYear(mergedUser.academic_year);

      try {
        await AsyncStorage.setItem(
          '@campuswash_user_session',
          JSON.stringify(mergedUser)
        );
      } catch (storageErr) {
        console.warn('AsyncStorage cache full:', storageErr);
      }

      return mergedUser;
    } catch (err) {
      console.log('Error updating profile in AuthContext:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        academicYear,
        isLoading,
        isAuthenticated: !!user,
        isStudent: role === 'student',
        isStaff: role === 'staff' || role === 'admin',
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

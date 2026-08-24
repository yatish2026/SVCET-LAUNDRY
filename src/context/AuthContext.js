import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/apiService';

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

      setUser(authenticatedUser);
      setProfile(authenticatedUser);
      setRole(authenticatedUser.role || 'student');
      setAcademicYear(authenticatedUser.academic_year || '1st Year');

      await AsyncStorage.setItem(
        '@campuswash_user_session',
        JSON.stringify(authenticatedUser)
      );

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

      setUser(registeredUser);
      setProfile(registeredUser);
      setRole(registeredUser.role || 'student');
      setAcademicYear(registeredUser.academic_year || '1st Year');

      await AsyncStorage.setItem(
        '@campuswash_user_session',
        JSON.stringify(registeredUser)
      );

      setIsLoading(false);
      return registeredUser;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    setUser(null);
    setProfile(null);
    setRole('student');
    setAcademicYear('1st Year');
    try {
      await AsyncStorage.removeItem('@campuswash_user_session');
      await AsyncStorage.removeItem('@vastra_user_avatar');
    } catch (e) {
      console.log('Error clearing session:', e);
    }
    setIsLoading(false);
  };

  // Update Profile across the entire app instantly
  const updateProfile = async (updatedUserData) => {
    try {
      const mergedUser = { ...(profile || user || {}), ...updatedUserData };
      setUser(mergedUser);
      setProfile(mergedUser);
      if (mergedUser.role) setRole(mergedUser.role);
      if (mergedUser.academic_year) setAcademicYear(mergedUser.academic_year);

      await AsyncStorage.setItem(
        '@campuswash_user_session',
        JSON.stringify(mergedUser)
      );

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

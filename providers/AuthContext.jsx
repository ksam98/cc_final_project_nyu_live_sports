import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import '@/lib/amplify-config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthState();

    const handleStorageChange = async (e) => {
      if (
        e.key === 'CognitoIdentityServiceProvider' ||
        e.key?.includes('CognitoIdentityServiceProvider')
      ) {
        await checkAuthState();
      }
    };

    const handleFocus = () => {
      checkAuthState();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkAuthState = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();

      let resolvedUserType = null;

      try {
        const attributes = await fetchUserAttributes();
        resolvedUserType = attributes['custom:userType'] || null;
      } catch {
        try {
          const session = await fetchAuthSession();
          resolvedUserType =
            session.tokens?.idToken?.payload?.['custom:userType'] || null;
        } catch (e) {
          console.warn('Could not resolve user type', e);
        }
      }

      setUser({
        username: currentUser.username,
      });
      setUserType(resolvedUserType);
    } catch {
      setUser(null);
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * LOGIN with safe retry if user is already signed in
   */
  const login = async (username, password) => {
    setError(null);

    try {
      const result = await signIn({ username, password });

      if (result.isSignedIn) {
        await checkAuthState();
        return { success: true };
      }

      return { success: false, error: 'Sign in incomplete' };
    } catch (err) {
      const message = err?.message || '';

      // ✅ Handle "already signed in" edge case
      if (message.includes('already signed in')) {
        try {
          console.warn('Stale Cognito session detected. Resetting...');
          await signOut({ global: false });

          const retry = await signIn({ username, password });
          if (retry.isSignedIn) {
            await checkAuthState();
            return { success: true };
          }
        } catch (retryErr) {
          const retryMessage =
            retryErr?.message || 'Failed to sign in after retry';
          setError(retryMessage);
          return { success: false, error: retryMessage };
        }
      }

      setError(message || 'Failed to sign in');
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password, userType) => {
    setError(null);
    try {
      const { userId, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            'custom:userType': userType,
          },
        },
      });

      return {
        success: true,
        userId,
        nextStep,
        message:
          nextStep?.signUpStep === 'CONFIRM_SIGN_UP'
            ? 'Check your email for verification.'
            : 'Registration successful',
      };
    } catch (err) {
      const errorMessage = err.message || 'Failed to register';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut({ global: false });
      setUser(null);
      setUserType(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to sign out';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        loading,
        error,
        login,
        register,
        logout,
        checkAuthState,
        isAuthenticated: !!user,
        isViewer: userType === 'viewer',
        isBroadcaster: userType === 'broadcaster',
        isAdmin: userType === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

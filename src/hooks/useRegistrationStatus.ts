import { useEffect, useState } from 'react';
import { getRegistrationCompleted, isUserLoggedIn } from '../../app/shared/utils/storage';

export const useRegistrationStatus = () => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const registered = await getRegistrationCompleted();
        setIsRegistered(registered);
      } catch (error) {
        console.error('Error checking registration status:', error);
        setIsRegistered(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const registered = await getRegistrationCompleted();
      setIsRegistered(registered);
    } catch (error) {
      console.error('Error refreshing registration status:', error);
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRegistered,
    isLoading,
    refreshStatus,
  };
};

export const useAuthStatus = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const loggedIn = await isUserLoggedIn();
        setIsLoggedIn(loggedIn);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const loggedIn = await isUserLoggedIn();
      setIsLoggedIn(loggedIn);
    } catch (error) {
      console.error('Error refreshing auth status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoggedIn,
    isLoading,
    refreshStatus,
  };
};

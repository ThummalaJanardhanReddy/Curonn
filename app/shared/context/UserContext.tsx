import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { getUserData } from '../utils/storage';

// User data interface
interface UserData {
  email: string;
  mobileNo: string;
  emailAddress: string;
  fullName: string;
  employeeId: string;
  isVerified: boolean;
  e_id?: number;
}

// Context interface
interface UserContextType {
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
  clearUserData: () => void;
}

// Default user data
const defaultUserData: UserData = {
  mobileNo: '',
  emailAddress: '',
  email:'',
  fullName: '',
  employeeId: '',
  isVerified: false,
};

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userData, setUserDataState] = useState<UserData>(defaultUserData);

  const setUserData = (data: Partial<UserData>) => {
    setUserDataState(prev => ({ ...prev, ...data }));
  };

  const clearUserData = () => {
    setUserDataState(defaultUserData);
  };

  const value: UserContextType = {
    userData,
    setUserData,
    clearUserData,
  };

  // Load userData from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedUserData = await getUserData();
        if (storedUserData) {
          setUserDataState((prev) => ({ ...prev, ...storedUserData }));
          console.log('[UserProvider] Loaded userData from storage:', storedUserData);
        } else {
          console.log('[UserProvider] No userData found in storage.');
        }
      } catch (err) {
        console.error('[UserProvider] Failed to load userData from storage:', err);
      }
    })();
  }, []);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;

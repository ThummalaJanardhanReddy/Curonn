import React, { createContext, ReactNode, useContext, useState } from 'react';

// User data interface
interface UserData {
  email: string;
  employeeId: string;
  isVerified: boolean;
}

// Context interface
interface UserContextType {
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
  clearUserData: () => void;
}

// Default user data
const defaultUserData: UserData = {
  email: '',
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

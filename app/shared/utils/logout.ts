import { router } from 'expo-router';
import { clearAllData } from './storage';

export const logout = async () => {
  try {
    // Clear all stored data
    await clearAllData();
    
    // Navigate to welcome screen
    router.replace('/welcome');
    
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
    // Still navigate even if clearing data fails
    router.replace('/welcome');
  }
};

export const resetRegistration = async () => {
  try {
    // Clear all stored data
    await clearAllData();
    
    // Navigate to welcome screen
    router.replace('/welcome');
    
    console.log('Registration reset successfully');
  } catch (error) {
    console.error('Error during registration reset:', error);
    // Still navigate even if clearing data fails
    router.replace('/welcome');
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  REGISTRATION_COMPLETED: 'registration_completed',
  USER_DATA: 'user_data',
  AUTH_TOKEN: 'auth_token',
  CART_DATA: 'cart_data',
} as const;

// Registration status
export const setRegistrationCompleted = async (completed: boolean) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.REGISTRATION_COMPLETED, JSON.stringify(completed));
  } catch (error) {
    console.error('Error saving registration status:', error);
  }
};

export const getRegistrationCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.REGISTRATION_COMPLETED);
    return value ? JSON.parse(value) : false;
  } catch (error) {
    console.error('Error reading registration status:', error);
    return false;
  }
};

// User data
export const saveUserData = async (userData: any) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error reading user data:', error);
    return null;
  }
};

// Auth token
export const saveAuthToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
};

// Cart data
export const saveCartData = async (cartData: any[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CART_DATA, JSON.stringify(cartData));
  } catch (error) {
    console.error('Error saving cart data:', error);
  }
};

export const getCartData = async (): Promise<any[]> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.CART_DATA);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error reading cart data:', error);
    return [];
  }
};

// Clear all data (logout)
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.REGISTRATION_COMPLETED,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.CART_DATA,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Check if user is logged in and registered
export const isUserLoggedIn = async (): Promise<boolean> => {
  try {
    const [registrationCompleted, authToken] = await Promise.all([
      getRegistrationCompleted(),
      getAuthToken(),
    ]);
    return registrationCompleted && !!authToken;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

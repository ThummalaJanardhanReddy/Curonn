import axios from 'axios';

// ✅ Create Axios instance
const axiosClient = axios.create({
  baseURL: 'https://api.curonn.com/api', // 🔹 Change this to your API base
  timeout: 10000, // optional timeout (ms)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    // If using async storage or secure storage for tokens:
    // const token = await AsyncStorage.getItem('authToken');
    const token = null; // replace this with your token retrieval logic

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Optionally log requests in dev mode (include params and resolved full URL)
    if (__DEV__) {
      const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
      // console.log('📤 API Request:', config.method?.toUpperCase(), fullUrl, {
      //   params: config.params,
      //   data: config.data,
      //   headers: config.headers,
      // });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      // console.log('📥 API Response:', response.status, response.config.url, response.data);
    }
    return response.data; // Always return just data for easier usage
  },
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized — maybe redirect to login');
      // Example: navigateToLoginScreen();
    }

    // console.error('❌ Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosClient;

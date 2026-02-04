// /d:/MCW/Zemplee/AndroidBuild/curronn/src/api/employee/employee.ts

// ✅ Centralized API route definitions for the entire app
// Supports both static and dynamic (parameterized) endpoints

export const EmployeeApi = {
  validate: '/Employee/validateEmployee',
  save: '/Employee/SaveEmployee',
  update: '/Employee/UpdateEmployee',
  getById: (id: string | number) => `/Employee/GetEmployeeById?id=${id}`,
  getAll: '/Employee/GetAllEmployees',
  delete: (id: string | number) => `/Employee/DeleteEmployee/${id}`,
  uploadExcel: '/Employee/UploadExcelEmployees',
  verifyOTP: '/Employee/verify-otp',
  updateMobileProfile: '/Employee/UpdateEmployeeMobileProfile',
} as const;

export const AuthApi = {
  login: '/Auth/Login',
  logout: '/Auth/Logout',
  refreshToken: '/Auth/RefreshToken',
  register: '/Auth/Register',
  forgotPassword: '/Auth/ForgotPassword',
  verifyEmail: '/Auth/VerifyEmail',
} as const;

export const UserApi = {
  getProfile: (userId: string | number) => `/User/GetProfile/${userId}`,
  updateProfile: '/User/UpdateProfile',
  uploadAvatar: '/User/UploadAvatar',
  changePassword: '/User/ChangePassword',
} as const;

export const HealthApi = {
  getMetrics: (clientId: string | number) => `/Health/GetMetrics/${clientId}`,
  getVitals: (clientId: string | number) => `/Health/GetVitals/${clientId}`,
  getDailySummary: (clientId: string | number, date: string) =>
    `/Health/GetDailySummary/${clientId}/${date}`,
  updateHealthData: '/Health/UpdateHealthData',
} as const;

export const NotificationApi = {
  getAll: (userId: string | number) => `/Notification/GetAll/${userId}`,
  markAsRead: (id: string | number) => `/Notification/MarkAsRead/${id}`,
  delete: (id: string | number) => `/Notification/Delete/${id}`,
} as const;

export const CommonApi = {
  getOrgList: '/Common/GetOrganizationList',
  getCountries: '/Common/GetCountries',
  getStates: (countryId: string | number) => `/Common/GetStates/${countryId}`,
  getCities: (stateId: string | number) => `/Common/GetCities/${stateId}`,
  uploadFile: '/Common/UploadFile',
} as const;

export const FamilyHistoryApi = {
  save: '/Histories/SaveFamily',
  getById: (id: string | number) => `/Histories/GetFamilyById/${id}`,
  getAll: '/Histories/GetAllFamily',
  delete: (id: string | number) => `/Histories/DeleteFamily/${id}`,
} as const;

// ✅ Unified export for convenience
export const ApiRoutes = {
  Employee: EmployeeApi,
  Auth: AuthApi,
  User: UserApi,
  Health: HealthApi,
  Notification: NotificationApi,
  Common: CommonApi,
  FamilyHistory: FamilyHistoryApi,
} as const;

export type ApiGroupKey = keyof typeof ApiRoutes;
export default ApiRoutes;

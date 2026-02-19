// /d:/MCW/Zemplee/AndroidBuild/curronn/src/api/employee/employee.ts

import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

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
  saveandupdaterelative: '/Employee/SaveOrUpdatePatientRelation',
  GetPatientRelations: (patientId: string | number) => `/Employee/GetPatientRelations?patientId=${patientId}`,
  GetByPatientRelationAsync: (relationId: string | number, patientId: string | number) => `/Employee/GetByPatientRelationAsync?relationId=${relationId}&patientId=${patientId}`,
  deletefamilymember: '/Employee/DeletePatientRelation'

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

/* Lab Test APIs */
export const LabTestsApi = {
  getGroups: '/LabTests/labtests/groups',
  getAll: '/LabTests/GetAll',
  globalSearch: '/LabTests/global-search',
} as const;

/* Lab package APIs */
export const LabPackagesApi = {
  getAll: '/LabPackages/GetAll',
  getById: (id: string | number) => `/LabPackages/GetById/${id}`,

} as const;

/* scans package APIs */
export const XrayApi = {
  getAll: '/Xray/GetAll',
  getById: (id: string | number) => `/Xray/GetById/${id}`,
} as const;

export const AddressApi = {
  getAddressByPatientId: (patientId: string | number) =>
    `/Employee/get-address-by-patientid?patientId=${patientId}`,
  saveAddress: '/Employee/save-update-address',
  setDfaultaddress: '/Employee/set-default-address',
  getAddressById: (addressId: string | number) => `/Employee/get-address-by-id?addressId=${addressId}`,

}

/* Master APIs */
export const MasterApi = {
  getmasterdata: (categoryId: string | number) => `/MasterData/GetMasterData?categoryId=${categoryId}`,

} as const;

export const LabOrdersApi = {
  saveUpdate: '/laborders/save-update',
  RazopayOrder: 'laborders/Razorpayment_Order_details',
  getLabOrderById: (labOrderId: string | number) => `/laborders/GetLabOrderById?labOrderId=${labOrderId}`,
  cancelOrder: '/laborders/CancelOrder'
} as const;

export const MedicalOrdersApi = {
  getMedicalOrderById: (medicineOrderId: string | number) => `/medicine-orders/${medicineOrderId}/cart`,
  medicineCancel: '/medicine-orders/cancel',
  getDrugGroups: '/medicine-orders/drug-groups',
  getActiveCart: '/medicine-orders/GetActiveCart',
  saveCartItem: '/medicine-orders/save-cart-item',
  updateCartQuantity: (cartId: number | string, quantity: number) =>
    `/medicine-orders/cart/update-quantity?cartId=${cartId}&quantity=${quantity}`,
  updateCartQuantityBase: '/medicine-orders/cart/update-quantity',
  deleteCartItem: '/medicine-orders/cart/delete',
  getMedicinesByGroup: (groupName: string, pageNo: number = 1, pageSize: number = 10, search?: string) =>
    `/medicine-orders/GetMedicinesByGroup?groupName=${encodeURIComponent(groupName)}&pageNo=${pageNo}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
} as const;

export const ConsultationApi = {
  getappointmentById: (appointmentId: string | number) => `Appointment/get-by-id/?appointmentId=${appointmentId}`,
  reshduledata: '/Appointment/reschedule'
} as const;

export const MyOrdersApi = {
  Allorders: '/Employee/my-orders',
} as const;

export const ArticlesApi = {
  Allarticles: '/Article/get-by-status?status=published',
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
  LabTests: LabTestsApi,
  LabPackages: LabPackagesApi,
  Xray: XrayApi,
  Address: AddressApi,
  Master: MasterApi,
  LabOrders: LabOrdersApi,
  MyOrders: MyOrdersApi,
  MedicalOrders: MedicalOrdersApi,
  ConsultationsData: ConsultationApi,
  ArticlesData: ArticlesApi,
} as const;

export type ApiGroupKey = keyof typeof ApiRoutes;
export default ApiRoutes;

export interface IPaginatedData<T> {
  items: T[];
  totalCount: number;
  pageNo: number;
  pageSize: number;
  isSuccess: boolean;
}
export interface IApiResponse<T> {
  isSuccess: boolean;
  message: string;
  responseCode: string;
  data: T;
  error: string | null;
}
export interface ISymptomMaster {
  symptomMasterId: number;
  speciality: string;
  specialityId: number;
  symptom: string;
  createdBy: number;
  modifiedBy: number | null;
  createdOn: string; // ISO string
  modifiedOn: string | null;
  deletedBy: number | null;
  deletedOn: string | null;
  isActive: boolean;
  totalCount: number;
}
export type ISymptomMasterApiResponse = IApiResponse<
  IPaginatedData<ISymptomMaster>
>;

export interface IAppointment {
  appointmentId: number;

  patientId: number;
  patientName: string;
  patientMobile: string;
  patientGender: string;
  patientAge: number;

  doctorId: number;
  doctorName: string;
  speciality: string;

  scheduleDate: string | null; // ISO date string
  scheduleBetween: string | null;

  statusId: number | null;
  statusName: string | null;

  scheduleTypeId: number | null;
  scheduleTypeName: string | null;
  scheduledBy: number | null;

  description: string | null;
  bookingId: string | null;

  symptoms: string | null;

  relationName: string | null;
  relationAge: number | null;
  relationGender: string | null;

  referedDoctor: number | null;

  isActive: boolean;

  createdOn: string | null;
  createdBy: number | null;

  modifiedOn: string | null;
  modifiedBy: number | null;

  totalCount: number;
}

export interface IEmployee {
  eId: number;
  fullName: string;
  employeeCode: string;
  roleId: number;

  emailAddress: string;
  mobileNo: string;
  alternatePhoneno: string | null;

  gender: string;
  age: number;

  height: string;
  heightMeasurement: string;
  weight: string;
  weightMeasurement: string;
  bmi: number | null;
  bloodGroup: string | null;

  address: string;
  locality: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;

  occupation: string | null;
  department: string;
  branch: string;
  companyName: string;

  medicalCondition: string;
  familyDoctor: number;

  partnerId: number;
  adminAccount: number;

  deviceToken: string | null;
  patientDisplayUid: string | null;

  joinDate: string | null;
  startDate: string | null;
  createdBy: number;

  noFamilyMembers: number;

  // Consultation Limits
  noDoctorChatConsultations: number;
  noDoctorVideoConsultations: number;
  noDoctorVoiceConsultations: number;

  noSpecialistChatConsultations: number;
  noSpecialistVideoConsultations: number;
  noSpecialistVoiceConsultations: number;

  // Remaining Consultations
  remainingChatConsultations: number;
  remainingVideoConsultations: number;
  remainingVoiceConsultations: number;

  // Discounts
  discountAmbulanceService: number;
  discountLabOrder: number;
  discountLabPackage: number;
  discountMedicineOrder: number;
  discountScanXray: number;
  discountOnAllPrograms: boolean;

  wellnessProgrammes: string; // "11,7" (comma-separated IDs)

  totalCount: number;
}
export interface IRelation {
  empRelationId: number;
  relationId: number;

  patientId: number;

  relationName: string;
  age: number;
  gender: string;

  createdBy: number;
  createdOn: string | null;
}
export interface IMaster {
  masterDataId: number;
  masterCategoryId: number;

  name: string;

  description: string | null;
  info: string | null;
  imagePath: string | null;

  sortOrder: number | null;

  isActive: boolean;

  createdBy: number;
  createdOn: string; // ISO date string
}

export interface ICreateAppointmentRequest {
  appointmentId?: number; // optional for create

  patientId: number;
  specialityId: number;

  isAppointmentAssigned: boolean;

  patientName: string;
  patientMobile: string;
  patientGender: string;
  patientAge: number;

  doctorId?: number;

  scheduleDate: string; // ISO format
  scheduleBetween: string;

  scheduleTypeId: number;
  scheduledBy: number;
  statusId: number;
  createdBy: number;

  description?: string;
  bookingId?: string;

  symptoms: string;

  relationName?: string;
  relationAge?: number;
  relationGender?: string;

  referedDoctor?: number;
}
export interface IConsultationType {
  label: string; // what UI shows
  value: number; // id
  key: "chat" | "video" | "phone"; // stable key
}

export interface ChatMessage {
  id: string;
  sender: "user" | "doctor";
  text?: string;
  attachment?: {
    uri: string;
    name: string;
    type?: string;
  };
  timestamp: string;
  isRead: boolean;
  status?: "sending" | "sent" | "failed";
}

export interface ChatHistoryItem {
  messageId: number;
  senderId: number;
  receiverId: number;

  messageText: string | null;
  fileUrl: string | null;

  isRead: boolean;
  sentOn: string; // ISO date string
  isActive: boolean;

  senderRole: string | null;
  receiverRole: string | null;

  appointmentId: number;
}

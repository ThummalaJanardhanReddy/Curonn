import { create } from "zustand";

export interface IUser {
  eId: number;
  roleId: number;
  fullName: string;
  joinDate: string | null;
  startDate: string | null;
  branch: string;
  partnerId: number;
  emailAddress: string;
  mobileNo: string;
  employeeCode: string;
  department: string;
  address: string;

  noFamilyMembers: number;

  noDoctorChatConsultations: number;
  noSpecialistChatConsultations: number;
  remainingChatConsultations: number;

  noDoctorVideoConsultations: number;
  noSpecialistVideoConsultations: number;
  remainingVideoConsultations: number;

  noDoctorVoiceConsultations: number;
  noSpecialistVoiceConsultations: number;
  remainingVoiceConsultations: number;

  discountMedicineOrder: number;
  discountLabOrder: number;
  discountLabPackage: number;
  discountScanXray: number;
  discountAmbulanceService: number;
  discountOnAllPrograms: boolean;

  wellnessProgrammes: string;

  totalCount: number;
  createdBy: number;
  companyName: string;
  adminAccount: number;

  gender: string;
  age: number;
  height: string;
  heightMeasurement: string;
  weight: string;
  weightMeasurement: string;

  bloodGroup: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  locality: string | null;
  occupation: string | null;
  city: string | null;

  alternatePhoneno: string | null;
  bmi: string | null;
  patientDisplayUid: string | null;

  medicalCondition: string;
  familyDoctor: number;

  deviceToken: string | null;
}

interface UserStore {
  user: IUser | null;

  setUser: (user: IUser) => void;

  updateUser: (data: Partial<IUser>) => void;

  clearUser: () => void;

  isLoggedIn: () => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,

  setUser: (user) => set({ user }),

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  clearUser: () => set({ user: null }),

  isLoggedIn: () => !!get().user,
}));
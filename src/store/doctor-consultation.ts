import { create } from "zustand";

interface DoctorConsultationState {
  doctorId?: number;
  doctorName?: string;
  departmentId?: number;
  departmentName?: string;
  departmentImage?: string;
  symptoms?: string[];
  slotId?: number;
  slotTime?: string;
  patientId?: number;
  orderId?: number;
  consultationType?: string;
  consultationTypeId?: number;

  setDoctor: (doctorId: number, doctorName: string) => void;
  setDepartment: (id: number, name: string, image: string) => void;
  setSymptoms: (symptoms: string[]) => void;
  setSlot: (slotId: number, slotTime: string) => void;
  setPatient: (patientId: number) => void;
  setOrder: (orderId: number) => void;
  setConsultationType: (name: string, id: number) => void;

  reset: () => void;
}

export const useDoctorConsultationStore = create<DoctorConsultationState>(
  (set) => ({
    symptoms: [],

    setDoctor: (doctorId, doctorName) => set({ doctorId, doctorName }),

    setDepartment: (departmentId, departmentName, departmentImage) =>
      set({ departmentId, departmentName, departmentImage }),

    setSymptoms: (symptoms) => set({ symptoms }),

    setSlot: (slotId, slotTime) => set({ slotId, slotTime }),

    setPatient: (patientId) => set({ patientId }),

    setOrder: (orderId) => set({ orderId }),
    setConsultationType: (name, id) =>
      set({ consultationType: name, consultationTypeId: id }),

    reset: () =>
      set({
        doctorId: undefined,
        doctorName: undefined,
        departmentId: undefined,
        departmentName: undefined,
        departmentImage: undefined,
        symptoms: [],
        slotId: undefined,
        slotTime: undefined,
        patientId: undefined,
        orderId: undefined,
        consultationType: undefined,
        consultationTypeId: undefined,
      }),
  }),
);

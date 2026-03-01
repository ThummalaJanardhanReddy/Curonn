import { create } from "zustand";

type VideoStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "ready"
  | "in-call"
  | "ended"
  | "error";

interface VideoState {
  appointmentId?: number;
  roomUrl?: string;
  status: VideoStatus;
  isConnected: boolean;
  errorMessage?: string;

  // Actions
  setAppointment: (appointmentId: number) => void;
  setConnected: () => void;
  setDisconnected: () => void;
  setReconnecting: () => void;
  setRoomReady: (roomUrl: string) => void;
  setInCall: () => void;
  endCall: () => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  appointmentId: undefined,
  roomUrl: undefined,
  status: "idle",
  isConnected: false,
  errorMessage: undefined,

  setAppointment: (appointmentId) =>
    set(() => ({
      appointmentId,
      status: "waiting",
      errorMessage: undefined,
    })),

  setConnected: () =>
    set(() => ({
      isConnected: true,
      status: "waiting",
    })),

  setDisconnected: () =>
    set(() => ({
      isConnected: false,
      status: "idle",
    })),

  setReconnecting: () =>
    set(() => ({
      status: "connecting",
    })),

  setRoomReady: (roomUrl) =>
    set(() => ({
      roomUrl,
      status: "ready",
    })),

  setInCall: () =>
    set(() => ({
      status: "in-call",
    })),

  endCall: () =>
    set(() => ({
      status: "ended",
    })),

  setError: (message) =>
    set(() => ({
      status: "error",
      errorMessage: message,
    })),

  reset: () =>
    set(() => ({
      appointmentId: undefined,
      roomUrl: undefined,
      status: "idle",
      isConnected: false,
      errorMessage: undefined,
    })),
}));
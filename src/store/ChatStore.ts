import { create } from "zustand";

/**
 * Message delivery status
 */
export type MessageStatus = "sending" | "sent" | "failed" | "received";

/**
 * Connection state
 */
export type ConnectionState = "connecting" | "connected" | "disconnected";

/**
 * Chat lifecycle status
 */
export type ChatStatus =
  | "connected"
  | "idle"
  | "active"
  | "busy"
  | "expired"
  | "ended";

/**
 * Attachment
 */
export interface Attachment {
  uri: string;
  name?: string;
  type?: string;
}

/**
 * Message model
 */
type MessageType = "text" | "image" | "pdf";

export interface Message {
  id: string;
  text?: string;
  sender: "user" | "doctor";
  timestamp: number; // store as number (Date.now())
  status?: MessageStatus;
  attachment?: Attachment;
  fileUrl?: string;
  type: MessageType;
}

export interface IAcceptRequest {
  success: boolean;
  doctorId: number;
  doctorName: string;
  patientId: number;
  appointmentId: number;
  message: string;
}

/**
 * Store state
 */
interface ChatState {
  sessionId?: string;

  messages: Message[];

  connectionState: ConnectionState;

  typing: boolean;

  chatEnabled: boolean;

  chatStatus: ChatStatus;

  chatEndedReason?: string;
  chatAcceptDetails?: IAcceptRequest;

  /**
   * Actions
   */
  setSession: (sessionId: string) => void;
  setChatAcceptDetails: (details: IAcceptRequest) => void;

  setMessages: (messages: Message[]) => void; // ✅ added properly

  addMessage: (message: Message) => void;

  updateMessageStatus: (id: string, status: MessageStatus) => void;

  setTyping: (typing: boolean) => void;

  setConnectionState: (state: ConnectionState) => void;

  setChatStatus: (status: ChatStatus) => void;

  setChatEnabled: (enabled: boolean) => void;

  endChat: (reason?: string) => void;

  clearChat: () => void;

  reset: () => void;
}

/**
 * Store
 */
export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: undefined,
  messages: [],
  connectionState: "disconnected",
  typing: false,
  chatEnabled: false,
  chatStatus: "idle",
  chatEndedReason: undefined,
  chatAcceptDetails: undefined,

  /**
   * SET SESSION
   */
  setSession: (sessionId) =>
    set({
      sessionId,
      chatEnabled: true,
      chatStatus: "idle",
      // chatStatus: 'connected',
      chatEndedReason: undefined,
    }),

  /**
   * SET ACCEPT DETAILS
   */
  setChatAcceptDetails: (details) =>
    set({ chatAcceptDetails: details }),

  /**
   * SET BULK MESSAGES (History)
   */
  setMessages: (messages) =>
    set({
      messages,
    }),

  /**
   * ADD SINGLE MESSAGE (Realtime)
   */
  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;

      return {
        messages: [...state.messages, message],
      };
    }),

  /**
   * UPDATE MESSAGE STATUS
   */
  updateMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status } : msg
      ),
    })),

  /**
   * SET TYPING
   */
  setTyping: (typing) =>
    set({
      typing,
    }),

  /**
   * SET CONNECTION STATE
   */
  setConnectionState: (connectionState) =>
    set({
      connectionState,
      chatEnabled: connectionState === "connected",
    }),

  /**
   * SET CHAT STATUS
   */
  setChatStatus: (chatStatus) =>
    set({
      chatStatus,
      chatEnabled: chatStatus === 'connected',
    }),

  /**
   * ENABLE / DISABLE CHAT
   */
  setChatEnabled: (chatEnabled) =>
    set({
      chatEnabled,
    }),

  /**
   * END CHAT
   */
  endChat: (reason) =>
    set({
      chatStatus: "ended",
      chatEnabled: false,
      typing: false,
      chatEndedReason: reason,
    }),

  /**
   * CLEAR CHAT
   */
  clearChat: () =>
    set({
      messages: [],
      typing: false,
      chatEnabled: false,
      chatStatus: "ended",
    }),

  /**
   * RESET STORE
   */
  reset: () =>
    set({
      sessionId: undefined,
      messages: [],
      connectionState: "disconnected",
      typing: false,
      chatEnabled: false,
      chatStatus: "idle",
      chatEndedReason: undefined,
      chatAcceptDetails: undefined,
    }),
}));
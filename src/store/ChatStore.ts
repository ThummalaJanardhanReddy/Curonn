import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
  | "idle"
  | "requested"
  | "connected"
  | "active"
  | "busy"
  | "expired"
  | "ended";

/**
 * Attachment metadata
 */
export interface Attachment {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
}

/**
 * Message types
 */
export type MessageType = "text" | "image" | "pdf" | "file";

/**
 * Message model
 */
export interface Message {
  id: string;
  text?: string;
  sender: "user" | "doctor";
  timestamp: number;
  status?: MessageStatus;
  attachment?: Attachment;
  fileUrl?: string;
  type: MessageType;
  sentOn?: string;
  isChat?: boolean;
  defaultMessage?: string;
}

/**
 * Chat acceptance details from doctor
 */
export interface ChatAcceptDetails {
  success: boolean;
  doctorId: number;
  doctorName: string;
  patientId: number;
  appointmentId: number;
  message: string;
  acceptedAt?: number; // Timestamp when accepted
}

/**
 * Chat end reasons
 */
export type ChatEndReason =
  | "user_ended"
  | "doctor_ended"
  | "timeout"
  | "error"
  | "expired";

/**
 * Store state
 */
interface ChatState {
  // Session & Identity
  sessionId: string | null;
  requestId: number | null;
  chatAcceptDetails: ChatAcceptDetails | null;

  // Messages
  messages: Message[];

  // Connection & Status
  connectionState: ConnectionState;
  chatStatus: ChatStatus;
  chatEnabled: boolean;

  // UI State
  typing: boolean;

  // End State
  chatEndedReason: ChatEndReason | null;

  // Actions - Session Management
  setSession: (sessionId: string) => void;
  setRequestId: (requestId: number) => void;
  setChatAcceptDetails: (details: ChatAcceptDetails) => void;
  clearChatAcceptDetails: () => void;

  // Actions - Messages
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addMessages: (messages: Message[]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  updateMessageStatus: (id: string, status: MessageStatus) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;

  // Actions - Connection & Status
  setConnectionState: (state: ConnectionState) => void;
  setChatStatus: (status: ChatStatus) => void;
  setChatEnabled: (enabled: boolean) => void;

  // Actions - UI
  setTyping: (typing: boolean) => void;

  // Actions - Lifecycle
  startChat: (sessionId: string) => void;
  endChat: (reason?: ChatEndReason) => void;
  clearChat: () => void;
  reset: () => void;

  // Getters
  isConnected: () => boolean;
  isChatActive: () => boolean;
  hasMessages: () => boolean;
  getMessageById: (id: string) => Message | undefined;
  getPendingMessages: () => Message[];
}

/**
 * Initial state
 */
const initialState = {
  sessionId: null,
  requestId: null,
  chatAcceptDetails: null,
  messages: [],
  connectionState: "disconnected" as ConnectionState,
  typing: false,
  chatEnabled: false,
  chatStatus: "idle" as ChatStatus,
  chatEndedReason: null,
};

/**
 * Chat Store
 */
export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ==================== SESSION MANAGEMENT ====================

      setSession: (sessionId) => {
        console.log("[ChatStore] Setting session:", sessionId);
        set({
          sessionId,
          chatEndedReason: null,
        });
      },

      setRequestId: (requestId) => {
        console.log("[ChatStore] Setting request ID:", requestId);
        set({
          requestId,
          chatEnabled: false,
          chatStatus: "requested",
        });
      },

      setChatAcceptDetails: (details) => {
        console.log("[ChatStore] Setting chat accept details:", details);
        
        // Validation
        if (!details.doctorId || !details.patientId || !details.appointmentId) {
          console.error("[ChatStore] Invalid accept details:", details);
          return;
        }

        set({
          chatAcceptDetails: {
            ...details,
            acceptedAt: details.acceptedAt || Date.now(),
          },
          chatStatus: "connected",
          chatEnabled: true,
        });
      },

      clearChatAcceptDetails: () => {
        console.log("[ChatStore] Clearing chat accept details");
        set({ chatAcceptDetails: null });
      },

      // ==================== MESSAGES ====================

      setMessages: (messages) => {
        console.log("[ChatStore] Setting messages:", messages.length);
        set({ messages });
      },

      addMessage: (message) => {
        const state = get();
        
        // Prevent duplicate messages
        const exists = state.messages.some((m) => m.id === message.id);
        if (exists) {
          console.warn("[ChatStore] Message already exists:", message.id);
          return;
        }

        console.log("[ChatStore] Adding message:", message.id);
        set({
          messages: [...state.messages, message],
        });
      },

      addMessages: (newMessages) => {
        const state = get();
        
        // Filter out duplicates
        const uniqueMessages = newMessages.filter(
          (newMsg) => !state.messages.some((m) => m.id === newMsg.id)
        );

        if (uniqueMessages.length === 0) {
          console.warn("[ChatStore] No new messages to add");
          return;
        }

        console.log("[ChatStore] Adding messages:", uniqueMessages.length);
        set({
          messages: [...state.messages, ...uniqueMessages],
        });
      },

      updateMessage: (id, updates) => {
        console.log("[ChatStore] Updating message:", id, updates);
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },

      updateMessageStatus: (id, status) => {
        console.log("[ChatStore] Updating message status:", id, status);
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, status } : msg
          ),
        }));
      },

      deleteMessage: (id) => {
        console.log("[ChatStore] Deleting message:", id);
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }));
      },

      clearMessages: () => {
        console.log("[ChatStore] Clearing all messages");
        set({ messages: [] });
      },

      // ==================== CONNECTION & STATUS ====================

      setConnectionState: (connectionState) => {
        console.log("[ChatStore] Setting connection state:", connectionState);
        set({ connectionState });
      },

      setChatStatus: (chatStatus) => {
        console.log("[ChatStore] Setting chat status:", chatStatus);
        set({
          chatStatus,
          chatEnabled: chatStatus === "connected" || chatStatus === "active",
        });
      },

      setChatEnabled: (chatEnabled) => {
        console.log("[ChatStore] Setting chat enabled:", chatEnabled);
        set({ chatEnabled });
      },

      // ==================== UI ====================

      setTyping: (typing) => {
        set({ typing });
      },

      // ==================== LIFECYCLE ====================

      startChat: (sessionId) => {
        console.log("[ChatStore] Starting chat:", sessionId);
        set({
          sessionId,
          chatStatus: "connected",
          chatEnabled: true,
          chatEndedReason: null,
          connectionState: "connected",
        });
      },

      endChat: (reason = "user_ended") => {
        console.log("[ChatStore] Ending chat:", reason);
        set({
          typing: false,
          chatEnabled: false,
          chatStatus: "ended",
          chatEndedReason: reason,
          // connectionState: "disconnected",
        });
      },

      clearChat: () => {
        console.log("[ChatStore] Clearing chat");
        set({
          messages: [],
          typing: false,
          chatEnabled: false,
          chatStatus: "idle",
        });
      },

      reset: () => {
        console.log("[ChatStore] Resetting store");
        set({
          ...initialState,
          // Preserve chatAcceptDetails if needed for history
          // chatAcceptDetails: get().chatAcceptDetails,
        });
      },

      // ==================== GETTERS ====================

      isConnected: () => {
        const state = get();
        return state.connectionState === "connected";
      },

      isChatActive: () => {
        const state = get();
        return (
          state.chatEnabled &&
          (state.chatStatus === "connected" || state.chatStatus === "active")
        );
      },

      hasMessages: () => {
        return get().messages.length > 0;
      },

      getMessageById: (id) => {
        return get().messages.find((msg) => msg.id === id);
      },

      getPendingMessages: () => {
        return get().messages.filter(
          (msg) => msg.status === "sending" || msg.status === "failed"
        );
      },
    }),
    { name: "ChatStore" }
  )
);

// ==================== SELECTORS ====================

/**
 * Optimized selectors for better performance
 */
export const selectMessages = (state: ChatState) => state.messages;
export const selectChatStatus = (state: ChatState) => state.chatStatus;
export const selectChatEnabled = (state: ChatState) => state.chatEnabled;
export const selectTyping = (state: ChatState) => state.typing;
export const selectConnectionState = (state: ChatState) => state.connectionState;
export const selectChatAcceptDetails = (state: ChatState) => state.chatAcceptDetails;
export const selectSessionId = (state: ChatState) => state.sessionId;
export const selectIsConnected = (state: ChatState) => state.isConnected();
export const selectIsChatActive = (state: ChatState) => state.isChatActive();

// ==================== HOOKS ====================

/**
 * Custom hook for chat status
 */
export const useChatStatus = () => {
  const chatStatus = useChatStore(selectChatStatus);
  const chatEnabled = useChatStore(selectChatEnabled);
  const connectionState = useChatStore(selectConnectionState);
  const isChatActive = useChatStore(selectIsChatActive);

  return {
    chatStatus,
    chatEnabled,
    connectionState,
    isChatActive,
    isIdle: chatStatus === "idle",
    isRequested: chatStatus === "requested",
    isConnected: chatStatus === "connected",
    isActive: chatStatus === "active",
    isEnded: chatStatus === "ended",
  };
};

/**
 * Custom hook for chat acceptance details
 */
export const useChatAcceptance = () => {
  const details = useChatStore(selectChatAcceptDetails);
  const setChatAcceptDetails = useChatStore((state) => state.setChatAcceptDetails);
  const clearChatAcceptDetails = useChatStore((state) => state.clearChatAcceptDetails);

  return {
    acceptDetails: details,
    isAccepted: details !== null,
    doctorName: details?.doctorName,
    doctorId: details?.doctorId,
    appointmentId: details?.appointmentId,
    acceptedAt: details?.acceptedAt,
    setAcceptDetails: setChatAcceptDetails,
    clearAcceptDetails: clearChatAcceptDetails,
  };
};
import * as signalR from "@microsoft/signalr";
import { useChatStore } from "../store/ChatStore";
import { useUserStore } from "../store/UserStore";
import axiosClient from "./axiosClient";
import type { Message, ChatAcceptDetails, MessageType } from "../store/ChatStore";

// Constants
const SIGNALR_HUB_URL = "https://api.curonnhealth.com/hubs/chat";
const S3_BASE_URL = "https://curonndatabucket.s3.ap-south-1.amazonaws.com/";
const MAX_RECONNECT_DELAY_MS = 5000;
const INITIAL_RECONNECT_DELAY_MS = 1000;

// Types
interface ReceiveMessagePayload {
  messageId?: string;
  messageText?: string;
  message?: string;
  senderId: number;
  sentOn: string;
  fileUrl?: string;
  defaultMessage?: string;
}

interface ChatAcceptedPayload extends ChatAcceptDetails {}

interface ConsultationCompletedPayload {
  appointmentId: number;
  reason?: string;
}

interface SendMessageParams {
  text: string;
  senderId?: number;
  receiverId?: number;
  appointmentId?: number;
  file?: {
    uri: string;
    name?: string;
    type?: string;
  };
  userType?: "user" | "doctor";
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  /**
   * Get current user ID from store
   */
  private get userId(): number | undefined {
    return useUserStore.getState().user?.eId;
  }

  /**
   * Check if connection is active
   */
  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Get connection state
   */
  get connectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  /**
   * CONNECT TO SIGNALR HUB
   */
  async connect(sessionId?: string): Promise<boolean> {
    try {
      // Prevent duplicate connections
      if (this.isConnected) {
        console.log("[SignalR] Already connected");
        return true;
      }

      if (this.isConnecting) {
        console.log("[SignalR] Connection already in progress");
        return false;
      }

      if (!this.userId) {
        console.log("[SignalR] Cannot connect: No user ID available");
        return false;
      }

      this.isConnecting = true;
      useChatStore.getState().setConnectionState("connecting");

      // Build connection
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) => {
            const delay = Math.min(
              INITIAL_RECONNECT_DELAY_MS * (ctx.previousRetryCount + 1),
              MAX_RECONNECT_DELAY_MS
            );
            console.log(`[SignalR] Retry attempt ${ctx.previousRetryCount + 1}, delay: ${delay}ms`);
            return delay;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register listeners BEFORE starting connection
      this.registerListeners();

      // Start connection
      await this.connection.start();
      console.log("[SignalR] Connection started");

      // Join user group
      await this.joinUserGroup();

      // Update store
      useChatStore.getState().setConnectionState("connected");

      if (sessionId) {
        useChatStore.getState().setSession(sessionId);
      }

      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log("✅ [SignalR] Connected successfully");

      return true;
    } catch (error) {
      console.log("❌ [SignalR] Connection failed:", error);
      useChatStore.getState().setConnectionState("disconnected");
      this.isConnecting = false;
      this.cleanup();
      return false;
    }
  }

  /**
   * JOIN USER GROUP
   */
  private async joinUserGroup(): Promise<void> {
    if (!this.connection || !this.userId) {
      throw new Error("Cannot join group: No connection or user ID");
    }

    try {
      await this.connection.invoke("JoinPatientGroup", this.userId);
      console.log(`✅ [SignalR] Joined patient group: ${this.userId}`);
    } catch (error) {
      console.log("❌ [SignalR] Failed to join group:", error);
      throw error;
    }
  }

  /**
   * REGISTER EVENT LISTENERS
   */
  private registerListeners(): void {
    if (!this.connection) return;

    // Chat Accepted
    this.connection.on("ChatAccepted", this.handleChatAccepted.bind(this));

    // Receive Message
    this.connection.on("ReceiveMessage", this.handleReceiveMessage.bind(this));

    // Typing Indicators
    this.connection.on("Typing", this.handleTyping.bind(this));
    this.connection.on("StopTyping", this.handleStopTyping.bind(this));

    // Chat Status Events
    this.connection.on("ChatBusy", this.handleChatBusy.bind(this));
    this.connection.on("ChatExpired", this.handleChatExpired.bind(this));
    this.connection.on("ChatEnded", this.handleChatEnded.bind(this));
    this.connection.on("ConsultationCompleted", this.handleConsultationCompleted.bind(this));

    // Connection Events
    this.connection.onclose(this.handleConnectionClose.bind(this));
    this.connection.onreconnecting(this.handleReconnecting.bind(this));
    this.connection.onreconnected(this.handleReconnected.bind(this));
  }

  /**
   * EVENT HANDLERS
   */

  private handleChatAccepted(response: ChatAcceptedPayload): void {
    console.log("✅ [SignalR] Chat accepted:", response);
    
    const chatStore = useChatStore.getState();
    chatStore.setChatAcceptDetails(response);
    // Status is automatically set to 'connected' in setChatAcceptDetails
  }

  private handleReceiveMessage(payload: ReceiveMessagePayload): void {
    console.log("📩 [SignalR] Message received:", payload);

    const messageId = payload.messageId ?? `server_${Date.now()}`;
    const chatStore = useChatStore.getState();

    // Check if message is from current user (don't add own messages)
    if (payload.senderId === this.userId) {
      console.log("[SignalR] Ignoring own message");
      return;
    }

    // Check for duplicates
    const isDuplicate = chatStore.messages.some(
      (m) => m.id === messageId || m.sentOn === payload.sentOn
    );

    if (isDuplicate) {
      console.log("[SignalR] Duplicate message, ignoring");
      return;
    }

    // Determine message type
    const messageType = this.getMessageType(payload.fileUrl);
    const messageText = payload.messageText ?? payload.message ?? "";

    // Create message object
    const message: Message = {
      id: messageId,
      text: messageText,
      sender: "doctor",
      timestamp: Date.now(),
      sentOn: payload.sentOn,
      status: "received",
      type: messageType,
      attachment: payload.fileUrl
        ? {
            uri: `${S3_BASE_URL}${payload.fileUrl}`,
            name: this.getFileName(payload.fileUrl),
            type: this.getFileExtension(payload.fileUrl),
          }
        : undefined,
      defaultMessage: payload.defaultMessage,
    };

    chatStore.addMessage(message);
  }

  private handleTyping(): void {
    useChatStore.getState().setTyping(true);
  }

  private handleStopTyping(): void {
    useChatStore.getState().setTyping(false);
  }

  private handleChatBusy(): void {
    console.log("⏳ [SignalR] Chat is busy");
    useChatStore.getState().setChatStatus("busy");
  }

  private handleChatExpired(): void {
    console.log("⏱️ [SignalR] Chat expired");
    useChatStore.getState().setChatStatus("expired");
  }

  private handleChatEnded(): void {
    console.log("👋 [SignalR] Chat ended by doctor");
    useChatStore.getState().endChat("doctor_ended");
  }

  private handleConsultationCompleted(data: ConsultationCompletedPayload): void {
    console.log("✅ [SignalR] Consultation completed:", data);
    useChatStore.getState().endChat("doctor_ended");
  }

  private handleConnectionClose(error?: Error): void {
    console.log("❌ [SignalR] Connection closed:", error);
    useChatStore.getState().setConnectionState("disconnected");
    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[SignalR] Max reconnection attempts reached");
      useChatStore.getState().endChat("error");
    }
  }

  private handleReconnecting(error?: Error): void {
    console.log("🔄 [SignalR] Reconnecting...", error);
    useChatStore.getState().setConnectionState("connecting");
  }

  private handleReconnected(connectionId?: string): void {
    console.log("✅ [SignalR] Reconnected:", connectionId);
    useChatStore.getState().setConnectionState("connected");
    this.reconnectAttempts = 0;

    // Rejoin group after reconnection
    this.joinUserGroup().catch((error) => {
      console.log("[SignalR] Failed to rejoin group after reconnection:", error);
    });
  }

  /**
   * SEND MESSAGE
   */
  async sendMessage(params: SendMessageParams): Promise<boolean> {
    const { text, senderId, receiverId, appointmentId, file, userType = "user" } = params;

    if (!text && !file) {
      console.warn("[SignalR] Cannot send empty message");
      return false;
    }

    if (!this.isConnected) {
      console.log("[SignalR] Cannot send message: Not connected");
      return false;
    }

    const messageId = `local_${Date.now()}`;
    const chatStore = useChatStore.getState();

    // Add optimistic message to UI
    const optimisticMessage: Message = {
      id: messageId,
      text,
      sender: userType,
      timestamp: Date.now(),
      status: "sending",
      type: file ? this.getMessageType(file.name) : "text",
      attachment: file,
    };

    chatStore.addMessage(optimisticMessage);

    try {
      await this.sendMessageToServer({
        senderId,
        receiverId,
        message: text,
        appointmentId,
        file,
      });

      chatStore.updateMessageStatus(messageId, "sent");
      console.log("✅ [SignalR] Message sent successfully");
      return true;
    } catch (error) {
      console.log("❌ [SignalR] Failed to send message:", error);
      chatStore.updateMessageStatus(messageId, "failed");
      return false;
    }
  }

  /**
   * SEND MESSAGE TO SERVER VIA REST API
   */
  private async sendMessageToServer(params: {
    senderId?: number;
    receiverId?: number;
    message?: string;
    appointmentId?: number;
    file?: any;
  }): Promise<void> {
    const { senderId, receiverId, message, appointmentId, file } = params;

    const formData = new FormData();

    if (senderId != null) {
      formData.append("SenderId", senderId.toString());
    }

    if (receiverId != null) {
      formData.append("ReceiverId", receiverId.toString());
    }

    if (message) {
      formData.append("Message", message);
    }

    if (appointmentId != null) {
      formData.append("AppointmentId", appointmentId.toString());
    }

    if (file) {
      formData.append("File", {
        uri: file.uri,
        name: file.name ?? "file.jpg",
        type: file.type ?? "image/jpeg",
      } as any);
    }

    const response = await axiosClient.post("/chat/TestsendImage", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("[SignalR] Server response:", response);
  }

  /**
   * SEND TYPING INDICATOR
   */
  async sendTyping(): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke("Typing");
    } catch (error) {
      console.log("[SignalR] Failed to send typing indicator:", error);
    }
  }

  /**
   * SEND STOP TYPING INDICATOR
   */
  async sendStopTyping(): Promise<void> {
    if (!this.isConnected || !this.connection) return;

    try {
      await this.connection.invoke("StopTyping");
    } catch (error) {
      console.log("[SignalR] Failed to send stop typing indicator:", error);
    }
  }

  /**
   * DISCONNECT
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await this.connection.stop();
        console.log("✅ [SignalR] Disconnected");
      }
      this.cleanup();
    } catch (error) {
      console.log("❌ [SignalR] Disconnect error:", error);
      this.cleanup();
    }
  }

  /**
   * CLEANUP
   */
  private cleanup(): void {
    this.connection = null;
    this.isConnecting = false;
    useChatStore.getState().setConnectionState("disconnected");
  }

  /**
   * UTILITY METHODS
   */

  private getMessageType(fileUrl?: string): MessageType {
    if (!fileUrl) return "text";

    const extension = this.getFileExtension(fileUrl)?.toLowerCase();

    if (!extension) return "text";

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return "image";
    }

    if (extension === "pdf") {
      return "pdf";
    }

    return "file";
  }

  private getFileExtension(filename?: string): string | undefined {
    if (!filename) return undefined;
    return filename.split(".").pop()?.toLowerCase();
  }

  private getFileName(filepath?: string): string {
    if (!filepath) return "file";
    return filepath.split("/").pop() || "file";
  }
}

// Export singleton instance
export const signalRService = new SignalRService();

// Export type for external use
export type { SignalRService };
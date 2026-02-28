import * as signalR from "@microsoft/signalr";
import { useChatStore } from "../store/ChatStore";
import axiosClient from "./axiosClient";

class SignalRService {
  connection: signalR.HubConnection | null = null;

  /**
   * CONNECT
   */
  async connect(sessionId?: string) {
    try {
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        console.log("Already connected");
        return;
      }

      useChatStore.getState().setConnectionState("connecting");

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("https://api.curonn.com/hubs/chat", {
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) =>
            Math.min(1000 * (ctx.previousRetryCount + 1), 5000),
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // 🔥 IMPORTANT: Register listeners BEFORE start
      this.registerListeners();

      await this.connection.start();

      console.log("✅ SignalR connected");
      console.log("Connection state:", this.connection.state);

      useChatStore.getState().setConnectionState("connected");

      if (sessionId) {
        useChatStore.getState().setSession(sessionId);
      }
    } catch (err) {
      console.log("❌ SignalR connect error:", err);
      useChatStore.getState().setConnectionState("disconnected");
    }
  }

  /**
   * REGISTER LISTENERS
   */
  private registerListeners() {
    if (!this.connection) return;

    /**
     * RECEIVE MESSAGE
     */
    this.connection.on("ReceiveMessage", (message: any) => {
      console.log("📩 Received:", message);

      const messageId = message.id ?? `server_${Date.now()}`;

      const exists = useChatStore
        .getState()
        .messages.some((m) => m.id === messageId);

      if (exists) return;

      useChatStore.getState().addMessage({
        id: messageId,
        text: message.messageText ?? message.message ?? "",
        sender: "doctor",
        timestamp: Date.now(),
        status: "received",
      });
    });

    /**
     * TYPING
     */
    this.connection.on("Typing", () => useChatStore.getState().setTyping(true));

    this.connection.on("StopTyping", () =>
      useChatStore.getState().setTyping(false),
    );

    /**
     * CHAT BUSY
     */
    this.connection.on("ChatBusy", () => {
      console.log("ChatBusy");
      useChatStore.getState().setChatStatus("busy");
      useChatStore.getState().setChatEnabled(false);
    });

    /**
     * CHAT EXPIRED
     */
    this.connection.on("ChatExpired", () => {
      console.log("ChatExpired");
      useChatStore
        .getState()
        .endChat("No doctors available. Please try again later.");
    });

    /**
     * CHAT ENDED
     */
    this.connection.on("ChatEnded", () => {
      console.log("ChatEnded");
      useChatStore.getState().endChat("Consultation ended");
    });

    /**
     * CONNECTION EVENTS
     */
    this.connection.onclose((err) => {
      console.log("❌ SignalR disconnected", err);
      useChatStore.getState().setConnectionState("disconnected");
    });

    this.connection.onreconnecting(() => {
      console.log("🔄 Reconnecting...");
      useChatStore.getState().setConnectionState("connecting");
    });

    this.connection.onreconnected(() => {
      console.log("✅ Reconnected");
      useChatStore.getState().setConnectionState("connected");
    });
  }

  /**
   * SEND MESSAGE
   */
  async sendMessage(
    text: string,
    senderId?: number,
    receiverId?: number,
    appointmentId?: number,
    file?: any,
    userType?: "user" | "doctor",
  ) {
    if (!text && !file) return;

    const messageId = `local_${Date.now()}`;

    useChatStore.getState().addMessage({
      id: messageId,
      text,
      sender: userType || "user",
      timestamp: Date.now(),
      status: "sending",
      attachment: file,
    });

    try {
      await this.handleSend(senderId, receiverId, text, appointmentId, file);
      useChatStore.getState().updateMessageStatus(messageId, "sent");
    } catch (err) {
      console.log("Send failed:", err);
      useChatStore.getState().updateMessageStatus(messageId, "failed");
    }
  }

  /**
   * REST SEND API
   */
  private async handleSend(
    senderId?: number,
    receiverId?: number,
    message?: string,
    appointmentId?: number,
    file?: any,
  ) {
    const formData = new FormData();

    if (senderId != null) formData.append("SenderId", senderId.toString());

    if (receiverId != null)
      formData.append("ReceiverId", receiverId.toString());

    if (message) formData.append("Message", message);

    if (appointmentId != null)
      formData.append("AppointmentId", appointmentId.toString());

    if (file) {
      formData.append("File", {
        uri: file.uri,
        name: file.name ?? "file.jpg",
        type: file.type ?? "image/jpeg",
      } as any);
    }

    await axiosClient.post("/chat/send", formData, {
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
    });
  }

  /**
   * DISCONNECT
   */
  async disconnect() {
    try {
      await this.connection?.stop();
      this.connection = null;
      useChatStore.getState().reset();
      console.log("SignalR disconnected");
    } catch (err) {
      console.log("Disconnect error:", err);
    }
  }
}

export const signalRService = new SignalRService();

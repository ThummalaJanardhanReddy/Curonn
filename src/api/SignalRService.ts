import * as signalR from "@microsoft/signalr";
import { useChatStore } from "../store/ChatStore";
import axiosClient from "./axiosClient";
import { useUserStore } from "../store/UserStore";

const S3Link = `https://curonndatabucket.s3.ap-south-1.amazonaws.com/`;

class SignalRService {
  connection: signalR.HubConnection | null = null;

  private get UserId() {
    return useUserStore.getState().user?.eId;
  }

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

      await this.connection?.start();

      try {
        if (!this.connection) return;
        await this.connection.invoke("JoinPatientGroup", this.UserId);
        console.log("✅ Joined chat group:", this.UserId);
      } catch (invokeError) {
        console.log("❌ Join chat UserGroup failed:", invokeError);

        await this.connection.stop();
        this.connection = null;

        return;
      }
      useChatStore.getState().setChatStatus("connected");
      console.log("✅ SignalR connected");
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
     * CHAT ACCEPTED
     */
    this.connection.on("ChatAccepted", (response) => {
      console.log("Chat accepted: ", response);
      useChatStore.getState().setChatStatus("connected");
      // useChatStore.getState().setChatEnabled(true);
      useChatStore.getState().setChatAcceptDetails(response);
    });
    /**
     * RECEIVE MESSAGE
     */
    this.connection.on("ReceiveMessage", (message: any) => {
      console.log("📩 Received:", message);

      const messageId = message.messageId ?? `server_${Date.now()}`;
      const messageSentOn = message.sentOn;

      const IsItsSenderMsg = message.senderId === this.UserId; // this.user.user?.eId;

      const exists = useChatStore
        .getState()
        .messages.some((m) => m.id === messageId);

      const isDuplicate = useChatStore
        .getState()
        .messages.some((m) => m.sentOn === messageSentOn);

      if (exists || IsItsSenderMsg || isDuplicate) return;

      useChatStore.getState().addMessage({
        id: messageId,
        text: message.messageText ?? message.message ?? "",
        sender: "doctor",
        timestamp: Date.now(),
        sentOn: messageSentOn,
        status: "received",
        type: message.fileUrl
          ? message.fileUrl.split(".").pop()?.toLowerCase()
          : "text",
        attachment: message.fileUrl
          ? {
              uri: `${S3Link}${message.fileUrl}`,
              name: message.fileUrl.split("/").pop() || "file",
              type: message.fileUrl.split(".").pop()?.toLowerCase(),
            }
          : undefined,
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
      // useChatStore.getState().setChatEnabled(false);
    });

    /**
     * CHAT EXPIRED
     */
    this.connection.on("ChatExpired", () => {
      console.log("ChatExpired");
      useChatStore.getState().setChatStatus("expired");
      // useChatStore
      //   .getState()
      //   .endChat("No doctors available. Please try again later.");
    });

    /**
     * CHAT ENDED
     */
    this.connection.on("ChatEnded", () => {
      console.log("ChatEnded");
      useChatStore.getState().endChat("Consultation ended");
    });

    this.connection.on("ConsultationCompleted", () => {
      console.log("Consultation completed");
      // useChatStore.getState().setChatStatus('ended');
      // useChatStore.getState().setChatEnabled(false);
      // useChatStore.getState().endChat('Consultation Completed');
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
      // useChatStore.getState().setChatStatus('connected');
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
      type: file ? "image" : "text",
    });

    try {
      const res = await this.handleSend(
        senderId,
        receiverId,
        text,
        appointmentId,
        file,
      );
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

    // if (file) {
    const _res = await axiosClient.post("/chat/TestsendImage", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("network:", _res);
    // } else {
    //   const _res = await axiosClient.post("/chat/send", formData, {
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   });
    //   console.log('network file: ', _res);
    // }
  }

  /**
   * DISCONNECT
   */
  async disconnect() {
    try {
      await this.connection?.stop();
      this.connection = null;
      // useChatStore.getState().reset();
      console.log("SignalR disconnected");
    } catch (err) {
      console.log("Disconnect error:", err);
    }
  }
}

export const signalRService = new SignalRService();

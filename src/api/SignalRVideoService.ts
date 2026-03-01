import * as signalR from "@microsoft/signalr";
import { useVideoStore } from "../store/VideoStore";

class SignalRVideoService {
  private connection: signalR.HubConnection | null = null;

  async connect(userId: number) {
    const videoStore = useVideoStore.getState();

    try {
      if (this.connection?.state === signalR.HubConnectionState.Connected && videoStore.isConnected) {
        console.log("Video hub already connected");
        return;
      }

      videoStore.setReconnecting();

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("https://api.curonn.com/hubs/video", {
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.registerListeners();

      await this.connection.start();
      console.log("✅ Hub started");

      // 👇 CRITICAL: wrap invoke in try/catch
      try {
        await this.connection.invoke("JoinUserGroup", userId.toString());
        console.log("✅ Joined video group:", userId);

        videoStore.setConnected();
      } catch (invokeError) {
        console.log("❌ JoinUserGroup failed:", invokeError);

        await this.connection.stop();
        this.connection = null;

        videoStore.setError("Failed to join video group.");
        return;
      }
    } catch (err) {
      console.log("❌ Video hub connect error:", err);

      await this.connection?.stop();
      this.connection = null;

      videoStore.setError("Video connection failed.");
    }
  }

  private registerListeners() {
    if (!this.connection) return;

    const videoStore = useVideoStore.getState();

    this.connection.on("VideoCallReady", (data: any) => {
      console.log("📹 VideoCallReady:", data);

      if (data?.roomUrl) {
        videoStore.setRoomReady(data.roomUrl);
      }
    });

    this.connection.onclose((err) => {
      console.log("Video hub disconnected", err);
      videoStore.setDisconnected();
    });

    this.connection.onreconnecting(() => {
      console.log("Video hub reconnecting...");
      videoStore.setReconnecting();
    });

    this.connection.onreconnected(() => {
      console.log("Video hub reconnected");
      videoStore.setConnected();
    });
  }

  async disconnect() {
    const videoStore = useVideoStore.getState();

    try {
      await this.connection?.stop();
      this.connection = null;
      videoStore.setDisconnected();
      console.log("Video hub disconnected");
    } catch (err) {
      console.log("Video disconnect error:", err);
    }
  }
}

export const signalRVideoService = new SignalRVideoService();

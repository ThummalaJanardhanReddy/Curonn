import * as signalR from "@microsoft/signalr";

class SignalRVideoService {
  private connection: signalR.HubConnection | null = null;

  /**
   * CONNECT
   */
  async connect(userId: number) {
    try {
      if (this.connection?.state === signalR.HubConnectionState.Connected) {
        console.log("Video hub already connected");
        return;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl("https://api.curonn.com/hubs/video", {
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.registerListeners();

      await this.connection.start();
      console.log("✅ Video hub connected");

      // Join user group
      await this.connection.invoke("JoinUserGroup", userId);
      console.log("Joined video group:", userId);
    } catch (err) {
      console.log("❌ Video hub connect error:", err);
    }
  }

  /**
   * REGISTER LISTENERS
   */
  private registerListeners() {
    if (!this.connection) return;

    this.connection.on("VideoCallReady", (data: any) => {
      console.log("📹 VideoCallReady:", data);

      // You can push this into a Zustand store
      if (data?.roomUrl) {
        // Example:
        // useVideoStore.getState().setRoomUrl(data.roomUrl);
      }
    });

    this.connection.onclose((err) => {
      console.log("Video hub disconnected", err);
    });

    this.connection.onreconnecting(() => {
      console.log("Video hub reconnecting...");
    });

    this.connection.onreconnected(() => {
      console.log("Video hub reconnected");
    });
  }

  /**
   * DISCONNECT
   */
  async disconnect() {
    try {
      await this.connection?.stop();
      this.connection = null;
      console.log("Video hub disconnected");
    } catch (err) {
      console.log("Video disconnect error:", err);
    }
  }
}

export const signalRVideoService = new SignalRVideoService();

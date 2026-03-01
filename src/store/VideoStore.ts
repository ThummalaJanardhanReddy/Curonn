interface VideoState {
  roomUrl?: string;
  status: "waiting" | "ready" | "in-call" | "ended";
  setRoomUrl: (url: string) => void;
}
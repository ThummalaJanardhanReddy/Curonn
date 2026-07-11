import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
  BackHandler,
} from "react-native";
import {
  KeyboardStickyView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import dayjs from "dayjs";

import { signalRService } from "../../../src/api/SignalRService";
import { Message, useChatStore } from "../../../src/store/ChatStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/app/shared/styles/commonStyles";
import { router, useFocusEffect } from "expo-router";
import { useUserStore } from "@/src/store/UserStore";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
import axiosClient from "@/src/api/axiosClient";
import { ChatHistoryItem } from "@/src/constants/constants";
import ApiRoutes from "@/src/api/employee/employee";
import ConnectionBanner from "./ConnectionBanner";

const S3Link = `https://curonndatabucket.s3.ap-south-1.amazonaws.com/`;

// ─────────────────────────────────────────────────────────────
// List item types
// ─────────────────────────────────────────────────────────────
type DateHeader = { type: "date";   id: string; label: string };
type SystemPill = { type: "system"; id: string; label: string; variant: "started" | "ended" };
type ListItem   = Message | DateHeader | SystemPill;

// ─────────────────────────────────────────────────────────────
// Pure helpers — outside component for stable references
// ─────────────────────────────────────────────────────────────
const getDayLabel = (timestamp: number): string => {
  const d = dayjs(timestamp);
  if (d.isSame(dayjs(), "day"))                    return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("DD MMM YYYY");
};

/**
 * Builds flat list data from raw messages, inserting:
 *
 *  • Date separator pill  — whenever the calendar day changes
 *  • "Chat Started" pill  — when msg.defaultMessage is non-empty
 *                           (signals start of a new chat session)
 *  • "Chat Ended"   pill  — when msg.isChat === false AND the next message
 *                           opens a new session (has defaultMessage) OR
 *                           it's the last message in the list
 *  • Message bubble       — only when there is actual text / attachment content
 */
const buildListItems = (messages: Message[]): ListItem[] => {
  const result: ListItem[] = [];
  let lastDate: string | null = null;

  messages.forEach((msg, index) => {
    const dateKey = dayjs(msg.timestamp).format("YYYY-MM-DD");

    // ── Date separator ───────────────────────────────────
    if (dateKey !== lastDate) {
      result.push({ type: "date", id: `date-${dateKey}-${index}`, label: getDayLabel(msg.timestamp) });
      lastDate = dateKey;
    }

    // ── "Chat Started" system pill ───────────────────────
    // defaultMessage being non-empty is the signal that a session began.
    if (msg.defaultMessage && msg.defaultMessage.trim() !== "") {
      result.push({
        type:    "system",
        id:      `started-${msg.id}`,
        label:   "Chat Started",
        variant: "started",
      });
    }

    // ── Message bubble (only if there is real content) ───
    const hasContent =
      (msg.text && msg.text.trim() !== "") ||
      msg.attachment?.uri ||
      msg.fileUrl;

    if (hasContent) {
      result.push(msg);
    }

    // ── "Chat Ended" system pill ─────────────────────────
    // isChat === false means this session has closed.
    // Emit the pill after the last message of the closed session.
    const nextMsg        = messages[index + 1];
    const isLastMsg      = index === messages.length - 1;
    const nextIsNewSess  = !!(nextMsg?.defaultMessage && nextMsg.defaultMessage.trim() !== "");

    if (msg.isChat === false && (isLastMsg || nextIsNewSess)) {
      result.push({
        type:    "system",
        id:      `ended-${msg.id}`,
        label:   "Chat Ended",
        variant: "ended",
      });
    }
  });

  return result;
};

// ─────────────────────────────────────────────────────────────
// ChatScreen
// ─────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const {
    messages,
    setSession,
    typing,
    connectionState,
    chatEnabled,
    clearChat,
    requestId,
    chatAcceptDetails,
    setMessages,
    reset: chatStoreReset,
  } = useChatStore();

  const chatStatus = useChatStore((s) => s.chatStatus);

  const [input,         setInput]         = useState("");
  const [attachment,    setAttachment]    = useState<any>(null);
  const [isChatStarted, setIsChatStarted] = useState(false);

  const flatListRef   = useRef<FlatList>(null);
  const isNearBottom  = useRef(true);
  const insets        = useSafeAreaInsets();
  const { user }      = useUserStore();
  const { isVisible } = useKeyboardState();

  /**
   * isActiveChatSession — true when the latest message with an isChat value
   * has isChat === true, meaning a live session is in progress.
   * Used to show/hide the "End Chat" sticky bar.
   */
  const isActiveChatSession = useMemo(() => {
    if (!messages.length) return false;
    const latest = [...messages].reverse().find((m) => m.isChat !== undefined);
    return latest?.isChat === true;
  }, [messages]);

  const listItems = useMemo(() => buildListItems(messages), [messages]);

  // ── Init / cleanup ────────────────────────────────────────
  useEffect(() => {
    const sessionId = "session_" + Date.now();
    setSession(sessionId);
    signalRService.connect(sessionId);
    return () => {
      signalRService.disconnect();
      clearChat();
    };
  }, []);

  // ── Android back button ───────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        confirmClose();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    if (messages.length && isNearBottom.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    if (isVisible) flatListRef.current?.scrollToEnd({ animated: true });
  }, [isVisible]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [listItems.length]);

  // ── Fetch history on connect ──────────────────────────────
  useEffect(() => {
    if (chatStatus === "connected") fetchChatHistory();
  }, [chatStatus]);

  // ── Actions ───────────────────────────────────────────────
  const confirmClose = useCallback(() => {
    Alert.alert("End Consultation", "Are you sure you want to end this chat?", [
      { text: "Cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => {
          signalRService.disconnect();
          clearChat();
          router.back();
        },
      },
    ]);
  }, []);

  const handleEndChat = useCallback(() => {
    Alert.alert("End Chat", "Are you sure you want to end this consultation?", [
      { text: "Cancel" },
      {
        text: "End Chat",
        style: "destructive",
        onPress: () => {
          signalRService.disconnect();
          clearChat();
          router.back();
        },
      },
    ]);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() && !attachment) return;
    try {
      await signalRService.sendMessage(
        input,
        chatAcceptDetails?.patientId,
        chatAcceptDetails?.doctorId,
        chatAcceptDetails?.appointmentId,
        attachment,
      );
      setInput("");
      setAttachment(null);
    } catch {
      Alert.alert("Failed", "Message failed to send");
    }
  }, [input, attachment, chatAcceptDetails]);

  const openFile = useCallback((url: string) => {
    Linking.openURL(S3Link + url);
  }, []);

  const pickImage = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.7 });
    if (!res.canceled) {
      const asset = res.assets[0];
      setAttachment({ uri: asset.uri, name: "image.jpg", type: "image/jpeg" });
    }
  }, []);

  const pickDocument = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync();
    if (!res.canceled) {
      const file = res.assets[0];
      setAttachment({ uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" });
    }
  }, []);

  const openAttachmentMenu = useCallback(() => {
    Alert.alert("Attachment", "Choose option", [
      { text: "Gallery",  onPress: pickImage },
      { text: "Document", onPress: pickDocument },
      { text: "Cancel",   style: "cancel" },
    ]);
  }, [pickImage, pickDocument]);

  const handleChatStart = useCallback(async () => {
    if (!user) return;
    const res = await axiosClient.post(ApiRoutes.Chat.start(user?.eId));
    useChatStore.getState().setRequestId(res?.chatRequestId);
    setIsChatStarted(true);
  }, [user]);

  const handleCancelAppointment = useCallback(async () => {
    if (!requestId) { Alert.alert("Error", "Request ID not found!"); return; }
    await axiosClient.post(ApiRoutes.Chat.cancel, { chatRequestId: requestId, patientid: user?.eId });
    chatStoreReset();
    router.replace("/(main)/my-doctor");
  }, [requestId, user]);

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    isNearBottom.current = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
  }, []);

  const keyExtractor = useCallback((item: any) => {
    return (item as DateHeader | SystemPill).id ?? (item as Message).id;
  }, []);

  // ── Map API history → Message[] ───────────────────────────
  const fetchChatHistory = async () => {
    try {
      if (!user) return;
      const response = await axiosClient.get<ChatHistoryItem[]>(ApiRoutes.Chat.history(user.eId));
      setMessages(mapChatHistory(response, user.eId));
    } catch (error) {
      console.log("Chat history error:", error);
    }
  };

  const mapChatHistory = (data: ChatHistoryItem[], currentUserId: number): Message[] =>
    data
      .sort((a, b) => new Date(a.sentOn).getTime() - new Date(b.sentOn).getTime())
      .map((item) => ({
        id:             item.messageId.toString(),
        sender:         item.senderId === currentUserId ? "user" : "doctor",
        text:           item.messageText ?? undefined,
        attachment:     item.fileUrl
          ? { uri: `${S3Link}${item.fileUrl}`, name: item.fileUrl.split("/").pop() || "file", type: item.fileUrl.split(".").pop()?.toLowerCase() }
          : undefined,
        type:           item.fileUrl ? "image" : "text",
        fileUrl:        item.fileUrl ?? undefined,
        timestamp:      new Date(item.sentOn).getTime(),
        status:         item.isRead ? "received" : "sent",
        isChat:         item.isChat,
        defaultMessage: item.defaultMessage,
      }));

  // ── Render item ───────────────────────────────────────────
  const renderItem = useCallback(({ item }: { item: ListItem }) => {

    // Date separator pill
    if (item.type === "date") {
      return (
        <View style={styles.pillRow}>
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{(item as DateHeader).label}</Text>
          </View>
        </View>
      );
    }

    // System pill — Chat Started (green) or Chat Ended (red)
    if (item.type === "system") {
      const pill = item as SystemPill;
      const isStarted = pill.variant === "started";
      return (
        <View style={styles.pillRow}>
          <View style={[styles.systemPill, isStarted ? styles.pillStarted : styles.pillEnded]}>
            <Text style={[styles.systemPillText, isStarted ? styles.pillTextStarted : styles.pillTextEnded]}>
              {isStarted ? "🟢  Chat Started" : "🔴  Chat Ended"}
            </Text>
          </View>
        </View>
      );
    }

    // Regular message bubble
    return <MessageItem item={item as Message} onOpenFile={openFile} />;
  }, [openFile]);

  // ── Waiting / Expired states ──────────────────────────────
  const showWaiting = chatStatus === "busy" || chatStatus === "requested";
  const showExpired = chatStatus === "expired";
  const showChat    = !showWaiting && !showExpired;

  // ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {chatAcceptDetails?.doctorName ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {chatAcceptDetails.doctorName
                  .split(" ").slice(0, 2)
                  .map((w: string) => w[0]).join("").toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#C5CAE0" }]}>
              <Ionicons name="person" size={18} color="#fff" />
            </View>
          )}
          <View>
            <Text style={styles.headerName}>
              {chatAcceptDetails?.doctorName ?? "Chat Consultation"}
            </Text>
            <Text style={styles.headerSub}>Chat Consultation</Text>
          </View>
        </View>

        <TouchableOpacity onPress={confirmClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={22} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* CONNECTION BANNER */}
      <ConnectionBanner connectionState={connectionState} emitColor={() => {}} />

      <KeyboardStickyView
        style={{ flex: 1 }}
        offset={{ closed: -insets.bottom, opened: 0 }}
      >
        {/* WAITING */}
        {showWaiting && (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>Please wait. Our doctor will join shortly</Text>
            <PrimaryButton title="Cancel Appointment" onPress={handleCancelAppointment} />
          </View>
        )}

        {/* EXPIRED */}
        {showExpired && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { textAlign: "center" }]}>
              We are really sorry, all our doctors are busy now.{"\n"}
              Please book an appointment after some time.
            </Text>
            <PrimaryButton title="Exit" onPress={handleCancelAppointment} />
          </View>
        )}

        {/* CHAT */}
        {showChat && (
          <FlatList
            ref={flatListRef}
            data={listItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 1, autoscrollToTopThreshold: 10 }}
          />
        )}

        {/* TYPING */}
        {typing && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Doctor is typing…</Text>
          </View>
        )}

        {/* ATTACHMENT PREVIEW */}
        {attachment && (
          <View style={styles.attachmentPreview}>
            <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
            <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <MaterialIcons name="close" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        {/*
          END CHAT BAR
          Visible only when isChat = true (active session).
          Tapping fires a confirmation alert then disconnects.
        */}
        {isActiveChatSession && (
          <TouchableOpacity style={styles.endChatBar} onPress={handleEndChat} activeOpacity={0.85}>
            <View style={styles.endChatDot} />
            <Text style={styles.endChatLabel}>Consultation in progress</Text>
            <Text style={styles.endChatAction}>End Chat</Text>
          </TouchableOpacity>
        )}

        {/* INPUT */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            {!isChatStarted && chatStatus !== "requested" ? (
              <View style={{ flex: 1, alignSelf: "center" }}>
                <PrimaryButton title="Start Chat" onPress={handleChatStart} />
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={openAttachmentMenu} style={styles.iconBtn}>
                  <Ionicons name="attach" size={24} color={chatEnabled ? colors.primary : "#ccc"} />
                </TouchableOpacity>

                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type a message…"
                  editable={chatEnabled}
                  style={[styles.input, !chatEnabled && { opacity: 0.5 }]}
                  multiline
                  placeholderTextColor="#B0B5C8"
                />

                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!chatEnabled}
                  style={[styles.sendBtn, !chatEnabled && styles.sendBtnDisabled]}
                >
                  <Ionicons name="send" size={18} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MessageItem
// ─────────────────────────────────────────────────────────────
const MessageItem = React.memo(
  ({ item, onOpenFile }: { item: Message; onOpenFile: (url: string) => void }) => {
    const isUser = item.sender === "user";
    const isPdf  = item.attachment?.name?.toLowerCase().endsWith(".pdf");

    return (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleDoctor]}>
        {isPdf && (
          <TouchableOpacity
            style={styles.pdfCard}
            onPress={() => {
              const url = item.fileUrl || item.attachment?.uri;
              if (url) onOpenFile(url);
            }}
          >
            <Text style={styles.pdfIcon}>📄</Text>
            <View>
              <Text style={styles.pdfName} numberOfLines={1}>
                {item.attachment?.name ?? "Prescription"}
              </Text>
              <Text style={styles.pdfSub}>View Prescription →</Text>
            </View>
          </TouchableOpacity>
        )}

        {item.attachment?.uri && !isPdf && (
          <Image source={{ uri: item.attachment.uri }} style={styles.bubbleImage} />
        )}

        {!!item.text && <Text style={styles.bubbleText}>{item.text}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.metaTime}>{dayjs(item.timestamp).format("HH:mm")}</Text>
          {isUser && (
            <Text style={styles.metaStatus}>
              {item.status === "sending" ? "⏳" : item.status === "sent" ? "✓✓" : item.status === "failed" ? "⚠️" : ""}
            </Text>
          )}
        </View>
      </View>
    );
  },
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "white", borderBottomWidth: 1, borderColor: "#E4E8F0",
  },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar:      { width: 40, height: 40, borderRadius: 20, backgroundColor: "#4361EE", alignItems: "center", justifyContent: "center" },
  avatarText:  { color: "white", fontWeight: "700", fontSize: 14 },
  headerName:  { fontSize: 16, fontWeight: "600", color: colors.black },
  headerSub:   { fontSize: 12, color: "#7B8194", marginTop: 1 },
  closeBtn:    { padding: 4 },

  // List
  listContent: { padding: 16, gap: 4, paddingBottom: 12 },

  // Date pill
  pillRow:      { alignItems: "center", marginVertical: 8 },
  datePill:     { backgroundColor: "#E5E7EB", paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  datePillText: { fontSize: 12, color: "#4B5563", fontWeight: "500" },

  // System pills
  systemPill:     { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillStarted:    { backgroundColor: "#ECFDF5", borderColor: "#6EE7B7" },
  pillEnded:      { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  systemPillText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  pillTextStarted:{ color: "#065F46" },
  pillTextEnded:  { color: "#991B1B" },

  // Bubbles
  bubble:       { maxWidth: "75%", padding: 10, borderRadius: 16, marginVertical: 2 },
  bubbleUser:   { backgroundColor: "#DCF2D8", alignSelf: "flex-end",  borderBottomRightRadius: 4 },
  bubbleDoctor: { backgroundColor: "#EEEAF8", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText:   { fontSize: 14, color: "#1A1A2E", lineHeight: 20 },
  bubbleImage:  { width: 200, height: 180, borderRadius: 12, marginBottom: 4 },

  // PDF card
  pdfCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "white", borderWidth: 1, borderColor: "#E4E8F0", borderRadius: 10, padding: 10, maxWidth: 200 },
  pdfIcon: { fontSize: 26 },
  pdfName: { fontSize: 13, fontWeight: "500", color: "#1A1A2E", maxWidth: 130 },
  pdfSub:  { fontSize: 12, color: "#4361EE", marginTop: 2 },

  // Meta
  metaRow:    { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 4 },
  metaTime:   { fontSize: 10, color: "#7B8194" },
  metaStatus: { fontSize: 10, color: "#4361EE" },

  // Typing
  typingContainer: { paddingLeft: 20, paddingBottom: 6 },
  typingText:      { fontSize: 12, color: "#888", fontStyle: "italic" },

  // Attachment preview
  attachmentPreview: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0F4FF", paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderColor: "#E4E8F0" },
  attachmentName:    { flex: 1, fontSize: 13, color: "#1A1A2E", fontWeight: "500" },

  // End chat bar — shown when isChat === true (active session)
  endChatBar:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF8F0", borderTopWidth: 1, borderColor: "#FED7AA", paddingHorizontal: 16, paddingVertical: 10 },
  endChatDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  endChatLabel:  { flex: 1, fontSize: 13, color: "#92400E", fontWeight: "500" },
  endChatAction: { fontSize: 13, fontWeight: "700", color: "#DC2626" },

  // Waiting / Expired
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 24, backgroundColor: colors.bg_primary },
  stateText:   { fontSize: 16, color: colors.black, textAlign: "center", lineHeight: 24 },

  // Input bar
  inputContainer: { backgroundColor: "white", borderTopWidth: 1, borderColor: "#E4E8F0", paddingHorizontal: 12, paddingVertical: 8 },
  inputRow:       { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  iconBtn:        { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F4FF" },
  input:          { flex: 1, borderWidth: 1.5, borderColor: "#E4E8F0", borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#1A1A2E", maxHeight: 100, backgroundColor: "#F8F9FB" },
  sendBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: "#4361EE", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled:{ backgroundColor: "#C5CAE0" },
});

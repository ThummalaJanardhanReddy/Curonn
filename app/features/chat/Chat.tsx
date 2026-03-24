import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Linking,
  BackHandler,
} from "react-native";
import {
  KeyboardStickyView,
  useKeyboardController,
  useKeyboardState,
} from "react-native-keyboard-controller";

import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import dayjs from "dayjs";

import { signalRService } from "../../../src/api/SignalRService";
import { Message, useChatStore } from "../../../src/store/ChatStore";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { colors } from "@/app/shared/styles/commonStyles";
import { router, useFocusEffect } from "expo-router";
import { useUserStore } from "@/src/store/UserStore";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
import axiosClient from "@/src/api/axiosClient";
import { ChatHistoryItem, ChatMessage } from "@/src/constants/constants";
import ApiRoutes from "@/src/api/employee/employee";
import { openURL } from "expo-linking";
import ConnectionBanner from "./ConnectionBanner";

const S3Link = `https://curonndatabucket.s3.ap-south-1.amazonaws.com/`;

// ─────────────────────────────────────────────────────────────
// List item types
// ─────────────────────────────────────────────────────────────
type DateHeader = { type: "date"; id: string; label: string };

type SystemPill = {
  type: "system";
  id: string;
  variant: "started" | "ended";
  /** The defaultMessage text shown below the "Chat Started" pill */
  subLabel?: string;
  /** Doctor name shown in the "Chat Ended" pill */
  doctorName?: string;
};

type ListItem = Message | DateHeader | SystemPill;

// ─────────────────────────────────────────────────────────────
// Pure helpers — outside component for stable references
// ─────────────────────────────────────────────────────────────
const getDayLabel = (timestamp: number): string => {
  const d = dayjs(timestamp);
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("DD MMM YYYY");
};

/**
 * Builds flat list data from raw messages, inserting:
 *
 *  • Date separator pill   — whenever the calendar day changes
 *
 *  • "Chat Started" pill   — when msg.defaultMessage is non-empty.
 *                            Marks the beginning of a trackable session.
 *                            The defaultMessage text appears below as a
 *                            secondary date-chip style label.
 *
 *  • "Chat Ended" pill     — ONLY after a "Chat Started" has been seen
 *                            (i.e. a defaultMessage was present earlier)
 *                            AND msg.isChat flips to false within that session.
 *                            Resets the session tracker so the next
 *                            defaultMessage starts a fresh session.
 *
 *  • Message bubble        — only when the message has real text / attachment.
 *
 * Key invariant: messages that arrive BEFORE any defaultMessage with
 * isChat === false are ignored for the "Chat Ended" pill. This prevents
 * the pill from firing prematurely on historical tail messages.
 */
const buildListItems = (
  messages: Message[],
  doctorName?: string,
): ListItem[] => {
  const result: ListItem[] = [];
  let lastDate: string | null = null;

  /**
   * sessionOpen tracks whether we are currently inside a started session.
   * It is set to true when we encounter a defaultMessage, and reset to
   * false after we emit a "Chat Ended" pill.
   */
  let sessionOpen = false;

  messages.forEach((msg, index) => {
    const dateKey = dayjs(msg.timestamp).format("YYYY-MM-DD");

    // ── Date separator ───────────────────────────────────
    if (dateKey !== lastDate) {
      result.push({
        type: "date",
        id: `date-${dateKey}-${index}`,
        label: getDayLabel(msg.timestamp),
      });
      lastDate = dateKey;
    }

    // ── "Chat Started" pill ──────────────────────────────
    // A non-empty defaultMessage means a new session just opened.
    // We open the session tracker here so subsequent isChat checks
    // know they are operating inside a valid session.
    if (msg.defaultMessage && msg.defaultMessage.trim() !== "") {
      // If a previous session was still open (no explicit end seen),
      // close it before opening the new one.
      if (sessionOpen) {
        result.push({
          type: "system",
          id: `ended-auto-${msg.id}`,
          variant: "ended",
          doctorName,
        });
      }

      sessionOpen = true;

      result.push({
        type: "system",
        id: `started-${msg.id}`,
        variant: "started",
        subLabel: msg.defaultMessage.trim(),
      });
    }

    // ── Message bubble (only if real content exists) ─────
    const hasContent =
      (msg.text && msg.text.trim() !== "") ||
      msg.attachment?.uri ||
      msg.fileUrl;

    if (hasContent) {
      result.push(msg);
    }

    // ── "Chat Ended" pill ────────────────────────────────
    // Only emit when:
    //   1. We are inside an open session (defaultMessage was seen before)
    //   2. isChat is explicitly false on this message
    if (sessionOpen && msg.isChat === false) {
      result.push({
        type: "system",
        id: `ended-${msg.id}`,
        variant: "ended",
        doctorName,
      });
      // Close the session so we don't emit duplicate "ended" pills
      // for the remaining messages of this same closed session.
      sessionOpen = false;
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

  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<any>(null);
  const [isChatStarted, setIsChatStarted] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const { isVisible } = useKeyboardState();
  const isNearBottom = useRef(true);

  // Pass doctorName into buildListItems so "Chat Ended" can include it
  const listItems = useMemo(
    () => buildListItems(messages, chatAcceptDetails?.doctorName),
    [messages, chatAcceptDetails?.doctorName],
  );

  /**
   * INIT CONNECTION
   */
  useEffect(() => {
    const sessionId = "session_" + Date.now();
    setSession(sessionId);
    signalRService.connect(sessionId);
    return () => {
      signalRService.disconnect();
      clearChat();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        confirmClose();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  /**
   * AUTOSCROLL
   */
  useEffect(() => {
    if (messages.length && isNearBottom.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    if (isVisible) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [isVisible]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [listItems.length]);

  // Fetch history on connect
  useEffect(() => {
    if (chatStatus === "connected") {
      fetchChatHistory();
    }
  }, [chatStatus]);

  /**
   * CLOSE CHAT
   */
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

  /**
   * SEND MESSAGE
   */
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

  /**
   * IMAGE PICKER
   */
  const pickImage = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.7,
    });
    if (!res.canceled) {
      const asset = res.assets[0];
      setAttachment({ uri: asset.uri, name: "image.jpg", type: "image/jpeg" });
    }
  }, []);

  /**
   * DOCUMENT PICKER
   */
  const pickDocument = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync();
    if (!res.canceled) {
      const file = res.assets[0];
      setAttachment({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      });
    }
  }, []);

  /**
   * ATTACHMENT MENU
   */
  const openAttachmentMenu = useCallback(() => {
    Alert.alert("Attachment", "Choose option", [
      { text: "Gallery", onPress: pickImage },
      { text: "Document", onPress: pickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [pickImage, pickDocument]);

  const openFile = useCallback((url: string) => {
    Linking.openURL(S3Link + url);
  }, []);

  const handleChatStart = useCallback(async () => {
    if (!user) return;
    const res = await axiosClient.post(ApiRoutes.Chat.start(user?.eId));
    useChatStore.getState().setRequestId(res?.chatRequestId);
    setIsChatStarted(true);
  }, [user]);

  const handleCancelAppointment = useCallback(async () => {
    if (!requestId) {
      Alert.alert("Error", "Request ID not found!");
      return;
    }
    await axiosClient.post(ApiRoutes.Chat.cancel, {
      chatRequestId: requestId,
      patientid: user?.eId,
    });
    chatStoreReset();
    router.replace("/(main)/my-doctor");
  }, [requestId, user]);

  const fetchChatHistory = async () => {
    try {
      if (!user) return;
      const response = await axiosClient.get<ChatHistoryItem[]>(
        ApiRoutes.Chat.history(user.eId),
      );
      setMessages(mapChatHistory(response, user.eId));
    } catch (error) {
      console.log("Chat history error:", error);
    }
  };

  const mapChatHistory = (
    data: ChatHistoryItem[],
    currentUserId: number,
  ): Message[] => {
    return data
      .sort(
        (a, b) => new Date(a.sentOn).getTime() - new Date(b.sentOn).getTime(),
      )
      .map((item) => ({
        id: item.messageId.toString(),
        sender: item.senderId === currentUserId ? "user" : "doctor",
        text: item.messageText ?? undefined,
        attachment: item.fileUrl
          ? {
              uri: `${S3Link}${item.fileUrl}`,
              name: item.fileUrl.split("/").pop() || "file",
              type: item.fileUrl.split(".").pop()?.toLowerCase(),
            }
          : undefined,
        type: item.fileUrl ? "image" : "text",
        fileUrl: item.fileUrl ?? undefined,
        timestamp: new Date(item.sentOn).getTime(),
        status: item.isRead ? "received" : "sent",
        isChat: item.isChat,
        defaultMessage: item.defaultMessage,
      }));
  };

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    isNearBottom.current =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
  }, []);

  const keyExtractor = useCallback((item: any) => {
    return (item as DateHeader | SystemPill).id ?? (item as Message).id;
  }, []);

  const handleBannerColor = (color: string) => {
    return color;
  };

  // ── Render list item ───────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      // ── Date separator pill ──────────────────────────────
      if (item.type === "date") {
        return (
          <View style={styles.pillRow}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>
                {(item as DateHeader).label}
              </Text>
            </View>
          </View>
        );
      }

      // ── System pill: Chat Started / Chat Ended ───────────
      if (item.type === "system") {
        const pill = item as SystemPill;
        const isStarted = pill.variant === "started";

        return (
          <View style={styles.pillRow}>
            <View
              style={[
                styles.systemPill,
                isStarted ? styles.pillStarted : styles.pillEnded,
              ]}
            >
              <Text
                style={[
                  styles.systemPillText,
                  isStarted ? styles.pillTextStarted : styles.pillTextEnded,
                ]}
              >
                {isStarted
                  ? "🟢  Chat Started"
                  : `🔴  Chat Ended${pill.doctorName ? ` - ${pill.doctorName}` : ""}`}
              </Text>
            </View>

            {/* defaultMessage text below "Chat Started", same date-pill style */}
            {isStarted && pill.subLabel ? (
              <View style={[styles.datePill, styles.subLabelPill]}>
                <Text style={styles.datePillText}>{pill.subLabel}</Text>
              </View>
            ) : null}
          </View>
        );
      }

      // ── Regular message bubble ────────────────────────────
      return <MessageItem item={item as Message} onOpenFile={openFile} />;
    },
    [openFile],
  );

  const showWaiting = chatStatus === "busy" || chatStatus === "requested";
  const showExpired = chatStatus === "expired";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg_primary,
        paddingTop: insets.top,
      }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {chatAcceptDetails?.doctorName ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {chatAcceptDetails.doctorName
                  .split(" ")
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()}
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

      <ConnectionBanner
        connectionState={connectionState}
        emitColor={handleBannerColor}
      />

      <KeyboardStickyView
        style={{ flex: 1 }}
        offset={{ closed: -insets.bottom, opened: 0 }}
      >
        {/* WAITING */}
        {showWaiting && (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Please wait. Our doctor will join shortly
            </Text>
            <View style={styles.buttonWrapper}>
              <PrimaryButton
                title="Cancel Appointment"
                onPress={handleCancelAppointment}
              />
            </View>
          </View>
        )}

        {/* EXPIRED */}
        {showExpired && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, { textAlign: "center" }]}>
              We are really sorry, all our doctors are busy now.{"\n"}
              Please book an appointment after some time.
            </Text>
            <View style={styles.buttonWrapper}>
              <PrimaryButton title="Exit" onPress={handleCancelAppointment} />
            </View>
          </View>
        )}

        {chatStatus !== "requested" && (
          <FlatList
            ref={flatListRef}
            data={listItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
              padding: 16,
              gap: 6,
              paddingBottom: 14,
              paddingTop: 50,
            }}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 1,
              autoscrollToTopThreshold: 10,
            }}
          />
        )}

        {/* TYPING INDICATOR */}
        {typing && (
          <View style={styles.typingContainer}>
            <Text style={styles.typing}>Doctor typing...</Text>
          </View>
        )}

        {/* ATTACHMENT PREVIEW */}
        {attachment && (
          <View style={styles.preview}>
            <Text>{attachment.name}</Text>
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <MaterialIcons name="close" size={18} />
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT */}
        <View style={[styles.inputContainer]}>
          <View style={styles.inputRow}>
            {!isChatStarted && chatStatus !== "requested" ? (
              <View style={styles.buttonWrapper}>
                <PrimaryButton title="Start Chat" onPress={handleChatStart} />
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={openAttachmentMenu}>
                  <Ionicons
                    name="attach"
                    size={26}
                    color={chatEnabled ? "black" : "#ccc"}
                  />
                </TouchableOpacity>

                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type a message"
                  style={styles.input}
                  multiline
                />

                <TouchableOpacity onPress={sendMessage} disabled={!chatEnabled}>
                  <Ionicons
                    name="send"
                    size={26}
                    color={chatEnabled ? colors.primary : "#ccc"}
                  />
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
// Styles  (unchanged from previous version)
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  inputContainer: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bg_primary,
    borderBottomWidth: 1,
    borderColor: "#E4E8F0",
    zIndex: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4361EE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "white", fontWeight: "700", fontSize: 14 },
  headerName: { fontSize: 16, fontWeight: "600", color: colors.black },
  headerSub: { fontSize: 12, color: "#7B8194", marginTop: 1 },
  closeBtn: { padding: 4 },

  title: { fontSize: 18, fontWeight: "600", color: colors.black },
  subtitle: { color: colors.black, fontSize: 18 },

  banner: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    gap: 30,
  },
  bannerText: { fontSize: 24, color: colors.black },

  message: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: "75%",
  },
  userMessage: { backgroundColor: "#DEF2DB", alignSelf: "flex-end" },
  doctorMessage: { backgroundColor: "#EDE7F7", alignSelf: "flex-start" },

  image: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },

  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 5 },
  time: { fontSize: 11, color: "#666" },
  status: { marginLeft: 5, fontSize: 11, color: "#666" },

  // ── Pills ──────────────────────────────────────────────────
  pillRow: {
    alignItems: "center",
    marginVertical: 8,
    gap: 6,
  },
  datePill: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  datePillText: { fontSize: 12, color: "#4B5563", fontWeight: "500" },

  // Slightly smaller padding so subLabel feels secondary to the main pill
  subLabelPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },

  systemPill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillStarted: { backgroundColor: "#ECFDF5", borderColor: "#6EE7B7" },
  pillEnded: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  systemPillText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  pillTextStarted: { color: "#065F46" },
  pillTextEnded: { color: "#991B1B" },

  typingContainer: { paddingLeft: 20, paddingBottom: 6 },
  typingText: { fontSize: 12, color: "#888", fontStyle: "italic" },
  typing: { paddingLeft: 16, color: "#888", paddingBottom: 6 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    maxHeight: 100,
  },

  preview: {
    padding: 10,
    backgroundColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E4E8F0",
    borderRadius: 10,
    padding: 10,
    maxWidth: 200,
  },
  pdfIcon: { fontSize: 26 },
  pdfName: { fontSize: 13, fontWeight: "500", color: "#1A1A2E", maxWidth: 130 },
  pdfSub: { fontSize: 12, color: "#4361EE", marginTop: 2 },

  textContainer: {
    borderColor: colors.primary,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  fileName: { fontSize: 14, fontWeight: "600", color: "#000000" },
  fileSubText: { fontSize: 14, color: colors.primary, marginTop: 2 },

  dateContainer: { alignItems: "center", marginVertical: 12 },
  dateText: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },

  bubbleText: { fontSize: 14, color: "#1A1A2E", lineHeight: 20 },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 24,
    backgroundColor: colors.bg_primary,
  },
  stateText: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    lineHeight: 24,
  },

  buttonWrapper: {
    alignSelf: "center",
  },
});

// ─────────────────────────────────────────────────────────────
// MessageItem
// ─────────────────────────────────────────────────────────────
const MessageItem = React.memo(
  ({
    item,
    onOpenFile,
  }: {
    item: Message;
    onOpenFile: (file: string) => void;
  }) => {
    const isUser = item.sender === "user";
    const isPdf = item.attachment?.name?.toLowerCase().endsWith(".pdf");
    const isImage = item.attachment?.type === "image";

    return (
      <View
        style={[
          styles.message,
          isUser ? styles.userMessage : styles.doctorMessage,
        ]}
      >
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
          <Image source={{ uri: item.attachment.uri }} style={styles.image} />
        )}

        {!!item.text && <Text style={styles.bubbleText}>{item.text}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.time}>
            {dayjs(item.timestamp).format("HH:mm")}
          </Text>
          {isUser && (
            <Text style={styles.status}>
              {item.status === "sending"
                ? "⏳"
                : item.status === "sent"
                  ? "✓✓"
                  : item.status === "failed"
                    ? "⚠️"
                    : ""}
            </Text>
          )}
        </View>
      </View>
    );
  },
);
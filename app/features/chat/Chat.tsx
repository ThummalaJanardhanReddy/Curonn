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
  Alert,
  Image,
  Linking,
  BackHandler,
  StatusBar,
} from "react-native";
import {
  KeyboardStickyView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import dayjs from "dayjs";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import { signalRService } from "@/src/api/SignalRService";
import {
  Message,
  useChatStore,
  useChatAcceptance,
  useChatStatus,
} from "@/src/store/ChatStore";
import { useUserStore } from "@/src/store/UserStore";
import { colors } from "@/app/shared/styles/commonStyles";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import ConnectionBanner from "./ConnectionBanner";
import type { ChatHistoryItem } from "@/src/constants/constants";
import Toast from "@/app/shared/components/Toast";

// Constants
const S3_BASE_URL = "https://curonndatabucket.s3.ap-south-1.amazonaws.com/";
const SCROLL_OFFSET_THRESHOLD = 50;
const IMAGE_QUALITY = 0.7;
const ChatCompletedStatusCode = 2711;

// ─────────────────────────────────────────────────────────────
// List item types
// ─────────────────────────────────────────────────────────────
type DateHeader = {
  type: "date";
  id: string;
  label: string;
};

type SystemPill = {
  type: "system";
  id: string;
  variant: "started" | "ended";
  subLabel?: string;
  doctorName?: string;
};

type ListItem = Message | DateHeader | SystemPill;

// ─────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────
const getDayLabel = (timestamp: number): string => {
  const d = dayjs(timestamp);
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("DD MMM YYYY");
};

/**
 * Builds flat list data from raw messages with date separators and system pills
 */
const buildListItems = (
  messages: Message[],
  doctorName?: string,
): ListItem[] => {
  const result: ListItem[] = [];
  let lastDate: string | null = null;
  let sessionOpen = false;

  messages.forEach((msg, index) => {
    const dateKey = dayjs(msg.timestamp).format("YYYY-MM-DD");

    // Date separator
    if (dateKey !== lastDate) {
      result.push({
        type: "date",
        id: `date-${dateKey}-${index}`,
        label: getDayLabel(msg.timestamp),
      });
      lastDate = dateKey;
    }

    // Chat Started pill
    if (
      msg.defaultMessage &&
      msg.defaultMessage.trim() !== "" &&
      msg.defaultMessage === "Chat Ended" &&
      sessionOpen
    ) {
      if (sessionOpen) {
        result.push(msg);
        result.push({
          type: "system",
          id: `ended-auto-${msg.id}`,
          variant: "ended",
          subLabel: msg.text?.trim(),
          doctorName,
        });
      }
      sessionOpen = false;
    } else if (msg.defaultMessage && msg.defaultMessage.trim() !== "") {
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
    // Message bubble (only if real content exists)
    const hasContent =
      (msg.text &&
        msg.text.trim() !== "" &&
        msg.defaultMessage !== "Chat Ended") ||
      msg.attachment?.uri ||
      msg.fileUrl;

    if (hasContent) {
      result.push(msg);
    }
  });

  return result;
};

/**
 * Map chat history API response to Message objects
 */
const mapChatHistory = (
  data: ChatHistoryItem[],
  currentUserId: number,
): Message[] => {
  return data
    .sort((a, b) => new Date(a.sentOn).getTime() - new Date(b.sentOn).getTime())
    .map((item) => ({
      id: item.messageId.toString(),
      sender: item.senderId === currentUserId ? "user" : "doctor",
      text: item.messageText ?? undefined,
      attachment: item.fileUrl
        ? {
            uri: `${S3_BASE_URL}${item.fileUrl}`,
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

// ─────────────────────────────────────────────────────────────
// ChatScreen
// ─────────────────────────────────────────────────────────────
export default function ChatScreen() {
  // Store hooks
  const {
    messages,
    setSession,
    typing,
    connectionState,
    chatEnabled,
    clearChat,
    requestId,
    setMessages,
    reset: chatStoreReset,
  } = useChatStore();

  const { chatStatus, isRequested, isConnected, isActive, isEnded } =
    useChatStatus();

  const { acceptDetails, doctorName, doctorId, appointmentId } =
    useChatAcceptance();

  const { user } = useUserStore();

  // Local state
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);

  const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState({
      title: "",
      subtitle: "",
      type: "success" as "success" | "error",
    });

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const isNearBottom = useRef(true);

  // Hooks
  const insets = useSafeAreaInsets();
  const { isVisible: isKeyboardVisible } = useKeyboardState();

  // Filter today's messages and build list items
  const listItems = useMemo(
    () =>
      buildListItems(
        messages.filter((m) => dayjs(m.timestamp).isSame(dayjs(), "day")),
        doctorName,
      ),
    [messages, doctorName],
  );

  // ─────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────

  /**
   * Initialize SignalR connection on mount
   */
  useEffect(() => {
    const sessionId = `session_${Date.now()}`;
    setSession(sessionId);
    signalRService.connect(sessionId);
    useChatStore.getState().setChatStatus("requested");

    return () => {
      signalRService.disconnect();
      clearChat();
    };
  }, [setSession, clearChat]);

  /**
   * Handle hardware back button
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleConfirmClose();
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
   * Auto-scroll when new messages arrive
   */
  useEffect(() => {
    if (messages.length && isNearBottom.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  /**
   * Auto-scroll when keyboard appears
   */
  useEffect(() => {
    if (isKeyboardVisible) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [isKeyboardVisible]);

  /**
   * Auto-scroll when list items change
   */
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [listItems.length]);

  /**
   * Fetch chat history when connected (optional - currently commented)
   */
  // useEffect(() => {
  //   if (isConnected) {
  //     fetchChatHistory();
  //   }
  // }, [isConnected]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  /**
   * Exit chat and cancel appointment
   */
  const handleExitChat = useCallback(async (freeExit: boolean = false) => {
    try {
      if (!appointmentId || freeExit) {
        console.log("[ChatScreen] No appointment ID, skipping cancellation");
        setShowToast(true);
        setToastMessage({
          title: "Error",
          subtitle: "No appointment ID available",
          type: "error",
        });


        // signalRService.disconnect();
        clearChat();
        router.back();
        return;
      }

      console.log("[ChatScreen] Cancelling appointment:", appointmentId);

      await axiosClient.put(
        ApiRoutes.Appointments.cancel(
          appointmentId,
          ChatCompletedStatusCode,
          doctorId || 0,
        ),
      );
      setShowToast(true);
      setToastMessage({
        title: "Success",
        subtitle: "Appointment cancelled successfully",
        type: "success",
      });

      // signalRService.disconnect();
      clearChat();
      router.back();
    } catch (error) {
      console.error("[ChatScreen] Error cancelling appointment:", error);
      Alert.alert("Error", "Failed to cancel appointment. Please try again.");
    }
  }, [appointmentId, clearChat]);

  /**
   * Confirm before closing chat
   */
  const handleConfirmClose = useCallback(() => {
    Alert.alert("End Consultation", "Are you sure you want to end this chat?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => handleExitChat(),
      },
    ]);
  }, [handleExitChat]);

  /**
   * Send message
   */
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && !attachment) {
      console.warn("[ChatScreen] Cannot send empty message");
      return;
    }

    if (!acceptDetails) {
      Alert.alert("Error", "Chat details not available");
      return;
    }

    try {
      const success = await signalRService.sendMessage({
        text: input,
        senderId: acceptDetails.patientId,
        receiverId: acceptDetails.doctorId,
        appointmentId: acceptDetails.appointmentId,
        file: attachment ?? undefined,
        userType: "user",
      });

      if (success) {
        setInput("");
        setAttachment(null);
      } else {
        Alert.alert("Failed", "Message failed to send");
      }
    } catch (error) {
      console.error("[ChatScreen] Send message error:", error);
      Alert.alert("Failed", "Message failed to send");
    }
  }, [input, attachment, acceptDetails]);

  /**
   * Pick image from gallery
   */
  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        quality: IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: "image.jpg",
          type: "image/jpeg",
        });
      }
    } catch (error) {
      console.error("[ChatScreen] Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  }, []);

  /**
   * Pick document
   */
  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachment({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/octet-stream",
        });
      }
    } catch (error) {
      console.error("[ChatScreen] Document picker error:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  }, []);

  /**
   * Show attachment menu
   */
  const handleOpenAttachmentMenu = useCallback(() => {
    Alert.alert("Attachment", "Choose option", [
      { text: "Gallery", onPress: handlePickImage },
      { text: "Document", onPress: handlePickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [handlePickImage, handlePickDocument]);

  /**
   * Open file URL
   */
  const handleOpenFile = useCallback((url: string) => {
    Linking.openURL(url).catch((error) => {
      console.error("[ChatScreen] Failed to open URL:", error);
      Alert.alert("Error", "Failed to open file");
    });
  }, []);

  /**
   * Cancel appointment (from waiting states)
   */
  const handleCancelAppointment = useCallback(async () => {
    try {
      if (!user?.eId) {
        Alert.alert("Error", "User information not available");
        return;
      }

      await axiosClient.post(ApiRoutes.Chat.cancel, {
        chatRequestId: requestId,
        patientid: user.eId,
      });

      chatStoreReset();
      router.replace("/(main)/my-doctor");
    } catch (error) {
      console.error("[ChatScreen] Cancel appointment error:", error);
      Alert.alert("Error", "Failed to cancel appointment");
    }
  }, [requestId, user, chatStoreReset]);

  /**
   * Fetch chat history (optional)
   */
  const fetchChatHistory = useCallback(async () => {
    try {
      if (!user?.eId) return;

      const response = await axiosClient.get<ChatHistoryItem[]>(
        ApiRoutes.Chat.history(user.eId),
      );

      setMessages(mapChatHistory(response, user.eId));
    } catch (error) {
      console.error("[ChatScreen] Chat history error:", error);
    }
  }, [user, setMessages]);

  /**
   * Track scroll position for auto-scroll
   */
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    isNearBottom.current =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - SCROLL_OFFSET_THRESHOLD;
  }, []);

  /**
   * Handle banner color (pass-through)
   */
  const handleBannerColor = useCallback((color: string) => {
    return color;
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Render Functions
  // ─────────────────────────────────────────────────────────────

  const keyExtractor = useCallback((item: ListItem) => {
    if ("type" in item) {
      return (item as DateHeader | SystemPill).id;
    }
    return (item as Message).id;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      // Date separator
      if ("type" in item && item.type === "date") {
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

      // System pill
      if ("type" in item && item.type === "system") {
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
                  ? "Chat Consultation Started"
                  : `Chat Consultation Ended${pill.doctorName ? ` - ${pill.doctorName}` : ""}`}
              </Text>
            </View>

            {isStarted && pill.subLabel && (
              <View style={[styles.datePill, styles.subLabelPill]}>
                <Text style={styles.datePillText}>{pill.subLabel}</Text>
              </View>
            )}
          </View>
        );
      }

      // Regular message
      return <MessageItem item={item as Message} onOpenFile={handleOpenFile} />;
    },
    [handleOpenFile],
  );

  const renderEmptyState = useCallback(() => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No messages yet</Text>
      </View>
    );
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Status Flags
  // ─────────────────────────────────────────────────────────────
  const showRequested = chatStatus === "requested";
  const showWaiting = chatStatus === "busy";
  const showExpired = chatStatus === "expired";
  const showExit =
    chatStatus === "connected" ||
    chatStatus === "active" ||
    chatStatus === "ended";
  const showChatInterface = !showRequested && !showWaiting && !showExpired;
  const chatEnded = chatStatus === "ended";

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.bg_primary,
        },
      ]}
    >
      <StatusBar translucent={false} barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {doctorName ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {doctorName
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
              {doctorName ?? "Connecting to Doctor"}
            </Text>
            <Text style={styles.headerSub}>Chat Consultation</Text>
          </View>
        </View>

        {showExit && !chatEnded && (
          <PrimaryButton
            title="Exit Chat"
            onPress={handleConfirmClose}
            style={styles.exitButton}
            textStyle={styles.exitButtonText}
          />
        )}
        {chatEnded && (
          <PrimaryButton
            title="Close Chat"
            onPress={() => handleExitChat(true)}
            style={styles.closeButton}
            textStyle={styles.exitButtonText}
          />
        )}
      </View>

      {/* CONNECTION BANNER */}
      <ConnectionBanner
        connectionState={connectionState}
        emitColor={handleBannerColor}
      />

      {/* MAIN CONTENT */}
      <KeyboardStickyView
        style={{ flex: 1 }}
        offset={{ closed: -insets.bottom, opened: 0 }}
      >
        {/* REQUESTED STATE */}
        {showRequested && (
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

        {/* WAITING STATE */}
        {showWaiting && (
          <View style={styles.centerState}>
            <Text style={styles.stateText}>
              Sorry, All our doctors are currently busy. You can either wait or
              cancel the appointment.
            </Text>
            <View style={styles.buttonWrapper}>
              <PrimaryButton
                title="Cancel Appointment"
                onPress={handleCancelAppointment}
              />
            </View>
          </View>
        )}

        {/* EXPIRED STATE */}
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

        {/* CHAT INTERFACE */}
        {showChatInterface && (
          <FlatList
            ref={flatListRef}
            data={listItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.flatListContent}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 1,
              autoscrollToTopThreshold: 10,
            }}
            ListEmptyComponent={renderEmptyState}
          />
        )}

        {/* TYPING INDICATOR */}
        {typing && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Doctor typing...</Text>
          </View>
        )}

        {/* ATTACHMENT PREVIEW */}
        {attachment && (
          <View style={styles.preview}>
            <Text numberOfLines={1} style={styles.previewText}>
              {attachment.name || "Attachment"}
            </Text>
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <MaterialIcons name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* INPUT */}
        {showChatInterface && (
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TouchableOpacity
                onPress={handleOpenAttachmentMenu}
                disabled={!chatEnabled}
                style={styles.iconButton}
              >
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
                placeholderTextColor="#999"
                style={styles.input}
                multiline
                editable={chatEnabled}
                maxLength={1000}
              />

              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!chatEnabled || (!input.trim() && !attachment)}
                style={styles.iconButton}
              >
                <Ionicons
                  name="send"
                  size={26}
                  color={
                    chatEnabled && (input.trim() || attachment)
                      ? colors.primary
                      : "#ccc"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        
      </KeyboardStickyView>
      {/* Toast Notification */}
        <Toast
          visible={showToast}
          title={toastMessage.title}
          subtitle={toastMessage.subtitle}
          onHide={() => setShowToast(false)}
          duration={3000}
        />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MessageItem Component
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
    const isPdf =
      item.attachment?.name?.toLowerCase().endsWith(".pdf") ||
      item.attachment?.type === "pdf" ||
      item.type === "pdf";
    const isImage =
      item.attachment?.type?.includes("image") || item.type === "image";

    return (
      <View
        style={[
          styles.message,
          isUser ? styles.userMessage : styles.doctorMessage,
        ]}
      >
        {/* PDF Attachment */}
        {isPdf && (
          <TouchableOpacity
            style={styles.pdfCard}
            onPress={() => {
              const url = item.fileUrl || item.attachment?.uri;
              if (url) onOpenFile(url);
            }}
            activeOpacity={0.7}
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

        {/* Image Attachment */}
        {isImage && item.attachment?.uri && !isPdf && (
          <TouchableOpacity
            onPress={() => {
              const url = item.fileUrl || item.attachment?.uri;
              if (url) onOpenFile(url);
            }}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: item.attachment.uri }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Text Message */}
        {!!item.text && <Text style={styles.bubbleText}>{item.text}</Text>}

        {/* Meta Info */}
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

MessageItem.displayName = "MessageItem";

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4361EE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.black,
  },
  headerSub: {
    fontSize: 12,
    color: "#7B8194",
    marginTop: 1,
  },
  exitButton: {
    width: 70,
    height: 30,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 1,
  },
  closeButton: {
    // width: 70,
    width: "auto",
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderColor: colors.primary,
    borderWidth: 1,
  },
  exitButtonText: {
    color: colors.primary,
    fontSize: 12,
  },

  flatListContent: {
    padding: 16,
    gap: 6,
    paddingBottom: 14,
    paddingTop: 50,
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },

  message: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: "75%",
  },
  userMessage: {
    backgroundColor: "#DEF2DB",
    alignSelf: "flex-end",
  },
  doctorMessage: {
    backgroundColor: "#EDE7F7",
    alignSelf: "flex-start",
  },

  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    gap: 5,
  },
  time: {
    fontSize: 11,
    color: "#666",
  },
  status: {
    fontSize: 11,
    color: "#666",
  },

  // Pills
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
  datePillText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  subLabelPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  systemPill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillStarted: {
    backgroundColor: "#D6E5E1",
  },
  pillEnded: {
    backgroundColor: "#ECE1DF",
  },
  systemPillText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  pillTextStarted: {
    color: "#1A6B61",
  },
  pillTextEnded: {
    color: "#AB3D34",
  },

  typingContainer: {
    paddingLeft: 20,
    paddingBottom: 6,
  },
  typingText: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },

  inputContainer: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  iconButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 14,
  },

  preview: {
    padding: 10,
    backgroundColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
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
  pdfIcon: {
    fontSize: 26,
  },
  pdfName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A2E",
    maxWidth: 130,
  },
  pdfSub: {
    fontSize: 12,
    color: "#4361EE",
    marginTop: 2,
  },

  bubbleText: {
    fontSize: 14,
    color: "#1A1A2E",
    lineHeight: 20,
  },

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

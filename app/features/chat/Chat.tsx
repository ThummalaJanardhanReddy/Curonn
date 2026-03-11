import React, { useEffect, useRef, useState } from "react";
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
import { router } from "expo-router";
import { useUserStore } from "@/src/store/UserStore";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
import axiosClient from "@/src/api/axiosClient";
import { ChatHistoryItem, ChatMessage } from "@/src/constants/constants";
import ApiRoutes from "@/src/api/employee/employee";
import { openURL } from "expo-linking";
// import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";

const S3Link = `https://curonndatabucket.s3.ap-south-1.amazonaws.com/`;

export default function ChatScreen() {
  const {
    messages,
    setSession,
    typing,
    connectionState,
    setConnectionState,
    chatEnabled,
    clearChat,
    requestId,
    chatAcceptDetails,
    setMessages,
    reset: chatStoreReset,
  } = useChatStore();
  const chatStatus = useChatStore((s) => s.chatStatus);
  const chatEndedReason = useChatStore((s) => s.chatEndedReason);

  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const { isVisible } = useKeyboardState();
  const isNearBottom = useRef(true);

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
    // if (chatStatus === "busy") {
    //   Alert.alert("Doctors Busy", "Doctors are busy. Please wait...");
    // }

    // if (chatStatus === "ended" && chatEndedReason) {
    //   Alert.alert("Chat Ended", chatEndedReason);
    // }
    if (chatStatus === "connected") {
      fetchChatHistory();
    }
  }, [chatStatus]);

  /**
   * CLOSE CHAT
   */
  const confirmClose = () => {
    Alert.alert("End Consultation", "Are you sure you want to end this chat?", [
      { text: "Cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => {
          signalRService.disconnect();
          clearChat();
          // handleCancelAppointment();
          router.back();
        },
      },
    ]);
  };

  /**
   * SEND MESSAGE
   */
  const sendMessage = async () => {
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
  };

  /**
   * IMAGE PICKER
   */
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.7,
    });

    if (!res.canceled) {
      const asset = res.assets[0];

      setAttachment({
        uri: asset.uri,
        name: "image.jpg",
        type: "image/jpeg",
      });
    }
  };

  /**
   * DOCUMENT PICKER
   */
  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync();

    if (!res.canceled) {
      const file = res.assets[0];

      setAttachment({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      });
    }
  };

  /**
   * ATTACHMENT MENU
   */
  const openAttachmentMenu = () => {
    Alert.alert("Attachment", "Choose option", [
      { text: "Gallery", onPress: pickImage },
      { text: "Document", onPress: pickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openFile = (url: string) => {
    Linking.openURL(S3Link + url);
  };

  const getDayLabel = React.useCallback((timestamp: number) => {
    const messageDate = dayjs(timestamp);
    const today = dayjs();
    const yesterday = dayjs().subtract(1, "day");

    if (messageDate.isSame(today, "day")) return "Today";
    if (messageDate.isSame(yesterday, "day")) return "Yesterday";

    return messageDate.format("DD MMM YYYY");
  }, []);

  const getMessagesWithDateHeaders = (messages: Message[]) => {
    const result: (Message | { type: "date"; label: string })[] = [];

    let lastDate: string | null = null;

    messages.forEach((message) => {
      const currentDate = dayjs(message.timestamp).format("YYYY-MM-DD");

      if (currentDate !== lastDate) {
        result.push({
          type: "date",
          label: getDayLabel(message.timestamp),
        });
        lastDate = currentDate;
      }

      result.push(message);
    });

    return result;
  };

  const formattedMessages = React.useMemo(() => {
    return getMessagesWithDateHeaders(messages);
  }, [messages]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [formattedMessages]);

  const renderItem = React.useCallback(({ item }: any) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{item.label}</Text>
        </View>
      );
    }
    // else if (item.fileUrl) {
    //   return (
    //     <TouchableOpacity onPress={() => openFile(item.fileUrl)}>
    //       <Text>{item.fileName || "Attachment"}</Text>
    //     </TouchableOpacity>
    //   );
    // }

    return <MessageItem item={item} onOpenFile={openFile} />;
  }, []);

  const handleCancelAppointment = async () => {
    const reqId = requestId;
    if (!reqId) Alert.alert("Appointment Cancel", "Request ID not found!");

    const res = await axiosClient.post(ApiRoutes.Chat.cancel, {
      chatRequestId: reqId,
      patientid: user?.eId,
    });
    console.log("Chat appointment cancelled! ", res?.result);
    chatStoreReset();
    router.replace("/(main)/my-doctor");
  };
  /**
   * CONNECTION BANNER
   */
  const renderConnectionBanner = () => {
    if (connectionState === "connected") return null;
    if (connectionState === "disconnected")
      return (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Disconnected</Text>
          <PrimaryButton title="Exit" onPress={() => router.back()} />
        </View>
      );
    if (connectionState === "connecting") {
      return (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Connecting...</Text>
          <PrimaryButton title="Exit" onPress={() => router.back()} />
        </View>
      );
    }
  };

  /**
   * Waiting Banner
   */
  const renderWaitingBanner = () => {
    if (connectionState != "connected") return;
    if (chatStatus === "connected") return;
    switch (chatStatus) {
      case "busy":
      case "idle":
        return (
          <View style={styles.banner}>
            <Text style={[styles.bannerText, { fontSize: 16 }]}>
              Please wait. Our doctor will join shortly
            </Text>
            <PrimaryButton
              title="Cancel Appointment"
              onPress={handleCancelAppointment}
            />
          </View>
        );

      case "expired":
        return (
          <View style={styles.banner}>
            <Text
              style={[
                styles.bannerText,
                {
                  fontSize: 16,
                  textAlign: "center",
                },
              ]}
            >
              We are really Sorry, All our Doctors are busy now.
            </Text>
            <Text
              style={[
                styles.bannerText,
                {
                  fontSize: 16,
                  textAlign: "center",
                },
              ]}
            >
              Please book an appointment after some time.
            </Text>
            <PrimaryButton title="Exit" onPress={handleCancelAppointment} />
          </View>
        );
      default:
        break;
    }
  };

  const fetchChatHistory = async () => {
    try {
      // if (!user || !chatAcceptDetails) return;
      if (!user) return;
      // const response = await axiosClient.get<ChatHistoryItem[]>(
      //   ApiRoutes.Chat.history(user.eId, chatAcceptDetails.doctorId),
      // );
      const response = await axiosClient.get<ChatHistoryItem[]>(
        ApiRoutes.Chat.history(user.eId, 36),
      );
      const mappedMessages = mapChatHistory(response, user.eId);

      setMessages(mappedMessages);
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

        timestamp: new Date(item.sentOn).getTime(), // ✅ FIXED

        status: item.isRead ? "received" : "sent", // optional smarter mapping
      }));
  };

  const handleScroll = React.useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;

    isNearBottom.current =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  }, []);

  const keyExtractor = React.useCallback((item: any) => {
    return item.type === "date" ? `date-${item.label}` : item.id;
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg_primary,
        paddingTop: insets.top,
        paddingBottom: isVisible ? 0 : insets.bottom,
      }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          {chatAcceptDetails?.doctorName && (
            <Text style={styles.title}>{chatAcceptDetails?.doctorName}</Text>
          )}
          <Text style={styles.subtitle}>Chat Consultation</Text>
        </View>

        <TouchableOpacity onPress={confirmClose}>
          <MaterialIcons name="close" size={26} />
        </TouchableOpacity>
      </View>

      {/* CONNECTION */}

      <View style={{ flex: 1 }}>
        {renderConnectionBanner()}
        {renderWaitingBanner()}
        {connectionState === "connected" && chatStatus === "connected" && (
          <FlatList
            ref={flatListRef}
            data={formattedMessages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{
              minIndexForVisible: 1,
            }}
          />
        )}
      </View>

      {/* TYPING */}
      {typing && <Text style={styles.typing}>Doctor typing...</Text>}

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
      {/* <KeyboardStickyView offset={{ closed: 0, opened: 0 }}> */}
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={[styles.inputContainer]}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              onPress={openAttachmentMenu}
              disabled={!chatEnabled}
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
              placeholder="Message"
              editable={chatEnabled}
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
          </View>
        </View>
        {/* </KeyboardStickyView> */}
      </KeyboardStickyView>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.black,
  },

  subtitle: {
    color: colors.black,
    fontSize: 18,
  },

  banner: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    gap: 30,
  },

  bannerText: {
    fontSize: 24,
    color: colors.black,
  },

  testRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },

  testButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  testButtonText: {
    color: "white",
    fontSize: 12,
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
  },

  time: {
    fontSize: 11,
    color: "#666",
  },

  status: {
    marginLeft: 5,
    fontSize: 11,
    color: "#666",
  },

  typing: {
    paddingLeft: 16,
    color: "#888",
    paddingBottom: 6,
  },

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
  pdfButton: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
  },

  iconContainer: {
    width: 40,
    height: 40,
  },

  icon: {
    fontSize: 30,
    color: "#fff",
  },

  textContainer: {
    borderColor: colors.primary,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },

  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },

  fileSubText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  dateContainer: {
    alignItems: "center",
    marginVertical: 12,
  },

  dateText: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
});

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
            style={styles.pdfButton}
            onPress={() => {
              if (item?.fileUrl || item?.attachment) {
                const url = item.fileUrl || item.attachment?.uri;
                if (url) onOpenFile(url);
              }
            }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📄</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.fileSubText}>View Priscription</Text>
            </View>
          </TouchableOpacity>
        )}

        {item.attachment?.uri && !isPdf && (
          <Image source={{ uri: item.attachment.uri }} style={styles.image} />
        )}

        {item.text && <Text>{item.text}</Text>}

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

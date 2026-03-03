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
import { KeyboardStickyView } from "react-native-keyboard-controller";

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
// import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";

export default function ChatScreen() {
  const {
    messages,
    setSession,
    typing,
    connectionState,
    setConnectionState,
    chatEnabled,
    clearChat,
    chatAcceptDetails,
    setMessages,
  } = useChatStore();
  const chatStatus = useChatStore((s) => s.chatStatus);
  const chatEndedReason = useChatStore((s) => s.chatEndedReason);

  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();

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
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (chatStatus === "busy") {
      Alert.alert("Doctors Busy", "Doctors are busy. Please wait...");
    }

    if (chatStatus === "ended" && chatEndedReason) {
      Alert.alert("Chat Ended", chatEndedReason);
    }
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
      await signalRService.sendMessage(input, user?.eId, 34, 1, attachment);

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
    Linking.openURL(url);
  };

  const getDayLabel = (timestamp: number) => {
    const messageDate = dayjs(timestamp);
    const today = dayjs();
    const yesterday = dayjs().subtract(1, "day");

    if (messageDate.isSame(today, "day")) return "Today";
    if (messageDate.isSame(yesterday, "day")) return "Yesterday";

    return messageDate.format("DD MMM YYYY");
  };
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
  const formattedMessages = getMessagesWithDateHeaders(messages);
  /**
   * RENDER MESSAGE
   */
  const renderItem = ({ item }: any) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{item.label}</Text>
        </View>
      );
    }
    const isUser = item.sender === "user";
    const isPdf = item.attachment?.type === "pdf";
    return (
      <View
        style={[
          styles.message,
          isUser ? styles.userMessage : styles.doctorMessage,
        ]}
      >
        {isPdf && (
          <TouchableOpacity
            onPress={() => openFile(item.attachment.uri)}
            style={styles.pdfButton}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📄</Text>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.fileSubText}>View PDF</Text>
            </View>
          </TouchableOpacity>
        )}

        {item.attachment?.uri && !isPdf && (
          <Image source={{ uri: item.attachment.uri }} style={styles.image} />
        )}

        {item.text && (
          <Text style={{ color: isUser ? "white" : "black" }}>{item.text}</Text>
        )}

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
            <Text style={[styles.bannerText, { fontSize: 18 }]}>
              Please wait. Our doctor will add shortly...
            </Text>
            <PrimaryButton
              title="Cancel Appointment"
              onPress={() => console.log("doc busy. cancel")}
            />
          </View>
        );

      case "expired":
        return (
          <View style={styles.banner}>
            <Text style={[styles.bannerText, { fontSize: 18 }]}>
              We are really Sorry, All our Doctors are busy now. Please book an
              appointment after some time.
            </Text>
            <PrimaryButton
              title="Exit"
              onPress={() => console.log("doc busy too. exit")}
            />
          </View>
        );
      default:
        break;
    }
  };

  const fetchChatHistory = async () => {
    try {
      if (!user || !chatAcceptDetails) return;
      // if (!user) return;
      const response = await axiosClient.get<ChatHistoryItem[]>(
        ApiRoutes.Chat.history(user.eId, chatAcceptDetails.doctorId),
      );
      // const response = await axiosClient.get<ChatHistoryItem[]>(
      //   ApiRoutes.Chat.history(user.eId, 34),
      // );
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
              uri: `https://curonndatabucket.s3.ap-south-1.amazonaws.com/${item.fileUrl}`,
              name: item.fileUrl.split("/").pop() || "file",
              type: item.fileUrl.split(".").pop()?.toLowerCase(),
            }
          : undefined,

        fileUrl: item.fileUrl ?? undefined,

        timestamp: new Date(item.sentOn).getTime(), // ✅ FIXED

        status: item.isRead ? "received" : "sent", // optional smarter mapping
      }));
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg_secondary,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg_primary,
        }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Janardhan</Text>
            <Text style={styles.subtitle}>Chat Consultation</Text>
          </View>

          <TouchableOpacity onPress={confirmClose}>
            <MaterialIcons name="close" size={26} />
          </TouchableOpacity>
        </View>

        {/* CONNECTION */}
        {renderConnectionBanner()}
        {renderWaitingBanner()}
        {chatStatus == "connected" && (
          <FlatList
            ref={flatListRef}
            data={formattedMessages}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              "type" in item ? `date-${index}` : item.id
            }
            contentContainerStyle={{
              padding: 16,
            }}
          />
        )}

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
        <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
          <View
            style={[
              styles.inputContainer,
              {
                paddingBottom: insets.bottom,
              },
            ]}
          >
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
        </KeyboardStickyView>
      </View>
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
    // padding: 16,
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
    color: colors.primary,
  },

  banner: {
    flex: 1,
    backgroundColor: "#FFF3CD",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
  },

  doctorMessage: {
    backgroundColor: "#eee",
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
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#2f5cb6",
    // padding: 12,
    borderRadius: 12,
    marginTop: 6,
    // maxWidth: 260,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#E53935", // soft medical red
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  icon: {
    fontSize: 20,
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
    fontSize: 18,
    color: "#000000",
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

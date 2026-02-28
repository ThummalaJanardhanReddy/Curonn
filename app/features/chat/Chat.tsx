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
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import dayjs from "dayjs";

import { signalRService } from "../../../src/api/SignalRService";
import { useChatStore } from "../../../src/store/ChatStore";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/app/shared/styles/commonStyles";
import { router } from "expo-router";
import { useUserStore } from "@/src/store/UserStore";
import PrimaryButton from "@/app/shared/components/PrimaryButton";
// import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";

export default function ChatScreen() {
  const {
    messages,
    setSession,
    typing,
    connectionState,
    chatEnabled,
    clearChat,
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
      await signalRService.sendMessage(input, 267, 34, 1, attachment);

      setInput("");
      setAttachment(null);
    } catch {
      Alert.alert("Failed", "Message failed to send");
    }
  };

  /**
   * SEND MESSAGE
   */
  const sendMessageTest = async () => {
    if (!input.trim() && !attachment) return;

    try {
      await signalRService.sendMessage(input, 34, 267, 1, attachment);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  /**
   * TEST BUTTONS
   */
  const simulateDoctorMessage = () => {
    useChatStore.getState().addMessage({
      id: Date.now().toString(),
      text: "Hello, I am your doctor. How can I help?",
      sender: "doctor",
      timestamp: Date.now(),
      status: "sent",
    });
  };

  const simulateConversation = () => {
    useChatStore.getState().addMessage({
      id: Date.now().toString(),
      text: "I have headache",
      sender: "user",
      timestamp: Date.now(),
      status: "sent",
    });

    setTimeout(() => {
      useChatStore.getState().addMessage({
        id: (Date.now() + 1).toString(),
        text: "Please take rest and drink water",
        sender: "doctor",
        timestamp: Date.now(),
        status: "sent",
      });
    }, 1000);
  };

  /**
   * RENDER MESSAGE
   */
  const renderItem = ({ item }: any) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.message,
          isUser ? styles.userMessage : styles.doctorMessage,
        ]}
      >
        {item.attachment?.uri && (
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

    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          {connectionState === "connecting" ? "Connecting..." : "Disconnected"}
        </Text>
        <PrimaryButton title="Exit" onPress={()=>router.back()} />
      </View>
    );
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

        {/* TEST BUTTONS */}
        <View style={styles.testRow}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={sendMessageTest}
          >
            <Text style={styles.testButtonText}>Doctor Msg</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={simulateConversation}
          >
            <Text style={styles.testButtonText}>Test Chat</Text>
          </TouchableOpacity>
        </View>

        {/* CHAT LIST */}
        {/* <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 80,
          }}
          keyboardShouldPersistTaps="handled"
        /> */}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
          }}
        />

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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
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
    backgroundColor: "#FFF3CD",
    padding: 6,
    alignItems: "center",
    justifyContent: 'center',
    gap: 15
  },

  bannerText: {
    fontSize: 12,
    color: "#856404",
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
});

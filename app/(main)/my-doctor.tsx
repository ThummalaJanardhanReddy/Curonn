import { router } from "expo-router";
import React, {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardStickyView,
  useKeyboardController,
  useKeyboardState,
} from "react-native-keyboard-controller";
import { images } from "../../assets";
import CommonHeader from "../shared/components/CommonHeader";
import commonStyles, { colors } from "../shared/styles/commonStyles";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
  wp,
} from "../shared/utils/responsive";
import AnimatedTabs from "../shared/components/ui/AnimatedTabs";
import { useDoctorConsultationStore } from "@/src/store/doctor-consultation";
import { useUser } from "../shared/context/UserContext";
import { useUserStore } from "@/src/store/UserStore";
import PrimaryButton from "../shared/components/PrimaryButton";
import axiosClient from "@/src/api/axiosClient";
import ApiRoutes from "@/src/api/employee/employee";
import SeacrchIcon from "../../assets/AppIcons/Curonn_icons/search.svg";
import {
  IConsultationType,
  ICreateAppointmentRequest,
  ChatHistoryItem,
  S3Link,
} from "@/src/constants/constants";
import dayjs from "dayjs";
import {
  useChatStore,
  Message,
  useChatAcceptance,
} from "@/src/store/ChatStore";
import { fonts } from "@/app/shared/styles/fonts";
import SelectPatientModal from "../shared/components/SelectPatientModal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export interface IDepartments {
  charges: number;
  createdBy: number;
  createdOn: string;
  deletedBy: string;
  deletedOn: string;
  isActive: boolean;
  modifiedBy: string;
  modifiedOn: string;
  serviceId: string;
  specialityMasterId: number;
  specialityName: string;
  totalCount: number;
  image: string;
  description: string;
}
const consultationTypes: IConsultationType[] = [
  { label: "Chat", value: 1340, key: "chat" },
  { label: "Video Call", value: 1339, key: "Video" },
  { label: "Phone", value: 1341, key: "Phone" },
];
const chatId = 1340;

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
  appointmentId?: number;
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
             <Image source={images.prescription}  style={styles.prescription}/>
            <View>
              <Text style={styles.pdfName} numberOfLines={1}>
                {"Prescription"}
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
        appointmentId: msg.appointmentId,
      });
    }

    // ── Message bubble (only if real content exists) ─────
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

export default function MyDoctorScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("New York, NY");
  const [showSelectPatientModal, setShowSelectPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [relationPatientId, setrelationPatientId] = useState("");
  const [selectedRelation, setSelectedRelation] = useState<{
    masterDataId: number;
    name: string;
  } | null>(null);
  const [patientType, setPatientType] = useState("self");
  // const [consultationTypeIndex, setConsultationTypeIndex] = useState(0);
  const [consultationTypeId, setConsultationTypeId] = useState(
    consultationTypes[0].value,
  );
  const [departments, setDepartments] = useState<IDepartments[]>();
  // const user = useUser();
  const { user } = useUserStore();
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
  const setDepartment = useDoctorConsultationStore(
    (state) => state.setDepartment,
  );
  const setConsultation = useDoctorConsultationStore(
    (state) => state.setConsultationType,
  );

  const { consultationTypeId: consultationTypeIdStore,  } =
    useDoctorConsultationStore();

  // Chat variables
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { isVisible } = useKeyboardState();
  const isNearBottom = useRef(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const { acceptDetails, doctorName } = useChatAcceptance();
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  // Pass doctorName into buildListItems so "Chat Ended" can include it
  const listItems = useMemo(
    () => buildListItems(messages, doctorName),
    [messages, doctorName],
  );

  useEffect(() => {
    if (consultationTypeIdStore) {
      setConsultationTypeId(consultationTypeIdStore);
    }
  }, [consultationTypeIdStore]);

  const fetchDepartments = async () => {
    try {
      const deptResponse = await axiosClient.get(
        ApiRoutes.Departments.getAllDepartments,
      );

      const items = deptResponse?.data?.items;

      if (!items) {
        console.warn("Departments fetch failed");
        return;
      }

      setDepartments(items);
      console.log("departments: ", items);
    } catch (error) {
      console.log("Departments error:", error);
    }
  };

  useEffect(() => {
    if (consultationTypeId === chatId) {
      fetchDepartments();
    }
  }, [consultationTypeId]);

  /**
   * AUTOSCROLL
   */
  useEffect(() => {
    if (messages.length && isNearBottom.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length, isHistoryLoading]);
  useEffect(() => {
    if (isNearBottom.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [listItems.length]);

  // Fetch history on connect
  useFocusEffect(
    useCallback(() => {
      fetchChatHistory();
    }, []),
  );

  const fetchChatHistory = async () => {
    try {
      if (!user) return;
      setIsHistoryLoading(true);
      const response = await axiosClient.get<ChatHistoryItem[]>(
        ApiRoutes.Chat.history(user.eId),
      );
      const data = response?.data || response;
      setMessages(mapChatHistory(data, user.eId));
    } catch (error) {
      console.log("Chat history error:", error);
    } finally {
      setIsHistoryLoading(false);
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
        isChat: typeof item.isChat === "boolean" ? item.isChat : undefined,
        defaultMessage: item.defaultMessage ?? undefined,
        appointmentId: item.appointmentId,
      }));
  };

  const groupedChats = useMemo(() => {
    const map = new Map<
      number,
      {
        id: string;
        appointmentId: number;
        messages: Message[];
        firstMessageTime: number;
      }
    >();

    messages.forEach((msg) => {
      // Skip temporary messages if needed
      if (!msg.appointmentId) return;

      if (!map.has(msg.appointmentId)) {
        map.set(msg.appointmentId, {
          id: msg.id,
          appointmentId: msg.appointmentId,
          messages: [],
          firstMessageTime: msg.timestamp,
        });
      }

      map.get(msg.appointmentId)!.messages.push(msg);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.firstMessageTime - a.firstMessageTime,
    );
  }, [messages]);

  const appointmentIndexMap = useMemo(() => {
    const map = new Map<number, string>();

    listItems.forEach((item, index) => {
      if (
        item.type === "system" &&
        item.variant === "started" &&
        item.appointmentId
      ) {
        map.set(item.appointmentId, item.id);
      }
    });

    return map;
  }, [listItems]);

  const scrollToAppointment = (appointmentId: number, fallbackId?: string) => {
    const pillId = appointmentIndexMap.get(appointmentId);
    let index = pillId ? listItems.findIndex((i) => i.id === pillId) : -1;

    if (index === -1 && fallbackId) {
      index = listItems.findIndex((i) => i.id === fallbackId);
    }

    if (index === -1) {
      setHistoryModalVisible(false);
      return;
    }

    setHistoryModalVisible(false);
    isNearBottom.current = false;

    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.1,
      });
    }, 250);
  };

  const openFile = useCallback((url: string) => {
    Linking.openURL(S3Link + url);
  }, []);
  //MBBS Category
  const mbbsList = useMemo(
    () => [
      {
        id: "mbbs-physician",
        name: "Physician",
        description: "General Medicine (MBBS)",
        image: {
          uri: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop",
        },
      },
    ],
    [],
  );

  const filteredSpecialists = useMemo(() => {
    if (!searchQuery) return departments ?? [];

    return (
      departments?.filter((department) =>
        department.specialityName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
      ) ?? []
    );
  }, [departments, searchQuery]);

  const handleSpecialistSelect = (
    specialistId: number,
    specialistName: string,
    specialityImage: string,
  ) => {
    setDepartment(specialistId, specialistName, specialityImage);

    router.push({
      pathname: "/features/symptoms/symptoms",
    });
  };

  const renderSpecialistCard = useCallback(
    ({ item }: { item: IDepartments }) => (
      <TouchableOpacity
        style={styles.specialistCard}
        onPress={() =>
          handleSpecialistSelect(
            item.specialityMasterId,
            item.specialityName,
            item.image,
          )
        }
        activeOpacity={0.8}
      >
        <View style={styles.specialistImageContainer}>
          <Image
            defaultSource={{
              uri: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=400&fit=crop`,
            }}
            source={{
              uri: item.image,
            }}
            style={styles.specialistImage}
          />
        </View>
        <View style={styles.specialistTextContainer}>
          <Text style={styles.specialistName}>{item.specialityName}</Text>
          {/* <Text style={styles.specialistDescription}>{item.description}</Text> */}
        </View>
      </TouchableOpacity>
    ),
    [],
  );
  const patientId = user?.eId || 0;
  const handleChatStart1 = async () => {
    setShowSelectPatientModal(false);
    setTimeout(() => {
      setSelectedPatient(null);
      setShowSelectPatientModal(true);
      console.log("Modal opened for patient selection");
    }, 0);
  };

  const handlePatientSelected = async (member: any) => {
    console.log("Selected member from modal:", member);
    const normalized = {
      relationId: member.relationId || 0,
      relationName: member.fullName || member.name || member.relationName || "",
      patientId: member.patientId || member.e_id || member.id || "",
      gender: member.gender || "",
      age: member.age || "",
      relationPatientId: member.relationPatientId || member.patientId || "",
    };
    console.log("Selected member normalized:", normalized);

    setSelectedPatient(null);
    setShowSelectPatientModal(false);
    setSelectedPatient(normalized);
    setFullName(normalized.relationName);
    setAge(normalized.age ? String(normalized.age) : "");
    setGender(normalized.gender);
    setrelationPatientId(normalized.relationPatientId);

    // Only set as 'self' if relationId is 0 and relationName is 'Self' or matches user name
    const normalizedRelationName = (normalized.relationName || "")
      .trim()
      .toLowerCase();
    const userName = (user?.fullName || "").trim().toLowerCase();
    if (
      normalized.relationId === 0 &&
      (normalizedRelationName === "self" || normalizedRelationName === userName)
    ) {
      setSelectedRelation(null);
      setPatientType("self");
    } else {
      setSelectedRelation({
        masterDataId: normalized.relationId,
        name: normalized.relationName,
      });
      setPatientType("others");
    }

    if (!user) return;
    try {
      // Use normalized values directly to avoid async state issues
      const normalizedRelationName = (normalized.relationName || "")
        .trim()
        .toLowerCase();
      const userName = (user?.fullName || "").trim().toLowerCase();

      const isSelfService =
        normalized.relationId === 0 &&
        (normalizedRelationName === "" || normalizedRelationName === userName);

      const payload: any = {
        patientId: Number(normalized.relationPatientId || user?.eId),
        isSelfService,
      };
      console.log("Chat start payload before relation details:", payload);
      if (isSelfService) {
        payload.relationId = 0;
        payload.relationName = "";
        payload.relationAge = 0;
        payload.relationGender = "";
      } else {
        payload.isSelfService = false; // IMPORTANT
        payload.relationId = normalized.relationId || 0; // fallback
        payload.relationName = normalized.relationName?.trim();
        payload.relationAge = Number(normalized.age) || 0;
        payload.relationGender = normalized.gender || "";
      }
      const res: any = await axiosClient.post(
        ApiRoutes.Chat.SendChatRequestWithRelation,
        payload,
      );
      const relationPatientId = payload.patientId;
      useChatStore.getState().setRequestId(res?.chatRequestId);
      useChatStore.getState().setrelationPationId(relationPatientId);
      console.log("Chat started with request ID:", res);
      router.push("/features/chat/Chat");
    } catch (error) {
      Alert.alert(
        "Chat Consultation Failed",
        "Chat appointment failed: " + error,
      );
    }
  };
  const handleConsultationTypeChange = (data: IConsultationType) => {
    setConsultationTypeId(data.value);
    setConsultation(data.key, data.value);
  };

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const nearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    isNearBottom.current = nearBottom;
    setShowScrollToBottom(!nearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    isNearBottom.current = true;
    setShowScrollToBottom(false);
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const keyExtractor = useCallback((item: any) => {
    return (item as DateHeader | SystemPill).id ?? (item as Message).id;
  }, []);

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
                  ? "Chat consultation Started"
                  : `Chat consultation Ended${pill.doctorName ? ` - ${pill.doctorName}` : ""}`}
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

  const emptyHistoryComp = useCallback(() => {
    return (
      <View
        style={{
          flex: 1,
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 8,
          height: "100%",
        }}
      >
        <Text style={{ fontSize: 16, color: "#000000" }}>
          No chat history available.
        </Text>
      </View>
    );
  }, []);

  const onScrollToIndexFailed = ({
    index,
    averageItemLength,
  }: {
    index: number;
    averageItemLength: number;
  }) => {
    flatListRef.current?.scrollToOffset({
      offset: averageItemLength * index,
      animated: false,
    });

    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0,
      });
    }, 150);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#fff" /> */}
      {/* Header */}
      {/* <StatusBar barStyle="dark-content" translucent={false} backgroundColor='#ffffffff'/> */}
      <View style={styles.defaultHeader}>
        <CommonHeader
          currentLocation={currentLocation}
          onProfilePress={() => console.log("Profile pressed")}
          onCartPress={() => console.log("Cart pressed")}
          showCart={false}
        />
      </View>
      <View style={styles.boxcolor}>
        <View style={{ paddingVertical: 5, paddingHorizontal: 20 }}>
          <AnimatedTabs
            tabs={consultationTypes}
            activeValue={consultationTypeId}
            onChange={handleConsultationTypeChange}
          />
        </View>

        {consultationTypeId !== chatId && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              {/* Search Bar */}
              <SeacrchIcon width={18} height={18} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search department"
                placeholderTextColor="#000"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Image source={images.icons.close} style={styles.clearIcon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        {consultationTypeId === chatId ? (
          <View
            style={{
              flex: 1,
              gap: 2,
            }}
          >
            {isHistoryLoading ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                {listItems?.length > 0 && (
                  <TouchableOpacity
                    style={styles.filterContainer}
                    onPress={() => setHistoryModalVisible(true)}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Filter
                    </Text>
                    <MaterialCommunityIcons
                      name="filter-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}

                <View style={{ flex: 1 }}>
                  <FlatList
                    ref={flatListRef}
                    data={listItems}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={{
                      gap: 4,
                      paddingBottom: 30,
                      paddingTop: 10,
                      paddingHorizontal: 20,
                      flexGrow: 1,
                    }}
                    scrollEventThrottle={16}
                    onScroll={handleScroll}
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 1,
                      // autoscrollToTopThreshold: 10,
                    }}
                    ListEmptyComponent={emptyHistoryComp}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                  />

                  {showScrollToBottom && (
                    <TouchableOpacity
                      style={styles.scrollToBottomButton}
                      onPress={scrollToBottom}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={24}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
            <View
              style={{
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
                height: 70,
                // backgroundColor: "#EDDCEA",
              }}
            >
              <PrimaryButton
                title="Start New Consultation"
                onPress={handleChatStart1}
                style={{
                  paddingHorizontal: 40,
                  width: "auto",
                  height: 40,
                  borderRadius: 23,
                  // backgroundColor: "transparent",
                  borderColor: colors.primary,
                  borderWidth: 1,
                }}
                textStyle={{
                  color: colors.white,
                  fontSize: 14,
                  fontWeight: "700",
                }}
              />

              <SelectPatientModal
                visible={showSelectPatientModal}
                onClose={() => setShowSelectPatientModal(false)}
                onSelect={handlePatientSelected}
                patientId={patientId}
              />
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Choose Your Specialist Title */}
            <View style={styles.pageContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Choose your specialist</Text>
              </View>

              {/* Specialists Grid */}
              <View style={styles.specialistsContainer}>
                <View style={styles.specialistsGrid}>
                  {filteredSpecialists?.map((specialist) => (
                    <View
                      key={specialist.specialityMasterId}
                      style={styles.specialistCardWrapper}
                    >
                      {renderSpecialistCard({ item: specialist })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setHistoryModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
            <View style={styles.handle} />

            <View style={styles.historyHeader}>
              <Text style={styles.sheetTitle}>Chat History</Text>
              <TouchableOpacity
                onPress={() => setHistoryModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={groupedChats}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() =>
                    scrollToAppointment(item.appointmentId, item.id)
                  }
                >
                  <View>
                    <Text style={styles.historyTitle}>
                      Consultation #{item.appointmentId}
                    </Text>

                    <Text style={styles.historyDate}>
                      {dayjs(item.firstMessageTime).format(
                        "DD MMM YYYY • hh:mm A",
                      )}
                    </Text>

                    <Text style={styles.historyCount}>
                      {item.messages.length} messages
                    </Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    //...commonStyles.container_layout,
    flex: 1,
    backgroundColor: colors.white,
    // backgroundColor: colors.white,
  },
  defaultHeader: {
    paddingHorizontal: getResponsiveSpacing(20),
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  content: {
    flex: 1,
  },
  boxcolor: {
    backgroundColor: colors.bg_rest,
    flex: 1,
    paddingTop: 5,
  },
  searchContainer: {
    marginBottom: getResponsiveSpacing(10),
    paddingHorizontal: getResponsiveSpacing(20),
    marginTop: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: "#fff",
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(4),
    height: 40,
  },
  searchIcon: {
    ...getResponsiveImageSize(20, 20),
    marginRight: getResponsiveSpacing(8),
    tintColor: "#808080",
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(12),
    paddingVertical: getResponsiveSpacing(4),
    color: "#000",
    fontFamily: fonts.regular,
  },
  clearButton: {
    padding: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(8),
  },
  clearIcon: {
    ...getResponsiveImageSize(16, 16),
    tintColor: "#999",
  },
  pageContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    marginTop: getResponsiveSpacing(10),
  },
  titleContainer: {
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(14),
  },
  titleText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: fonts.medium,
    fontWeight: "600",
    color: colors.text,
    textAlign: "left",
  },
  specialistsContainer: {
    // paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
  },
  specialistsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: getResponsiveSpacing(8),
  },
  specialistCardWrapper: {
    width: wp(28),
    marginBottom: getResponsiveSpacing(8),
  },
  specialistCard: {
    width: "100%",
    height: wp(32),
    borderRadius: getResponsiveSpacing(12),
    overflow: "hidden",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  specialistImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  specialistImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  specialistTextContainer: {
    position: "absolute",
    bottom: 7,
    left: 0,
    right: 0,
    // backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: getResponsiveSpacing(6),
    zIndex: 1,
  },
  specialistName: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: "900",
    color: "#fff",
    marginBottom: getResponsiveSpacing(1),
    textAlign: "left",
    paddingLeft: 7,
  },
  specialistDescription: {
    fontFamily: fonts.regular,
    fontSize: getResponsiveFontSize(8),
    color: "#fff",
    textAlign: "center",
    lineHeight: getResponsiveFontSize(10),
  },

  chatStartButton: {
    backgroundColor: "#1976D2", // or colors.primary
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  chatStartButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
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
  },
  pillStarted: { backgroundColor: "#D6E5E1" },
  pillEnded: { backgroundColor: "#ECE1DF" },
  systemPillText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
  pillTextStarted: { color: "#1A6B61" },
  pillTextEnded: { color: "#AB3D34" },

  message: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: "75%",
  },
  userMessage: { backgroundColor: "#DEF2DB", alignSelf: "flex-end" },
  doctorMessage: { backgroundColor: "#EDE7F7", alignSelf: "flex-start" },

  scrollToBottomButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  image: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },

  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 5 },
  time: { fontSize: 11, color: "#666" },
  status: { marginLeft: 5, fontSize: 11, color: "#666" },
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
  prescription: {width: 26, height: 26, resizeMode: 'cover'},
  bubbleText: { fontSize: 14, color: "#1A1A2E", lineHeight: 20 },
  filterContainer: {
    position: "absolute",
    top: 0,
    right: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 1,
    flexDirection: "row",
    gap: 5,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 24,
    marginBottom: 20,
    height: "70%",
  },

  handle: {
    width: 50,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#D0D0D0",
    alignSelf: "center",
    marginTop: 10,
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    padding: 20,
  },

  historyItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  historyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },

  historyDate: {
    color: "#666",
    marginTop: 4,
  },

  historyCount: {
    color: colors.primary,
    marginTop: 4,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingHorizontal: 20,
    // paddingVertical: 10,
  },
  closeButton: {
    // padding: 10,
    paddingRight: 25,
  },
});

import React, { useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export interface ChatHistoryItem {
  appointmentId: number;
  messageId: number;
  messageText: string;
  defaultMessage: string;
  fileUrl: string;
  sentOn: string;
  isChat: boolean;
  senderId: number;
  receiverId: number;
  isRead: boolean;
  isActive: boolean;
}

type AppointmentGroup = {
  appointmentId: number;
  messages: ChatHistoryItem[];
};

export default function ChatHistoryScreen() {
  const { history } = useLocalSearchParams();

  const chatHistory: ChatHistoryItem[] = JSON.parse(
    history as string,
  );

  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const groupedHistory = useMemo(() => {
    const map = new Map<number, ChatHistoryItem[]>();

    chatHistory.forEach((item) => {
      const existing = map.get(item.appointmentId) || [];

      existing.push(item);

      map.set(item.appointmentId, existing);
    });

    return Array.from(map.entries()).map(
      ([appointmentId, messages]) => ({
        appointmentId,
        messages: messages.sort(
          (a, b) =>
            new Date(a.sentOn).getTime() -
            new Date(b.sentOn).getTime(),
        ),
      }),
    );
  }, [chatHistory]);

  const toggleExpand = (appointmentId: number) => {
    setExpandedIds((prev) =>
      prev.includes(appointmentId)
        ? prev.filter((id) => id !== appointmentId)
        : [...prev, appointmentId],
    );
  };

  const renderMessage = (item: ChatHistoryItem) => {
    return (
      <View
        key={item.messageId}
        style={{
          marginTop: 8,
          padding: 10,
          backgroundColor: "#F5F5F5",
          borderRadius: 8,
        }}
      >
        {!!item.defaultMessage && (
          <Text
            style={{
              fontWeight: "600",
              color: "#6B46C1",
            }}
          >
            {item.defaultMessage}
          </Text>
        )}

        {!!item.messageText && (
          <Text
            style={{
              marginTop: 4,
            }}
          >
            {item.messageText}
          </Text>
        )}

        <Text
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "#666",
          }}
        >
          {dayjs(item.sentOn).format(
            "DD MMM YYYY, hh:mm A",
          )}
        </Text>
      </View>
    );
  };

  const renderAppointment = ({
    item,
  }: {
    item: AppointmentGroup;
  }) => {
    const expanded = expandedIds.includes(
      item.appointmentId,
    );

    const first = item.messages[0];

    return (
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            toggleExpand(item.appointmentId)
          }
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Appointment #{item.appointmentId}
            </Text>

            <Text
              style={{
                color: "#666",
                marginTop: 4,
              }}
            >
              {dayjs(first.sentOn).format(
                "DD MMM YYYY",
              )}
            </Text>

            <Text
              style={{
                color: "#999",
                marginTop: 4,
              }}
            >
              {item.messages.length} messages
            </Text>
          </View>

          <MaterialCommunityIcons
            name={
              expanded
                ? "chevron-up"
                : "chevron-down"
            }
            size={28}
          />
        </TouchableOpacity>

        {expanded && (
          <View
            style={{
              marginTop: 12,
            }}
          >
            {item.messages.map(renderMessage)}
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={groupedHistory}
      keyExtractor={(item) =>
        item.appointmentId.toString()
      }
      renderItem={renderAppointment}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
    />
  );
}
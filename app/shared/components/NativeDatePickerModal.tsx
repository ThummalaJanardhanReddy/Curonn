import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../styles/commonStyles";
import { getResponsiveFontSize, getResponsiveSpacing } from "../utils/responsive";

interface NativeDatePickerModalProps {
  visible: boolean;
  value: Date;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

/**
 * Cross-platform date picker that follows each platform's own convention:
 * Android shows the native dialog, which dismisses itself on selection.
 * iOS has no such auto-dismiss for a spinner picker, so it's presented as a
 * bottom sheet with explicit Cancel/Done actions per Apple's HIG.
 *
 * Renders as a plain absolute-positioned overlay rather than an RN <Modal> —
 * iOS only allows one native Modal presented at a time, and most callers use
 * this from inside a screen that's already a Modal itself. Render this
 * component as a child *inside* that enclosing Modal (not as a sibling after
 * it) so the overlay paints on top of it without needing to hide it first.
 */
export default function NativeDatePickerModal({
  visible,
  value,
  onCancel,
  onConfirm,
  minimumDate,
  maximumDate,
}: NativeDatePickerModalProps) {
  const [tempDate, setTempDate] = useState(value);

  useEffect(() => {
    if (visible) setTempDate(value);
  }, [visible, value]);

  if (!visible) return null;

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          if (event.type === "dismissed" || !date) {
            onCancel();
            return;
          }
          onConfirm(date);
        }}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    );
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onCancel} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onConfirm(tempDate)}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="spinner"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            if (date) setTempDate(date);
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          textColor="black"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: getResponsiveSpacing(15),
    borderTopRightRadius: getResponsiveSpacing(15),
    paddingBottom: getResponsiveSpacing(30),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: getResponsiveSpacing(15),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  buttonText: {
    fontSize: getResponsiveFontSize(16),
    color: "#666",
    fontWeight: "700",
  },
});

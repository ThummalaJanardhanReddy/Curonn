import React, { cloneElement, isValidElement } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../styles/commonStyles";

interface ProfileScreenModalProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export default function ProfileScreenModal({
  visible,
  onClose,
  children,
}: ProfileScreenModalProps) {
  // Clone the child component and pass the onClose function as a prop
  const childWithProps = isValidElement(children)
    ? cloneElement(children, {onClose})
    : children;

    const inset = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, {paddingTop: inset.top, paddingBottom: inset.bottom}]} >{childWithProps}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

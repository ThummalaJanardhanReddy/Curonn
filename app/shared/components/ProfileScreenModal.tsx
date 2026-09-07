import React, { cloneElement, isValidElement } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../styles/commonStyles";

interface ProfileScreenModalProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

/**
 * Renders as a plain full-screen overlay rather than an RN <Modal> — iOS only
 * allows one native Modal presented at a time, and this is always used from
 * inside the already-open "User Profile" Modal. Render this as a child inside
 * that enclosing Modal (not a sibling after it) so it paints on top without
 * needing to hide the parent first.
 */
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

  if (!visible) return null;

  return (
    <View style={[styles.overlay, {paddingTop: inset.top, paddingBottom: inset.bottom}]}>
      {childWithProps}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.white,
  },
});

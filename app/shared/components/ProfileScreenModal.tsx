import React, { cloneElement, isValidElement } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/commonStyles';

interface ProfileScreenModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ProfileScreenModal({ visible, onClose, children }: ProfileScreenModalProps) {
  // Clone the child component and pass the onClose function as a prop
  const childWithProps = isValidElement(children)
    ? cloneElement(children, { onClose })
    : children;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {childWithProps}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

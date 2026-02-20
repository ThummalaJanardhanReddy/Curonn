import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ToastProps {
  visible: boolean;
  title: string;
  subtitle: string;
  onHide: () => void;
  duration?: number;
  type?: 'success' | 'error';
}

const { width: screenWidth } = Dimensions.get('window');

export default function Toast(props: ToastProps) {
  const {
    visible,
    title,
    subtitle,
    onHide,
    duration = 3000,
    type = 'success',
  } = props;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  // Choose color and icon based on type
  const backgroundColor = type === 'error' ? '#ff4d4f' : '#4BB543';
  const icon = type === 'error' ? '✗' : '✓';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor }]}>
        <View style={styles.toastContent}>
          <Text style={styles.toastTitle}>{typeof title === 'string' ? title : String(title)}</Text>
          <Text style={styles.toastSubtitle}>{typeof subtitle === 'string' ? subtitle : String(subtitle)}</Text>
        </View>
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>{icon}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  toastSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

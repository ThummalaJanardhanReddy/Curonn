import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { getResponsiveSpacing, getResponsiveFontSize, wp } from '../utils/responsive';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  width?: number;
  height?: number;
}

export default function SecondaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  width,
  height = getResponsiveSpacing(45),
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          height,
          ...(width && { width }),
        },
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C15E9C',
    borderRadius: getResponsiveSpacing(22.5), // Half of height for rounded appearance
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing(16),
    minWidth: getResponsiveSpacing(80),
  },
  buttonText: {
    color: '#C15E9C',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    borderColor: '#CCCCCC',
    opacity: 0.7,
  },
  buttonTextDisabled: {
    color: '#999999',
  },
});

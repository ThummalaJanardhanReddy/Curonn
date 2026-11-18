import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { getResponsiveSpacing, getResponsiveFontSize, wp } from '../utils/responsive';
import { colors } from '../styles/commonStyles';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  width?: number;
  height?: number;
}

export default function SecondaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  width,
  height = getResponsiveSpacing(45),
}: SecondaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          height,
          ...(width && { width }),
        },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: getResponsiveSpacing(22.5), // Half of height for rounded appearance
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing(16),
    minWidth: getResponsiveSpacing(80),
  },
  buttonText: {
    color: colors.primary,
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

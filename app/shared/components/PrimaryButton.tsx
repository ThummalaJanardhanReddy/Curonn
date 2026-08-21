import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing, wp } from '../utils/responsive';
import { fonts } from '../styles/fonts';
import { colors } from '../styles/commonStyles';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  width?: number;
  height?: number;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  width = wp(80), // 80% of screen width
  height = getResponsiveSpacing(40),
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width,
          height,
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
    backgroundColor: colors.primary,
    borderRadius: getResponsiveSpacing(23),
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: "700",
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.22,
    // shadowRadius: 2.22,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(16),
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    // fontWeight: "700",
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
    // elevation: 0,
    // shadowOpacity: 0,
  },
  buttonTextDisabled: {
    color: '#999999',
    fontFamily: fonts.regular,
  },
});

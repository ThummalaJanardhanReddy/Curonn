import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, Rect, Stop, RadialGradient } from "react-native-svg";

const RadialGradientBackground = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient
            id="grad"
            cx="50%"
            cy="0%"
            rx="80%"
            ry="80%"
            fx="50%"
            fy="0%"
          >
            {/* 👇 Colors from Figma */}
            <Stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <Stop offset="0%" stopColor="#f5b192" stopOpacity="1" />
            <Stop offset="30%" stopColor="#fef9f6" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        <Rect width="100%" height="100%" fill="url(#grad)" />
      </Svg>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RadialGradientBackground;
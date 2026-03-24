import React, { useEffect, useState } from "react";
import { Text, StyleSheet } from "react-native";

type Props = {
  connectionState: "connecting" | "connected" | "disconnected" | "failed";
  emitColor?: (color: string) => void
};

export default function ConnectionBanner({ connectionState, emitColor }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);

    if (connectionState === "connected") {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2000); // hide after 10 seconds

      return () => clearTimeout(timer);
    }
    // emitColor(getBackgroundColor());
  }, [connectionState]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (connectionState) {
      case "connected":
        return "green";
      case "connecting":
        return "orange";
      case "disconnected":
        return "red";
      case "failed":
        return "darkred";
      default:
        return "gray";
    }
  };

  return (
    <Text
      style={[
        styles.banner,
        { backgroundColor: getBackgroundColor() }
      ]}
    >
      {connectionState.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  banner: {
    textAlign: "center",
    justifyContent: "center",
    padding: 6,
    color: "white",
    marginVertical: 3,
    zIndex:10
  },
});
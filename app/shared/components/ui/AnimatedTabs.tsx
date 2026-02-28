import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, LayoutChangeEvent } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../styles/commonStyles";

interface Props {
  tabs: string[];
  activeIndex?: number;
  onChange?: (index: number) => void;
}

const CONTAINER_PADDING = 4; // same padding everywhere

export default function AnimatedTabs({
  tabs,
  activeIndex = 0,
  onChange,
}: Props) {
  const theme = useTheme();

  const [containerWidth, setContainerWidth] = useState(0);

  // subtract padding from both sides
  const usableWidth = containerWidth - CONTAINER_PADDING * 2;

  const tabWidth = usableWidth / tabs.length;

  const translateX = useSharedValue(
    activeIndex * tabWidth + CONTAINER_PADDING
  );

  useEffect(() => {
    translateX.value = withTiming(
      activeIndex * tabWidth + CONTAINER_PADDING,
      { duration: 250 }
    );
  }, [activeIndex, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handlePress = (index: number) => {
    translateX.value = withTiming(
      index * tabWidth + CONTAINER_PADDING,
      { duration: 250 }
    );
    onChange?.(index);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.white,
          borderColor: colors.primary,
          borderWidth: 1,
          padding: CONTAINER_PADDING,
        },
      ]}
      onLayout={onLayout}
    >
      {/* Indicator */}
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              backgroundColor: colors.primary,
            },
            indicatorStyle,
          ]}
        />
      )}

      {/* Tabs */}
      {tabs.map((tab, index) => (
        <Pressable
          key={index}
          style={styles.tab}
          onPress={() => handlePress(index)}
        >
          <Text
            style={{
              color:
                activeIndex === index
                  ? colors.white
                  : theme.colors.onSurface,
              fontWeight: "600",
            }}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    position: "relative",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    zIndex: 2,
  },
  indicator: {
    position: "absolute",
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    borderRadius: 10,
    zIndex: 1,
  },
});
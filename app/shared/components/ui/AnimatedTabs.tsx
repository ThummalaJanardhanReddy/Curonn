import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  TouchableOpacity,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../styles/commonStyles";
import { IConsultationType } from "@/src/constants/constants";

interface AnimatedTabsProps {
  tabs: IConsultationType[];
  activeValue: number;
  onChange: (value: IConsultationType) => void;
}

const CONTAINER_PADDING = 0;

export default function AnimatedTabs({
  tabs,
  activeValue,
  onChange,
}: AnimatedTabsProps) {
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = useMemo(
    () => tabs.findIndex((t) => t.value === activeValue),
    [tabs, activeValue],
  );

  const usableWidth = containerWidth - CONTAINER_PADDING * 2;
  const tabWidth = tabs.length > 0 ? usableWidth / tabs.length : 0;

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0 && activeIndex >= 0) {
      translateX.value = withTiming(
        activeIndex * tabWidth + CONTAINER_PADDING,
        { duration: 250 },
      );
    }
  }, [activeIndex, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
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
      {containerWidth > 0 && tabWidth > 0 && (
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
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                // borderColor: isActive ? colors.white : "transparent",
                // borderWidth: isActive ? 1 : 0,
                // borderLeftWidth: 0,
                // borderRightWidth: 0,
                // marginVertical: isActive? 8: 0
              },
            ]}
            onPress={() => onChange(tab)}
          >
            <Text
              style={{
                color: isActive ? colors.white : theme.colors.onSurface,

                // marginVertical: isActive ? 4 : 0,
                fontWeight: "600",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    position: "relative",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    zIndex: 2,
  },
  indicator: {
    position: "absolute",
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    borderRadius: 8,
    zIndex: 1,
  },
});

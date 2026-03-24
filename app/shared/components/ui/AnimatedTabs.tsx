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
import {fonts} from "../../styles/fonts";

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

  const GAP = 6;
  
const usableWidth =
  containerWidth - CONTAINER_PADDING * 2 - GAP * (tabs.length - 1);
  const tabWidth = tabs.length > 0 ? usableWidth / tabs.length : 0;

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (tabWidth > 0 && activeIndex >= 0) {
     translateX.value = withTiming(
  activeIndex * tabWidth + CONTAINER_PADDING,
  { duration: 250 }
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
          //padding: CONTAINER_PADDING,
          paddingHorizontal: 4,

          paddingVertical: 8,
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
                width: tabWidth,
    //marginRight: index !== tabs.length - 1 ? GAP : 0,
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
                fontFamily:fonts.semiBold, color: isActive ? colors.white : theme.colors.onSurface,

                // marginVertical: isActive ? 4 : 0,
                fontWeight: "600",fontSize: 13,paddingTop: 2
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
    paddingHorizontal:4
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 0,
    //paddingHorizontal: 2,
    zIndex: 2,
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    marginHorizontal: 4,
    borderRadius: 8,
    zIndex: 1,
  },
});

import * as Animatable from "react-native-animatable";
import { StyleSheet, View } from "react-native";

export const SkeletonCard = () => (
  <Animatable.View
    animation="pulse"
    easing="ease-out"
    iterationCount="infinite"
    style={styles.skeletonCard}
  >
    <View style={styles.skeletonIcon} />
    <View style={{ flex: 1 }}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: "50%", marginTop: 8 }]} />
    </View>
  </Animatable.View>
);

const styles = StyleSheet.create({
  skeletonCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
    opacity: 0.7,
  },

  skeletonIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#DCE4EE",
    marginRight: 14,
  },

  skeletonLine: {
    height: 12,
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    width: "70%",
  },
});

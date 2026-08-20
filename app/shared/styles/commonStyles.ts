import { StyleSheet } from "react-native";
import {
  getResponsiveFontSize,
  getResponsiveSpacing,
} from "../utils/responsive";

// Color constants
export const colors = {
  primary: "#D94A2C",

  secondary: "#694664",
  bg_primary: "#F5F0E8",
  bg_rest: "#FAF7F2",
  bg_secondary: "#7E6781",
  surface: "#ffffff",
  primaryText: "#1a1a1a",
  text: "#1a1a1a",
  textSecondary: "#959292",
  textLight: "#999999",
  tabsText: "#B83A1E",
  border: "#dddddd",
  cardsBorder: "#FFCEC5",
  divider: "#eeeeee",
  success: "#4caf50",
  error: "#f44336",
  warning: "#ff9800",
  info: "#2196f3",
  black: "#000000",
  white: "#ffffff",
  statusbar_black: "#1c1c1e83",
  splashScreen_bg: "#D94A2C",

  lab: {
    chips: "#F3D1D6",
    chipSelected: "#D94A2C",
  },
};

// Typography constants
export const typography = {
  h1: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: "bold" as const,
    fontFamily: "Lato-Black",
    color: "#333333",
  },
  h2: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: "bold" as const,
    fontFamily: "Lato-Black",
    color: "#333333",
  },
  h3: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: "bold" as const,
    fontFamily: "Lato-Light",
    color: "#333333",
  },
  body: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: "Lato-Regular",
    color: "#333333",
  },
  bodySmall: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: "Lato-Regular",
    color: "#666666",
  },
  caption: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: "Lato-Regular",
    color: "#999999",
  },
};

// Spacing constants
export const spacing = {
  xs: getResponsiveSpacing(4),
  sm: getResponsiveSpacing(8),
  md: getResponsiveSpacing(16),
  lg: getResponsiveSpacing(20),
  xl: getResponsiveSpacing(24),
  xxl: getResponsiveSpacing(32),
};

const commonStyles = StyleSheet.create({
  // Buttons
  button: {
    borderRadius: getResponsiveSpacing(23),
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(24),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderRadius: getResponsiveSpacing(23),
    color: "white",
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: getResponsiveSpacing(23),
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: "Lato-Bold",
    color: "#ffffff",
  },
  buttonTextPrimary: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: "Lato-Bold",
    color: "#C15E9C",
  },
  buttonTextSecondary: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: "Lato-Bold",
    color: "#694664",
  },

  // Cards
  card: {
    backgroundColor: "#ffffff",
    borderRadius: getResponsiveSpacing(16),
    padding: getResponsiveSpacing(20),
    borderWidth: 1,
    borderColor: "#dddddd",
  },
  cardNoBorder: {
    backgroundColor: "#ffffff",
    borderRadius: getResponsiveSpacing(16),
    padding: getResponsiveSpacing(20),
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: getResponsiveSpacing(8),
    padding: getResponsiveSpacing(12),
    fontSize: getResponsiveFontSize(16),
    backgroundColor: "#ffffff",
  },

  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  container_layout: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(15),
    // minHeight: hp(100) - getResponsiveSpacing(20),
  },

  containercontent_layout: {
    flex: 1,
    paddingBottom: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(20),
  },
  container_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignContent: "center",
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(10),
  },
  section: {
    paddingHorizontal: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(20),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export const statusColors: { [key: string]: string } = {
  Requested: "#ffeeba", //"#d0eaff",
  Completed: "#ccface",
  Cancelled: "#ffd8d5",
  Inprogress: "#f8d7a7",
  Ongoing: "#f7cdff",
  Pending: "#ffeeba",
  Rescheduled: "#bbecf3",
  Assigned: "#f7cdff",
  "Admin Doctor": "#f7cdff",
};
export const statusTextColors: { [key: string]: string } = {
  Requested: "#9e7600", //"#006cc5",
  Completed: "#4CAF50",
  Cancelled: "#F44336",
  Inprogress: "#FF9800",
  Assigned: "#9C27B0",
  "Admin Doctor": "#9C27B0",
  Ongoing: "#9C27B0",
  Pending: "#9e7600",
  Rescheduled: "#00BCD4",
};

export const customTagsStyles = {
  p: {
    marginTop: 0,
    marginBottom: 12, // Small gap after paragraphs
  },
  // strong: {
  //   fontWeight: "bold",
  // },
};

export default commonStyles;

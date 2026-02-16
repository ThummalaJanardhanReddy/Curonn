import { StyleSheet } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

// Color constants
export const colors = {
  primary: '#C35E9C',
  secondary: '#694664',
  bg_primary: '#F5F4F9',
  bg_secondary: '#7E6781',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#959292',
  textLight: '#999999',
  tabsText: '#ED67B8',
  border: '#dddddd',
  divider: '#eeeeee',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
  black: '#000000',
  white: '#ffffff',
  statusbar_black: '#1c1c1e83',
};

// Typography constants
export const typography = {
  h1: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins-Bold',
    color: '#333333',
  },
  h2: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins-Bold',
    color: '#333333',
  },
  h3: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  body: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },
  bodySmall: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  caption: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Poppins-Regular',
    color: '#999999',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#C35E9C',
    borderWidth: 0,
    borderRadius: getResponsiveSpacing(23),
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C15E9C',
    borderRadius: getResponsiveSpacing(23),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  buttonTextPrimary: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Poppins-Medium',
    color: '#C15E9C',
  },
  buttonTextSecondary: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    color: '#694664',
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSpacing(16),
    padding: getResponsiveSpacing(20),
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  cardNoBorder: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSpacing(16),
    padding: getResponsiveSpacing(20),
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: getResponsiveSpacing(8),
    padding: getResponsiveSpacing(12),
    fontSize: getResponsiveFontSize(16),
    backgroundColor: '#ffffff',
  },

  // Layout
  container: {
    flex: 1,
    backgroundColor: '#694664',
  },
  container_layout: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
    paddingTop:getResponsiveSpacing(20),
    // minHeight: hp(100) - getResponsiveSpacing(20),
  },

  containercontent_layout: {
   flex: 1,
    paddingBottom: getResponsiveSpacing(20),
    paddingTop:getResponsiveSpacing(20),
  },
  container_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingVertical: getResponsiveSpacing(10),
  },
  section: {
    paddingHorizontal: getResponsiveSpacing(20),
    marginBottom: getResponsiveSpacing(20),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default commonStyles;

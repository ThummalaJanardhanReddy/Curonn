
// Font family constants for Poppins
export const fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

// Font weight mappings
export const fontWeights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Common font styles
export const fontStyles = {
  headercontent: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 18,
  },
  heading1: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  heading2: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  heading3: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  errortext: {
    fontFamily: fonts.regular,
    fontSize: 11,
  }
};

// Default export for compatibility with route imports
export default {
  fonts,
  fontWeights,
  fontStyles,
};

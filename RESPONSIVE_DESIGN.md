# Responsive Design Implementation

This document outlines the responsive design system implemented in the Curronn health app to ensure optimal user experience across different screen sizes and devices.

## Overview

The app now supports multiple screen sizes dynamically, from small phones to tablets, with automatic scaling of fonts, spacing, images, and layouts.

## Responsive Utilities

### Core Functions (`app/shared/utils/responsive.ts`)

#### Screen Dimensions
- `wp(percentage)` - Width percentage of screen
- `hp(percentage)` - Height percentage of screen
- `SCREEN_WIDTH` - Current screen width
- `SCREEN_HEIGHT` - Current screen height

#### Scaling Functions
- `scaleFontSize(size)` - Scale font size based on screen width
- `scaleWidth(size)` - Scale width dimensions
- `scaleHeight(size)` - Scale height dimensions

#### Responsive Helpers
- `getResponsiveSpacing(baseSpacing)` - Get responsive spacing based on device type
- `getResponsiveFontSize(baseSize)` - Get responsive font size based on device type
- `getResponsiveImageSize(baseWidth, baseHeight)` - Get responsive image dimensions

#### Device Detection
- `getDeviceType()` - Returns: 'small-phone', 'medium-phone', 'large-phone', 'tablet'
- `isTablet()` - Check if device is tablet
- `isSmallPhone()` - Check if device is small phone
- `getGridColumns()` - Get number of columns for grid layouts

#### Safe Area Support
- `useResponsiveDimensions()` - Hook for safe area aware dimensions
- `wpSafe(percentage, insets)` - Width percentage with safe area consideration
- `hpSafe(percentage, insets)` - Height percentage with safe area consideration

## Device Breakpoints

```typescript
const breakpoints = {
  small: 320,    // Small phones
  medium: 375,   // Medium phones (iPhone 12/13/14)
  large: 414,    // Large phones
  tablet: 768,   // Tablets
};
```

## Scaling Strategy

### Base Dimensions
- **Base Width**: 390px (iPhone 12/13/14)
- **Base Height**: 844px (iPhone 12/13/14)

### Scaling Factors by Device Type

| Device Type | Font Scale | Spacing Scale | Image Scale |
|-------------|------------|---------------|-------------|
| Small Phone | 0.9x | 0.8x | 1.0x |
| Medium Phone | 1.0x | 1.0x | 1.0x |
| Large Phone | 1.1x | 1.2x | 1.1x |
| Tablet | 1.3x | 1.5x | 1.4x |

## Implementation Examples

### Basic Usage

```typescript
import { 
  wp, 
  hp, 
  getResponsiveSpacing, 
  getResponsiveFontSize,
  getResponsiveImageSize 
} from '../shared/utils/responsive';

const styles = StyleSheet.create({
  container: {
    width: wp(90), // 90% of screen width
    height: hp(50), // 50% of screen height
    padding: getResponsiveSpacing(20),
  },
  title: {
    fontSize: getResponsiveFontSize(24),
  },
  image: {
    ...getResponsiveImageSize(100, 100),
  },
});
```

### Safe Area Usage

```typescript
import { useResponsiveDimensions, wpSafe, hpSafe } from '../shared/utils/responsive';

export default function MyComponent() {
  const { safeWidth, safeHeight, insets } = useResponsiveDimensions();
  
  return (
    <View style={{
      width: wpSafe(90, insets),
      height: hpSafe(50, insets),
      paddingTop: insets.top,
    }}>
      {/* Content */}
    </View>
  );
}
```

### Device-Specific Logic

```typescript
import { getDeviceType, isTablet, getGridColumns } from '../shared/utils/responsive';

const deviceType = getDeviceType();
const columns = getGridColumns(); // 2 for phones, 3 for tablets

if (isTablet()) {
  // Tablet-specific styling
}
```

## Updated Components

### 1. SplashScreen
- Responsive image sizing
- Dynamic spacing and positioning
- Safe area consideration

### 2. Welcome Screen
- Responsive typography
- Dynamic image dimensions
- Adaptive spacing

### 3. Home Screen
- Responsive service cards
- Dynamic grid layouts
- Adaptive modal sizes

### 4. Button Components
- Responsive font sizes
- Dynamic padding and margins
- Adaptive border radius

### 5. CommonHeader
- Responsive icon sizes
- Dynamic spacing
- Safe area integration

### 6. Main Layout
- Responsive tab bar
- Dynamic tab icons and text
- Adaptive spacing

### 7. Common Styles
- Responsive typography system
- Dynamic spacing constants
- Adaptive component styles

## Best Practices

### 1. Use Responsive Functions
Always use responsive functions instead of hardcoded values:

```typescript
// ❌ Bad
fontSize: 16,
padding: 20,

// ✅ Good
fontSize: getResponsiveFontSize(16),
padding: getResponsiveSpacing(20),
```

### 2. Percentage-Based Layouts
Use percentage-based dimensions for flexible layouts:

```typescript
// ✅ Good
width: wp(90), // 90% of screen width
height: hp(50), // 50% of screen height
```

### 3. Safe Area Consideration
Always consider safe areas for notched devices:

```typescript
// ✅ Good
paddingTop: insets.top,
width: wpSafe(90, insets),
```

### 4. Device-Specific Adjustments
Use device detection for specific adjustments:

```typescript
// ✅ Good
const columns = getGridColumns();
const isTablet = getDeviceType() === 'tablet';
```

## Testing

### Test on Multiple Devices
- Small phones (iPhone SE, etc.)
- Medium phones (iPhone 12/13/14)
- Large phones (iPhone Pro Max)
- Tablets (iPad)

### Test Orientations
- Portrait mode
- Landscape mode (if supported)

### Test Safe Areas
- Devices with notches
- Devices with home indicators
- Devices with different status bar heights

## Performance Considerations

- Responsive functions are lightweight and fast
- No external dependencies
- Minimal impact on bundle size
- Efficient device detection

## Future Enhancements

1. **Orientation Support**: Add landscape mode support
2. **Dynamic Type**: Support for iOS Dynamic Type
3. **Accessibility**: Enhanced accessibility scaling
4. **Theme Integration**: Dark mode responsive adjustments

## Migration Guide

### From Fixed Sizes to Responsive

1. Replace hardcoded font sizes:
   ```typescript
   fontSize: 16 → fontSize: getResponsiveFontSize(16)
   ```

2. Replace hardcoded spacing:
   ```typescript
   padding: 20 → padding: getResponsiveSpacing(20)
   ```

3. Replace hardcoded dimensions:
   ```typescript
   width: 300 → width: wp(80)
   ```

4. Add safe area support where needed:
   ```typescript
   const { insets } = useResponsiveDimensions();
   paddingTop: insets.top
   ```

## Conclusion

The responsive design system ensures that the Curronn health app provides an optimal user experience across all device types and screen sizes, from small phones to tablets, while maintaining performance and code maintainability.

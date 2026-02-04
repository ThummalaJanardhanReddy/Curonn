# Poppins Font Setup Instructions

To complete the Poppins font setup, you need to download the font files and place them in the `assets/fonts/` directory.

## Download Links

Please download the following Poppins font files from Google Fonts:

1. **Poppins Regular**: https://fonts.google.com/specimen/Poppins (click "Download family")
2. Or use direct links:
   - Poppins-Regular.ttf
   - Poppins-Medium.ttf  
   - Poppins-SemiBold.ttf
   - Poppins-Bold.ttf

## Steps to Complete Setup:

1. Download the Poppins font family from Google Fonts
2. Extract the ZIP file
3. Copy the following `.ttf` files to `assets/fonts/`:
   - `Poppins-Regular.ttf`
   - `Poppins-Medium.ttf`
   - `Poppins-SemiBold.ttf`
   - `Poppins-Bold.ttf`

4. Run the following command to link the fonts:
   ```bash
   npx expo install expo-font
   ```

5. Clear the cache and restart your development server:
   ```bash
   npx expo start --clear
   ```

## Font Usage

The fonts are now configured and can be used throughout your app:

```typescript
import { fonts } from './shared/styles/fonts';

// In your styles:
const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.regular, // or fonts.medium, fonts.semiBold, fonts.bold
  },
});
```

## Available Font Weights:
- `fonts.regular` - Poppins Regular
- `fonts.medium` - Poppins Medium  
- `fonts.semiBold` - Poppins SemiBold
- `fonts.bold` - Poppins Bold

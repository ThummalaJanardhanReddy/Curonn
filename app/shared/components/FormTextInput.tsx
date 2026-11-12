import React, { forwardRef, useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps,
  FocusEvent,
  BlurEvent,
  StyleSheet,
} from 'react-native';
import { colors } from '../styles/commonStyles';

export interface FormTextInputProps extends TextInputProps {
  /**
   * Set to false when this input lives inside its own bordered container
   * (e.g. a search bar with an icon/clear button sharing one outer pill)
   * and that container — not this input — should show the focus ring.
   * Defaults to true.
   */
  showFocusRing?: boolean;
  /** Notified on every focus/blur change, e.g. so a wrapping container can mirror it. */
  onFocusChange?: (focused: boolean) => void;
}

/**
 * Drop-in replacement for React Native's `TextInput`.
 *
 * Centralizes the "focused" visual treatment (a highlighted round border)
 * and guarantees a visible text cursor, so every form field in the app
 * looks and behaves consistently without each screen re-implementing it.
 *
 * Usage: swap the import only —
 *   import { TextInput } from 'react-native';          // before
 *   import TextInput from '@/app/shared/components/FormTextInput'; // after
 * JSX usage (`<TextInput ... />`) stays exactly the same.
 */
const FormTextInput = forwardRef<RNTextInput, FormTextInputProps>(
  (
    {
      style,
      editable,
      onFocus,
      onBlur,
      selectionColor,
      cursorColor,
      showFocusRing = true,
      onFocusChange,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    const handleFocus = (e: FocusEvent) => {
      if (editable !== false) {
        setFocused(true);
        onFocusChange?.(true);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: BlurEvent) => {
      setFocused(false);
      onFocusChange?.(false);
      onBlur?.(e);
    };

    // A page may try to hide the caret with selectionColor/cursorColor="transparent".
    // That also makes the field impossible to use, so the shared input never honors it.
    const resolvedSelectionColor =
      selectionColor === 'transparent' ? colors.primary : (selectionColor ?? colors.primary);
    const resolvedCursorColor =
      cursorColor === 'transparent' ? colors.primary : (cursorColor ?? colors.primary);

    return (
      <RNTextInput
        ref={ref}
        editable={editable}
        selectionColor={resolvedSelectionColor}
        cursorColor={resolvedCursorColor}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[style, showFocusRing && editable !== false && focused && styles.focused]}
        {...rest}
      />
    );
  },
);

FormTextInput.displayName = 'FormTextInput';

const styles = StyleSheet.create({
  focused: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
});

export default FormTextInput;

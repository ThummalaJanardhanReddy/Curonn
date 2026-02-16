import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput } from 'react-native-paper';

export default function UsernameScreen() {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const validateUsername = (name: string) => {
    if (!name.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    if (name.length < 2) {
      setUsernameError('Username must be at least 2 characters');
      return false;
    }
    if (name.length > 20) {
      setUsernameError('Username must be less than 20 characters');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleContinue = () => {
    const isValid = validateUsername(username);
    if (isValid) {
      // Store username (you can use AsyncStorage or context here)
      router.push('/personalization');
    }
  };

  const isFormValid = username.trim() && !usernameError;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>12Answer a few questions to start personalizing your journey</Text>
        </View>

        <Card style={styles.usernameCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Let&apos;s Get Started</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="What should we call you?"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (usernameError) validateUsername(text);
                }}
                onBlur={() => validateUsername(username)}
                mode="outlined"
                style={styles.textInput}
                left={<TextInput.Icon icon="account" />}
                error={!!usernameError}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Enter your preferred name"
              />
              {usernameError ? (
                <HelperText type="error" visible={!!usernameError}>
                  {usernameError}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                💡 This will help us personalize your experience and make your journey more engaging.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={[styles.continueButton, !isFormValid && styles.disabledButton]}
          labelStyle={styles.buttonLabel}
          disabled={!isFormValid}
        >
          Continue
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  usernameCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#fff',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});

import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, HelperText, Text, TextInput, Title } from 'react-native-paper';

export default function VerifyDetailsScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [employeeIdError, setEmployeeIdError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmployeeId = (id: string) => {
    if (!id.trim()) {
      setEmployeeIdError('Employee ID is required');
      return false;
    }
    if (id.length < 3) {
      setEmployeeIdError('Employee ID must be at least 3 characters');
      return false;
    }
    setEmployeeIdError('');
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    if (!email.includes('@curronn.com')) {
      setEmailError('Please use your company email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleContinue = () => {
    const isEmployeeIdValid = validateEmployeeId(employeeId);
    const isEmailValid = validateEmail(email);

    if (isEmployeeIdValid && isEmailValid) {
      // Store the data (you can use AsyncStorage or context here)
      router.push('/otp-verify');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const isFormValid = employeeId.trim() && email.trim() && !employeeIdError && !emailError;

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
          <Text style={styles.title}>Verify Your Details</Text>
          <Text style={styles.subtitle}>Please provide your employee information</Text>
        </View>

        <Card style={styles.detailsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Employee Information</Title>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Employee ID"
                value={employeeId}
                onChangeText={(text) => {
                  setEmployeeId(text);
                  if (employeeIdError) validateEmployeeId(text);
                }}
                onBlur={() => validateEmployeeId(employeeId)}
                mode="outlined"
                style={styles.textInput}
                left={<TextInput.Icon icon="badge-account" />}
                error={!!employeeIdError}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {employeeIdError ? (
                <HelperText type="error" visible={!!employeeIdError}>
                  {employeeIdError}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Working Email ID"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                onBlur={() => validateEmail(email)}
                mode="outlined"
                style={styles.textInput}
                left={<TextInput.Icon icon="email" />}
                error={!!emailError}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
              {emailError ? (
                <HelperText type="error" visible={!!emailError}>
                  {emailError}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                💡 Your employee ID and company email will be used to verify your identity and send OTP for authentication.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles.backButton}
          labelStyle={styles.backButtonLabel}
        >
          Back
        </Button>
        
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  detailsCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 22,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderColor: '#6200ee',
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
  },
  continueButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

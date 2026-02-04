import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, Title } from 'react-native-paper';

export default function OTPVerifyScreen() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus to next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit OTP');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (otpString === '1234') { // Demo OTP
        Alert.alert('Success', 'OTP verified successfully!', [
          { text: 'OK', onPress: () => router.push('/username') }
        ]);
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }, 2000);
  };

  const handleResendOTP = () => {
    setResendTimer(30);
    Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
  };

  const handleBack = () => {
    router.back();
  };

  const isOtpComplete = otp.every(digit => digit !== '');

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
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the 4-digit code sent to your email</Text>
        </View>

        <Card style={styles.otpCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>One-Time Password</Title>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  mode="outlined"
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                🔐 Enter the 4-digit verification code sent to your company email address.
              </Text>
            </View>

            <View style={styles.resendContainer}>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>
                  Resend OTP in {resendTimer}s
                </Text>
              ) : (
                <Button
                  mode="text"
                  onPress={handleResendOTP}
                  style={styles.resendButton}
                  labelStyle={styles.resendButtonLabel}
                >
                  Resend OTP
                </Button>
              )}
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
          onPress={handleVerify}
          style={[styles.verifyButton, !isOtpComplete && styles.disabledButton]}
          labelStyle={styles.buttonLabel}
          disabled={!isOtpComplete || isLoading}
          loading={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
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
  otpCard: {
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 60,
    height: 60,
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },
  infoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  resendButton: {
    margin: 0,
  },
  resendButtonLabel: {
    fontSize: 14,
    color: '#6200ee',
    textDecorationLine: 'underline',
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
  verifyButton: {
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

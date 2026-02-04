import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRegistrationStatus } from '../../../src/hooks/useRegistrationStatus';

interface RegistrationGuardProps {
  children: React.ReactNode;
}

export default function RegistrationGuard({ children }: RegistrationGuardProps) {
  const { isRegistered, isLoading } = useRegistrationStatus();

  // Handle navigation after render is complete
  useEffect(() => {
    if (!isLoading && !isRegistered) {
      router.replace('/welcome');
    }
  }, [isLoading, isRegistered]);

  // Show loading spinner while checking registration status
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  // If not registered, show loading while navigation happens
  if (!isRegistered) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  // If registered, show the protected content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

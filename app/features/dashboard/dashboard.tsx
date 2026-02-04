import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Text, Title } from 'react-native-paper';

export default function DashboardScreen() {
  const handleLogout = () => {
    // Clear user data and redirect to splash
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Dashboard</Text>
        <Text style={styles.subtitle}>Registration completed successfully!</Text>
      </View>

      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>🎉 Registration Complete</Title>
          <Paragraph style={styles.description}>
            Congratulations! You have successfully completed the registration process. 
            Your account has been verified and you can now access all the features of the Curronn application.
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Next Steps</Title>
          <View style={styles.steps}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Complete your profile</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Explore the application</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Start using features</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          labelStyle={styles.buttonLabel}
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  welcomeCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
  },
  infoCard: {
    marginBottom: 40,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'center',
  },
  steps: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6200ee',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 16,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButton: {
    width: '80%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f44336',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});

import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Text, Title } from 'react-native-paper';

export default function WelcomeScreen() {
  const handleContinue = () => {
    router.push('/terms');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Curronn</Text>
        <Text style={styles.subtitle}>Your trusted partner in innovation</Text>
      </View>

      <Card style={styles.companyCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>About Curronn</Title>
          <Paragraph style={styles.description}>
            Curronn is a leading technology company dedicated to building innovative solutions 
            that transform businesses and enhance user experiences. We specialize in cutting-edge 
            software development, artificial intelligence, and digital transformation.
          </Paragraph>
          
          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureTitle}>🚀 Innovation</Text>
              <Text style={styles.featureText}>Pioneering new technologies</Text>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureTitle}>💡 Excellence</Text>
              <Text style={styles.featureText}>Quality-driven development</Text>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureTitle}>🤝 Partnership</Text>
              <Text style={styles.featureText}>Collaborative success</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.continueButton}
          labelStyle={styles.buttonLabel}
        >
          Continue
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
  companyCard: {
    marginBottom: 40,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 24,
  },
  features: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
    minWidth: 100,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  continueButton: {
    width: '80%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});

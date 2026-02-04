import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Paragraph, Text, Title } from 'react-native-paper';

export default function TermsScreen() {
  const [canContinue, setCanContinue] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setCanContinue(true);
    }
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push('/verify-details');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.subtitle}>Please read carefully before proceeding</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        <Card style={styles.termsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Terms of Service</Title>
            
            <Paragraph style={styles.sectionTitle}>1. Acceptance of Terms</Paragraph>
            <Paragraph style={styles.termsText}>
              By accessing and using the Curronn application, you accept and agree to be bound by the terms and provision of this agreement.
            </Paragraph>

            <Paragraph style={styles.sectionTitle}>2. Use License</Paragraph>
            <Paragraph style={styles.termsText}>
              Permission is granted to temporarily download one copy of the application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </Paragraph>

            <Paragraph style={styles.sectionTitle}>3. Disclaimer</Paragraph>
            <Paragraph style={styles.termsText}>
              The materials on Curronn&apos;s application are provided on an &apos;as is&apos; basis. Curronn makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </Paragraph>

            <Paragraph style={styles.sectionTitle}>4. Limitations</Paragraph>
            <Paragraph style={styles.termsText}>
              In no event shall Curronn or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Curronn&apos;s application.
            </Paragraph>

            <Paragraph style={styles.sectionTitle}>5. Accuracy of Materials</Paragraph>
            <Paragraph style={styles.termsText}>
              The materials appearing on Curronn&apos;s application could include technical, typographical, or photographic errors. Curronn does not warrant that any of the materials on its application are accurate, complete or current.
            </Paragraph>

            <Paragraph style={styles.sectionTitle}>6. Links</Paragraph>
            <Paragraph style={styles.termsText}>
              Curronn has not reviewed all of the sites linked to its application and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Curronn of the site.
            </Paragraph>

            <Paragraph style={styles.sectionTitle}>7. Modifications</Paragraph>
            <Paragraph style={styles.termsText}>
              Curronn may revise these terms of service for its application at any time without notice. By using this application you are agreeing to be bound by the then current version of these Terms of Service.
            </Paragraph>

            <Paragraph style={styles.sectionTitle}>8. Governing Law</Paragraph>
            <Paragraph style={styles.termsText}>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
            </Paragraph>

            <View style={styles.scrollIndicator}>
              <Text style={styles.scrollText}>
                {canContinue ? '✅ You have read all terms' : '📜 Please scroll to read all terms'}
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
          style={[styles.continueButton, !canContinue && styles.disabledButton]}
          labelStyle={styles.buttonLabel}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
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
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  termsCard: {
    marginBottom: 20,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 16,
    textAlign: 'justify',
  },
  scrollIndicator: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  scrollText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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

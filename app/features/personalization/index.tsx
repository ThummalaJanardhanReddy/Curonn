import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, RadioButton, Text, TextInput, Title } from 'react-native-paper';

interface PersonalizationData {
  gender: string;
  age: string;
  height: {
    value: string;
    unit: 'ft' | 'cm';
  };
  weight: {
    value: string;
    unit: 'kg' | 'lb';
  };
  medicalConditions: string[];
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const MEDICAL_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Arthritis',
  'Obesity',
  'Depression',
  'Anxiety',
  'None',
];

export default function PersonalizationScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<PersonalizationData>({
    gender: '',
    age: '',
    height: { value: '', unit: 'ft' },
    weight: { value: '', unit: 'kg' },
    medicalConditions: [],
  });

  const totalSteps = 5;

  const handleContinue = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed, navigate to landing page
      router.push('/home');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.gender !== '';
      case 2:
        return data.age !== '' && parseInt(data.age) > 0 && parseInt(data.age) < 120;
      case 3:
        return data.height.value !== '' && parseFloat(data.height.value) > 0;
      case 4:
        return data.weight.value !== '' && parseFloat(data.weight.value) > 0;
      case 5:
        return data.medicalConditions.length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Title style={styles.stepTitle}>What&apos;s your gender?</Title>
            <Text style={styles.stepSubtitle}>This helps us provide personalized recommendations</Text>
            
            <RadioButton.Group
              onValueChange={(value) => setData({ ...data, gender: value })}
              value={data.gender}
            >
              {GENDER_OPTIONS.map((option) => (
                <RadioButton.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  style={styles.radioItem}
                  labelStyle={styles.radioLabel}
                />
              ))}
            </RadioButton.Group>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Title style={styles.stepTitle}>How old are you?</Title>
            <Text style={styles.stepSubtitle}>Age helps us customize your experience</Text>
            
            <TextInput
              label="Age"
              value={data.age}
              onChangeText={(text) => setData({ ...data, age: text })}
              mode="outlined"
              style={styles.textInput}
              keyboardType="numeric"
              left={<TextInput.Icon icon="calendar" />}
              placeholder="Enter your age"
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Title style={styles.stepTitle}>What&apos;s your height?</Title>
            <Text style={styles.stepSubtitle}>Height helps us calculate your BMI and health metrics</Text>
            
            <View style={styles.unitToggle}>
              <Chip
                selected={data.height.unit === 'ft'}
                onPress={() => setData({ ...data, height: { ...data.height, unit: 'ft' } })}
                style={styles.unitChip}
              >
                Feet & Inches
              </Chip>
              <Chip
                selected={data.height.unit === 'cm'}
                onPress={() => setData({ ...data, height: { ...data.height, unit: 'cm' } })}
                style={styles.unitChip}
              >
                Centimeters
              </Chip>
            </View>
            
            <TextInput
              label={data.height.unit === 'ft' ? 'Height (ft)' : 'Height (cm)'}
              value={data.height.value}
              onChangeText={(text) => setData({ ...data, height: { ...data.height, value: text } })}
              mode="outlined"
              style={styles.textInput}
              keyboardType="numeric"
              left={<TextInput.Icon icon="ruler" />}
              placeholder={data.height.unit === 'ft' ? '5.8' : '175'}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Title style={styles.stepTitle}>What&apos;s your weight?</Title>
            <Text style={styles.stepSubtitle}>Weight helps us track your progress and health metrics</Text>
            
            <View style={styles.unitToggle}>
              <Chip
                selected={data.weight.unit === 'kg'}
                onPress={() => setData({ ...data, weight: { ...data.weight, unit: 'kg' } })}
                style={styles.unitChip}
              >
                Kilograms
              </Chip>
              <Chip
                selected={data.weight.unit === 'lb'}
                onPress={() => setData({ ...data, weight: { ...data.weight, unit: 'lb' } })}
                style={styles.unitChip}
              >
                Pounds
              </Chip>
            </View>
            
            <TextInput
              label={data.weight.unit === 'kg' ? 'Weight (kg)' : 'Weight (lb)'}
              value={data.weight.value}
              onChangeText={(text) => setData({ ...data, weight: { ...data.weight, value: text } })}
              mode="outlined"
              style={styles.textInput}
              keyboardType="numeric"
              left={<TextInput.Icon icon="scale" />}
              placeholder={data.weight.unit === 'kg' ? '70' : '154'}
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Title style={styles.stepTitle}>Any medical conditions we should be aware of?</Title>
            <Text style={styles.stepSubtitle}>This helps us provide safer and more appropriate recommendations</Text>
            
            <View style={styles.chipContainer}>
              {MEDICAL_CONDITIONS.map((condition) => (
                <Chip
                  key={condition}
                  selected={data.medicalConditions.includes(condition)}
                  onPress={() => {
                    if (condition === 'None') {
                      setData({ ...data, medicalConditions: ['None'] });
                    } else {
                      const newConditions = data.medicalConditions.includes(condition)
                        ? data.medicalConditions.filter(c => c !== condition)
                        : [...data.medicalConditions.filter(c => c !== 'None'), condition];
                      setData({ ...data, medicalConditions: newConditions });
                    }
                  }}
                  style={styles.conditionChip}
                  textStyle={styles.chipText}
                >
                  {condition}
                </Chip>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Stepper Header */}
      <View style={styles.stepperHeader}>
        <Text style={styles.stepperTitle}>Step {currentStep} of {totalSteps}</Text>
        <View style={styles.stepperContainer}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              style={[
                styles.stepIndicator,
                index + 1 === currentStep && styles.currentStep,
                index + 1 < currentStep && styles.completedStep,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Card style={styles.stepCard}>
          <Card.Content>
            {renderStepContent()}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          style={styles.backButton}
          labelStyle={styles.backButtonLabel}
        >
          {currentStep === 1 ? 'Back' : 'Previous'}
        </Button>
        
        <Button
          mode="contained"
          onPress={handleContinue}
          style={[styles.continueButton, !isStepValid() && styles.disabledButton]}
          labelStyle={styles.buttonLabel}
          disabled={!isStepValid()}
        >
          {currentStep === totalSteps ? 'Complete' : 'Continue'}
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
  stepperHeader: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 2,
  },
  stepperTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
  },
  currentStep: {
    backgroundColor: '#6200ee',
  },
  completedStep: {
    backgroundColor: '#4caf50',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  stepCard: {
    elevation: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  stepContent: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  unitToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  unitChip: {
    marginHorizontal: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  conditionChip: {
    marginVertical: 4,
  },
  chipText: {
    fontSize: 14,
  },
  radioItem: {
    marginVertical: 8,
  },
  radioLabel: {
    fontSize: 16,
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

import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { images } from '../assets';
import BackButton from './shared/components/BackButton';
import PrimaryButton from './shared/components/PrimaryButton';
import RegistrationLayout from './shared/components/ui/registration-layout';
import commonStyles, { colors } from './shared/styles/commonStyles';
import { saveUserData, setRegistrationCompleted } from './shared/utils/storage';
import axiosClient from '../src/api/axiosClient';
import { ApiRoutes } from '../src/api/employee/employee';
import { fonts } from './shared/styles/fonts';
import { useUser } from "./shared/context/UserContext";
import Toast from './shared/components/Toast';
import { useLocalSearchParams } from 'expo-router';

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
];

const MEDICAL_CONDITIONS = [
  { label: 'Diabetes', key: 'diabetes' },
  { label: 'Hypertension', key: 'hypertension' },
  { label: 'Thyroid', key: 'thyroid' },
  { label: 'Heart Disease', key: 'heartDisease' },
  { label: 'Asthma', key: 'asthma' },
  { label: 'No Issues', key: 'noIssues' },
  // { label: 'Issues', key: 'issues'}
  // { label: 'No Issues 1', key: 'noIssues1' },
];



export default function PersonalizationScreen() {
  const params = useLocalSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<PersonalizationData>({
    gender: '',
    age: '',
    height: { value: '', unit: 'ft' },
    weight: { value: '', unit: 'kg' },
    medicalConditions: [],
  });
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    EmployeeCode: "",
    emailAddress: "",
    mobileNo: "",
    age: "",
    gender: "",
    dob: "",
    image: "",
    eId: "",
    roleId: "",
    companyName: "",
    department: "",
    address: "",
    branch: "",
  });
  const textInputRef = useRef<any>(null);
  const heightInputRef = useRef<any>(null);
  const weightInputRef = useRef<any>(null);
  const { userData } = useUser();
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; type: "success" | "error" }>({ title: "", subtitle: "", type: "success" });
  const [showToast, setShowToast] = useState(false);
  // Auto-focus TextInput when on step 2 (age input), step 3 (height input), or step 4 (weight input)
  useEffect(() => {
    if (currentStep === 2 && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    } else if (currentStep === 3 && heightInputRef.current) {
      setTimeout(() => {
        heightInputRef.current?.focus();
      }, 100);
    } else if (currentStep === 4 && weightInputRef.current) {
      setTimeout(() => {
        weightInputRef.current?.focus();
      }, 100);
    }
  }, [currentStep]);

  // Conversion functions
  const convertHeight = (
    value: string,
    fromUnit: 'ft' | 'cm',
    toUnit: 'ft' | 'cm'
  ) => {
    if (!value || isNaN(parseFloat(value))) return '';
    const numValue = parseFloat(value);
    if (fromUnit === 'ft' && toUnit === 'cm') {
      return (numValue * 30.48).toFixed(1);
    } else if (fromUnit === 'cm' && toUnit === 'ft') {
      return (numValue / 30.48).toFixed(1);
    }
    return value;
  };

  const convertWeight = (
    value: string,
    fromUnit: 'kg' | 'lb',
    toUnit: 'kg' | 'lb'
  ) => {
    if (!value || isNaN(parseFloat(value))) return '';
    const numValue = parseFloat(value);
    if (fromUnit === 'kg' && toUnit === 'lb') {
      return (numValue * 2.20462).toFixed(1);
    } else if (fromUnit === 'lb' && toUnit === 'kg') {
      return (numValue / 2.20462).toFixed(1);
    }
    return value;
  };

  const totalSteps = 5;
  const patientId = userData?.e_id;
  React.useEffect(() => {
    if (!patientId) return;
    // console.log("[ProfileModal] userData:", userData);
    // console.log("[ProfileModal] Fetching profile for patientId:", patientId);
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get(ApiRoutes.Employee.getById(patientId));
        // console.log("[ProfileModal] Profile data response:", response);
        const data = response?.data ?? response;
        setProfileForm({
          fullName: data.fullName || "",
          EmployeeCode: data.employeeCode,
          emailAddress: data.emailAddress || "",
          mobileNo: data.mobileNo || "",
          age: data.age ? String(data.age) : "",
          gender: data.gender || "",
          dob: data.dob || "",
          eId: data.eId || "",
          roleId: data.roleId || "",
          companyName: data.companyName || "",
          department: data.department || "",
          address: data.address || "",
          branch: data.branch || "",
          image: data.image || "",
        });
      } catch (error) {
        console.error("[ProfileModal] Failed to fetch profile data:", error);

      }
    };
    fetchProfile();
  }, [patientId]);



  const handleContinue = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed, update employee profile, save registration status and user data
      try {
           const { ...formData } = profileForm;
        const payload = {
          eId: userData?.e_id, // fallback if eId is not present
          roleId: formData.roleId,
           fullName: formData.fullName,
           branch: formData.branch,
          emailAddress: formData.emailAddress,
          companyName: formData.companyName,
          department: formData.department,
          EmployeeCode: formData.EmployeeCode,
          mobileNo: formData.mobileNo,
          address: formData.address,
          gender: data.gender,
          age: data.age,
          height: data.height.value,
          heightMeasurement: data.height.unit,
          weight: data.weight.value,
          weightMeasurement: data.weight.unit,
          medicalCondition: data.medicalConditions.join(','),
        };
        console.log('Updating employee with payload:', payload);
          const response: any = await axiosClient.post(ApiRoutes.Employee.update, payload);
          console.log('Employee update response:', response);
          let message = "Employee registration completed successfully";
          if (response?.id) {
            setToastMessage({
              title: "Employee Details Saved Successfully",
              subtitle: response?.data?.message || "Saved successfully!",
              type: "success"
            });
            setShowToast(true);
            await setRegistrationCompleted(true);
            await saveUserData(data);
            router.push('/home');
          } else {
            // Show error or handle failure
            const msg = response?.message || response?.data?.message || 'Failed to update employee details.';
            setToastMessage({
              title: "Failed to update employee details.",
              subtitle: response?.data?.message,
              type: "Failed"
            });
            setShowToast(true);
          }
        } catch (err) {
          console.error('Failed to update employee:', err);
          router.push('/home');
        }
      
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
        return (
          data.age !== '' && parseInt(data.age) > 0 && parseInt(data.age) < 120
        );
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
            <Text style={styles.stepTitle}>What&apos;s your Gender?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us in providing relevant {'\n'} information to gender.
            </Text>

            <View style={styles.genderOptionsContainer}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.genderOptionRow}
                  onPress={() => setData({ ...data, gender: option.value })}
                >
                  <Text style={styles.genderOptionText}>{option.label}</Text>
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioButton,
                        data.gender === option.value &&
                        styles.radioButtonSelected,
                      ]}
                    >
                      {data.gender === option.value && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What&apos;s your Age?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us in providing relevant information {'\n'} to certain
              age group.
            </Text>

            <TextInput
              ref={textInputRef}
              value={data.age}
              onChangeText={(text) => setData({ ...data, age: text })}
              selection={{
                start: data.age.length,
                end: data.age.length,
              }}
              mode="outlined"
              style={styles.textInput}
              contentStyle={{ fontSize: 28, height: 75, textAlign: 'left', justifyContent: 'flex-start', paddingHorizontal: 16, }}
              keyboardType="numeric"
              theme={{ roundness: 17 }}
              // left={<TextInput.Icon icon="calendar" />}
              placeholder="0"
              placeholderTextColor='#9D9D9F'
              outlineColor="#9D9D9F"
              activeOutlineColor="#9D9D9F"
              outlineStyle={{ borderWidth: 1 }}
              returnKeyType="go"
              onSubmitEditing={() => {
                if (isStepValid()) {
                  handleContinue();
                } else {
                  textInputRef.current?.blur();
                }
              }}
            // textColor="#9D9D9F"
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What&apos;s your Height?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us in calculating BMI, healthy versus unhealthy height.
            </Text>

            <View style={styles.inputUnitContainer}>
              <TextInput
                ref={heightInputRef}
                value={data.height.value}
                onChangeText={(text) => {
                  // For ft unit, auto-add decimal point
                  if (data.height.unit === 'ft' && text.length > 0) {
                    // Only format if user is adding characters (not deleting)
                    if (text.length > data.height.value.length) {
                      const cleanText = text.replace(/\./g, '');
                      if (cleanText.length === 1) {
                        setData({ ...data, height: { ...data.height, value: cleanText + '.' } });
                        return;
                      } else if (cleanText.length >= 2) {
                        setData({ ...data, height: { ...data.height, value: cleanText.charAt(0) + '.' + cleanText.slice(1) } });
                        return;
                      }
                    }
                  }

                  // Default behavior for all other cases
                  setData({ ...data, height: { ...data.height, value: text } });
                }}
                mode="outlined"
                style={styles.heightWeightInput}
                theme={{ roundness: 17 }}
                contentStyle={{ fontSize: 28, height: 75, textAlign: 'left', justifyContent: 'flex-start', paddingHorizontal: 16, }}
                keyboardType="numeric"
                placeholder={`0.0`}
                placeholderTextColor={'#9D9D9F'}
                outlineColor="#9D9D9F"
                outlineStyle={{ borderWidth: 1 }}
                activeOutlineColor="#9D9D9F"
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (isStepValid()) {
                    handleContinue();
                  } else {
                    heightInputRef.current?.blur();
                  }
                }}
              // textColor="#9D9D9F"
              />

              <View style={styles.unitButtonsContainer}>
                <View
                  style={[
                    styles.unitButton,
                    data.height.unit === 'ft' && styles.unitButtonSelected,
                  ]}
                  onTouchEnd={() => {
                    const newUnit = 'ft';
                    const convertedValue = convertHeight(
                      data.height.value,
                      data.height.unit,
                      newUnit
                    );
                    setData({
                      ...data,
                      height: { value: convertedValue, unit: newUnit },
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      data.height.unit === 'ft' &&
                      styles.unitButtonTextSelected,
                    ]}
                  >
                    ft
                  </Text>
                </View>

                <View
                  style={[
                    styles.unitButton,
                    data.height.unit === 'cm' && styles.unitButtonSelected,
                  ]}
                  onTouchEnd={() => {
                    const newUnit = 'cm';
                    const convertedValue = convertHeight(
                      data.height.value,
                      data.height.unit,
                      newUnit
                    );
                    setData({
                      ...data,
                      height: { value: convertedValue, unit: newUnit },
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      data.height.unit === 'cm' &&
                      styles.unitButtonTextSelected,
                    ]}
                  >
                    cm
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What&apos;s your Weight?</Text>
            <Text style={styles.stepSubtitle}>
              This helps us in calculating BMI, healthy versus unhealthy weight.
            </Text>

            <View style={styles.inputUnitContainer}>
              <TextInput
                ref={weightInputRef}
                value={data.weight.value}
                onChangeText={(text) =>
                  setData({ ...data, weight: { ...data.weight, value: text } })
                }
                mode="outlined"
                style={styles.heightWeightInput}
                contentStyle={{ fontSize: 28, textAlign: 'left', }}
                keyboardType="numeric"
                theme={{ roundness: 17 }}
                placeholder={`0.00`}
                placeholderTextColor={'#9D9D9F'}
                outlineColor="#9D9D9F"
                 outlineStyle={{ borderWidth: 1 }}
                activeOutlineColor="#9D9D9F"
                 returnKeyType="go"
                onSubmitEditing={() => {
                  if (isStepValid()) {
                    handleContinue();
                  } else {
                    weightInputRef.current?.blur();
                  }
                }}
              // textColor="#9D9D9F"
              />

              <View style={styles.unitButtonsContainer}>
                <View
                  style={[
                    styles.unitButton,
                    data.weight.unit === 'kg' && styles.unitButtonSelected,
                  ]}
                  onTouchEnd={() => {
                    const newUnit = 'kg';
                    const convertedValue = convertWeight(
                      data.weight.value,
                      data.weight.unit,
                      newUnit
                    );
                    setData({
                      ...data,
                      weight: { value: convertedValue, unit: newUnit },
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      data.weight.unit === 'kg' &&
                      styles.unitButtonTextSelected,
                    ]}
                  >
                    kg
                  </Text>
                </View>

                <View
                  style={[
                    styles.unitButton,
                    data.weight.unit === 'lb' && styles.unitButtonSelected,
                  ]}
                  onTouchEnd={() => {
                    const newUnit = 'lb';
                    const convertedValue = convertWeight(
                      data.weight.value,
                      data.weight.unit,
                      newUnit
                    );
                    setData({
                      ...data,
                      weight: { value: convertedValue, unit: newUnit },
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      data.weight.unit === 'lb' &&
                      styles.unitButtonTextSelected,
                    ]}
                  >
                    lb
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 5:
        return (
          <>
            <Text style={styles.stepTitle}>Any medical condition we {'\n'} should be aware of?</Text>
            {/* <Text style={styles.stepSubtitle}>
              Select all that apply (this helps us provide better care)
            </Text> */}

            <View style={styles.medicalConditionsContainer}>
              {MEDICAL_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition.key}
                  style={[
                    styles.medicalConditionRow,
                    data.medicalConditions.includes(condition.label) && { borderColor: colors.primary }
                  ]}
                  onPress={() => {
                    if (condition.label === 'No Issues') {
                      // If "No Issues" is selected, clear all other selections
                      setData({ ...data, medicalConditions: ['No Issues'] });
                    } else {
                      // Remove "No Issues" if it exists and toggle the current condition
                      let newConditions = data.medicalConditions.filter(
                        (c) => c !== 'No Issues'
                      );

                      if (newConditions.includes(condition.label)) {
                        // Remove the condition if it's already selected
                        newConditions = newConditions.filter(
                          (c) => c !== condition.label
                        );
                      } else {
                        // Add the condition if it's not selected
                        newConditions = [...newConditions, condition.label];
                      }

                      setData({ ...data, medicalConditions: newConditions });
                    }
                  }}
                >
                  {/* {data.medicalConditions.includes(condition) ? (
                    <LinearGradient
                      colors={['#F3B9BC', '#EEDAF5', '#F9EFF2', '#EEC4E2']}
                      locations={[0.0, 0.25, 0.53, 1.0]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.medicalConditionGradient}
                    >
                      <View style={[styles.medicalConditionContent, { backgroundColor: 'transparent' }]}>
                        <View style={styles.medicalConditionLeft}>
                          <View style={styles.medicalConditionImageContainer}>
                            <Image
                              source={images.medicalCondition}
                              style={styles.medicalConditionImage}
                              resizeMode="contain"
                            />
                          </View>
                          <Text style={styles.medicalConditionText}>
                            {condition}
                          </Text>
                        </View>

                        <View style={styles.medicalConditionRadio}>
                          <View
                            style={[
                              styles.medicalRadioButton,
                              data.medicalConditions.includes(condition) &&
                                styles.medicalRadioButtonSelected,
                            ]}
                          >
                            {data.medicalConditions.includes(condition) && (
                              <View style={styles.medicalRadioButtonInner} />
                            )}
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  ) : ( */}
                  <View style={styles.medicalConditionContent}>
                    <View style={styles.medicalConditionLeft}>
                      <View style={styles.medicalConditionImageContainer}>
                        {React.createElement(images.medicalConditions[condition.key as keyof typeof images.medicalConditions], {
                          width: 27,
                          height: 27,
                          style: styles.medicalConditionImage
                        })}
                      </View>
                      <Text style={styles.medicalConditionText}>
                        {condition.label}
                      </Text>
                    </View>

                    <View style={styles.medicalConditionRadio}>
                      <View
                        style={[
                          styles.medicalRadioButton,
                          data.medicalConditions.includes(condition.label) &&
                          styles.medicalRadioButtonSelected,
                        ]}
                      >
                        {data.medicalConditions.includes(condition.label) && (
                          <View style={styles.medicalRadioButtonInner} />
                        )}
                      </View>
                    </View>
                  </View>
                  {/* // )} */}
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (<>

    <RegistrationLayout headerBackgroundColor={colors.bg_primary}>
      <View style={styles.header}>
        <BackButton
          title="Back"
          onPress={handleBack}
          style={styles.backButton}
        />
      </View>
      <View style={styles.stepTextContainer}>
        <Text style={styles.stepsText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / totalSteps) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {renderStepContent()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={currentStep === totalSteps ? 'Submit' : 'Continue'}
          onPress={handleContinue}
          disabled={!isStepValid()}
          style={styles.continueButton}
        />
      </View>

      {/* Background Image */}
      <View style={styles.backgroundImageContainer}>
        <Image
          source={images.panels.personalization_bottom}
          style={styles.backgroundImage}
          resizeMode="stretch"
        />
      </View>

    </RegistrationLayout>
    <Toast
      visible={showToast}
      title={toastMessage.title}
      subtitle={toastMessage.subtitle}
      type={toastMessage.type}
      onHide={() => setShowToast(false)}
      duration={3000}
    />
  </>);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg_primary,
    ...commonStyles.container_layout,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  backButton: {
    // marginBottom: 20,
  },
  stepTextContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  stepsText: {
    fontSize: 14,
    color: '#80808E',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: fonts.regular,
  },
  title: {
    fontSize: 24,
    color: '#2B2C43',
    marginBottom: 8,
    textAlign: 'left',
    fontFamily: fonts.regular,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'left',
    fontFamily: fonts.regular,

    // marginBottom: 10,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  progressContainer: {
    // paddingHorizontal: 40,
    // marginBottom: 30,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E45C9C',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
     paddingHorizontal: 0,
    paddingTop: 10,
    // paddingBottom: 25,
    // marginBottom:20,
    // backgroundColor: '#1A82F7'
  },
  stepContent: {
    // paddingHorizontal: 0,
    // backgroundColor: '#1060c2ff'
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'regular',
    color: colors.black,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: fonts.regular,
    lineHeight: 26
    // lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.black,
    fontWeight: '400',
    textAlign: 'center',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontFamily: fonts.regular,

    // marginBottom: 10,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  textInput: {
    backgroundColor: '#fff',
    marginTop: 40,
    borderRadius: 16,
    height: 75,
    alignContent: 'center',
    justifyContent: 'center',
    textAlignVertical: 'center',
    // paddingHorizontal: 14,
    width: '75%',
    alignSelf: 'center',
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
  // Gender section styles
  genderOptionsContainer: {
    marginTop: 20,
    width: '100%',
    alignSelf: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    textAlign: 'center',
    gap: 12,
    // backgroundColor: '#fff',
    // borderRadius: 30,
    // padding: 16,
  },
  genderOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingVertical: 12,
    // paddingHorizontal: 0,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#CAC8C8',
    borderRadius: 20,
    padding: 16,
    height: 68,
    width: '98%',
    marginLeft: '1%',
  },
  radioContainer: {
    marginLeft: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2CCDC',
    backgroundColor: '#E2CCDC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  genderOptionText: {
    fontSize: 16,
    color: colors.black,
    fontFamily: fonts.semiBold,
  },

  // Height/Weight section styles
  inputUnitContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  heightWeightInput: {
    flex: 1,
    backgroundColor: '#fff',
    height: 75,
    textAlign: 'left',
    fontFamily: fonts.regular,
    // maxWidth: '100%',
    borderRadius: 16,
  },
  unitButtonsContainer: {
    flexDirection: 'column',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '35%',
    // minWidth: 120,
  },
  unitButton: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 43,
    paddingVertical: 8,
    // paddingHorizontal: 30,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    width: 83,
    minHeight: 25,
    // height: 35,
  },
  unitButtonSelected: {
    borderColor: '#1A82F7',
    backgroundColor: 'transparent',
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#707070',
    textAlign: 'center',
  },
  unitButtonTextSelected: {
    color: '#000000',
  },
  unitOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  unitRadioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitRadioButtonSelected: {
    borderColor: '#C35E9C',
    backgroundColor: '#C35E9C',
  },
  unitRadioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Medical conditions section styles
  medicalConditionsContainer: {
    marginTop: 5,
    width: '100%',
    alignSelf: 'center',
    gap: 10,
    marginBottom: 10
  },
  medicalConditionRow: {
    marginBottom: 3,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#CAC8C8',
    overflow: 'hidden',
    height: 64,
    width: '100%',
  },
  medicalConditionGradient: {
    flex: 1,
    borderRadius: 32,
    height: '100%',
  },
  medicalConditionBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  medicalConditionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 8,
    paddingRight: 0,
    height: '100%',
    backgroundColor: '#ffffff',
  },
  medicalConditionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicalConditionImageContainer: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d6d6',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 3,
    // },
    // shadowOpacity: 0.2,
    // shadowRadius: 6,
    // elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  medicalConditionImage: {
    width: 27,
    height: 27,
  },
  medicalConditionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: fonts.regular,
    paddingLeft: 4,
  },
  medicalConditionRadio: {
    marginRight: 24,
  },
  medicalRadioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E2CCDC',
    backgroundColor: '#E2CCDC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicalRadioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  medicalRadioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    // backgroundColor: 'red',
    // paddingTop: 5,
    alignItems: 'center',
    paddingBottom: 10,
    zIndex: 1,
  },
  continueButton: {
    width: '100%',
    zIndex: 1,
    fontFamily: fonts.regular,
  },
  backgroundImageContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: 125,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
});

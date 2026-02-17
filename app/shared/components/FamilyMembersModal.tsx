import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  View
} from 'react-native';
import { IconButton, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../../assets';
import commonStyles, { colors } from '../styles/commonStyles';
import { getResponsivePadding } from '../utils/responsive';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import axiosClient from '@/src/api/axiosClient';
import ApiRoutes from '@/src/api/employee/employee';
import { fontStyles, fonts } from "../../shared/styles/fonts";
import { useUser } from "../../shared/context/UserContext";
import Toast from './Toast';

interface FamilyMembersModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  gender: string;
  age: string;
  image: string;
}

// Removed hardcoded relationTypes. Now using relationTypes state from API.

export default function FamilyMembersModal({ visible, onClose }: FamilyMembersModalProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle: string; type: "success" | "error" }>({ title: "", subtitle: "", type: "success" });
  const [showToast, setShowToast] = useState(false);
  // TODO: Replace with actual patientId and createdBy from context/user
    const { userData } = useUser();
    const patientId = userData?.e_id;
  const createdBy = 0;
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  interface FormErrors {
    name?: string;
    relation?: string;
    gender?: string;
    age?: string;
    [key: string]: string | undefined;
  }
  const [errors, setErrors] = useState<FormErrors>({});
  const [relationTypes, setRelationTypes] = useState<{

    masterDataId: number;
    name: string;
  }[]>([]);
  const [selectedRelation, setSelectedRelation] = useState<{
    masterDataId: number;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    gender: 'Male',
    age: ''
  });

  // Sample family members data
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Use ref to allow calling fetchFamilyMembers outside useEffect
  const fetchFamilyMembersRef = React.useRef<() => Promise<void>>(async () => {});
  React.useEffect(() => {
    if (!visible || !patientId) return;
    const fetchFamilyMembers = async () => {
      try {
        const response = await axiosClient.get(ApiRoutes.Employee.GetPatientRelations(patientId));
        if (Array.isArray(response)) {
          setFamilyMembers(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setFamilyMembers(response.data);
        }
      } catch (error) {
        setToastMessage({
          title: 'Fetch Failed',
          subtitle: 'Could not fetch family members.',
          type: 'error',
        });
        setShowToast(true);
      }
    };
    fetchFamilyMembersRef.current = fetchFamilyMembers;
    fetchFamilyMembers();
  }, [visible, patientId]);

  const resetForm = () => {
    setFormData({
      name: '',
      relation: '',
      gender: 'Male',
      age: ''
    });
    setEditingMember(null);
    setIsEditMode(false);
    setShowDropdown(false);
  };

  const handleAddMember = () => {
    setShowForm(true);
    resetForm();
  };

  const handleDeleteMember = async (empRelationId: number) => {
    try {
      // As per Swagger, use POST and include both empRelationId and deletedBy (patientId) in payload
      try {
        // Match Swagger: POST with empRelationId as query param, empty body
        const url = `${ApiRoutes.Employee.deletefamilymember}?empRelationId=${empRelationId}`;
        const response = await axiosClient.post(url, {});
        console.log('Delete response:', response);
        let message = "Family Member has been deleted successfully.";
        if (response && response.data && typeof response.data === 'object' && response.data.message) {
          message = response.data.message;
        } else if (response && response.data === true) {
          message = "Family Member has been deleted successfully.";
        }
        setToastMessage({
          title: "Deleted",
          subtitle: message,
          type: "success"
        });
        setShowToast(true);
        if (fetchFamilyMembersRef.current) {
          await fetchFamilyMembersRef.current();
        }
      } catch (error) {
        let errorMsg = 'Something went wrong';
        if (error && typeof error === 'object') {
          if ('response' in error && error.response && error.response.data && error.response.data.message) {
            errorMsg = error.response.data.message;
          } else if ('message' in error) {
            errorMsg = error.message;
          }
        }
        setToastMessage({
          title: "Delete Failed",
          subtitle: errorMsg,
          type: "error"
        });
        setShowToast(true);
      }
      // Fetch details from GetByPatientRelationAsync using relationId and patientId
      const response = await axiosClient.get(ApiRoutes.Employee.GetByPatientRelationAsync(member.relationId, member.patientId));
      let data = null;
      if (Array.isArray(response) && response.length > 0) {
        data = response[0];
      } else if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        data = response.data[0];
      }
      if (data) {
        setEditingMember(data);
        // Find relation name from relationTypes
        const relationType = relationTypes.find(r => r.masterDataId === data.relationId);
        setFormData({
          name: data.relationName || '',
          relation: relationType ? relationType.name : '',
          gender: data.gender || '',
          age: data.age ? String(data.age) : ''
        });
        setIsEditMode(true);
        setShowForm(true);
      }
    } catch (error) {
      setToastMessage({
        title: 'Fetch Failed',
        subtitle: 'Could not fetch family member details.',
        type: 'error',
      });
      setShowToast(true);
    }
  };

  const handleSaveMember = () => {
    let newErrors = {};
    if (!formData.relation) newErrors = { ...newErrors, relation: "Please select relation type" };
    if (!formData.name) newErrors = { ...newErrors, name: "Please enter full name" };
    if (!formData.gender) newErrors = { ...newErrors, gender: "Please select gender" };
    if (!formData.age) newErrors = { ...newErrors, age: "Please enter age" };
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    // Find relationId from relationTypes
    const relationObj = relationTypes.find(r => r.name === formData.relation);
    const relationId = relationObj ? relationObj.masterDataId : 0;
    const payload = {
      empRelationId: isEditMode && editingMember ? editingMember.id : 0,
      relationId,
      relationName: formData.name,
      patientId: patientId,
      gender: formData.gender,
      age: formData.age ? Number(formData.age) : 0,
      createdBy,
      createdOn: new Date().toISOString(),
    };
    axiosClient.post(ApiRoutes.Employee.saveandupdaterelative, payload)
      .then(async response => {
        setToastMessage({
          title: "Family Member Saved",
          subtitle: response?.data?.message || "Saved successfully!",
          type: "success"
        });
        setShowToast(true);
        setShowForm(false);
        resetForm();
        if (fetchFamilyMembersRef.current) {
          await fetchFamilyMembersRef.current();
        }
      })
      .catch(error => {
        let errorMsg = 'Something went wrong';
        if (error && typeof error === 'object') {
          if ('response' in error && error.response && error.response.data && error.response.data.message) {
            errorMsg = error.response.data.message;
          } else if ('message' in error) {
            errorMsg = error.message;
          }
        }
        setToastMessage({
          title: "Save Failed",
          subtitle: errorMsg,
          type: "error"
        });
        setShowToast(true);
      });
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors && errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const renderFamilyMemberCard = (member: any) => (
    <View key={member.relationId} style={styles.familyMemberCard}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.relationName}</Text>
        <Text style={styles.memberRelation}>{relationTypes.find(r => r.masterDataId === member.relationId)?.name || ''} | {member.gender} | {member.age}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: 'rgba(193, 94, 156, 1)' }]}
          onPress={() => handleEditMember(member)}
        >
          <Text style={[styles.actionButtonText, { color: 'rgba(193, 94, 156, 1)' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: '#ff0000', marginLeft: 8 }]}
          onPress={() => handleDeleteMember(member.empRelationId)}
        >
          <Text style={[styles.actionButtonText, { color: '#ff0000' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  React.useEffect(() => {
    console.log('DEBUG: useEffect for relationTypes called');
    // Fetch relationship types from MasterData API (categoryId=5)
    const fetchRelationTypes = async () => {
      try {
        console.log('DEBUG: fetchRelationTypes called');
        const response: any = await axiosClient.get(
          ApiRoutes.Master.getmasterdata(5)
        );
        console.log('DEBUG: fetchRelationTypes response:', response);
        // If response is an array, use it directly
        if (Array.isArray(response)) {
          const filtered = response
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setRelationTypes(filtered);
          console.log('DEBUG: setRelationTypes:', filtered);
        } else if (response.isSuccess && Array.isArray(response.data)) {
          // fallback for old API shape
          const filtered = response.data
            .filter((item: any) => item.isActive)
            .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
          setRelationTypes(filtered);
          console.log('DEBUG: setRelationTypes:', filtered);
        }
      } catch (error) {
        console.error("Failed to fetch relation types", error);
      }
    };
    fetchRelationTypes();
  }, []);
  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* <Text style={styles.formTitle}>
        {isEditMode ? 'Edit Family Member' : 'Add Family Member'}
      </Text> */}

      {/* Relation Type Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>Relation Type *</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
          activeOpacity={1}
        >
          <Text style={[
            styles.dropdownButtonText,
            !formData.relation && styles.placeholderText
          ]}>
            {formData.relation || 'Select relation type'}
          </Text>
          <IconButton
            icon={showDropdown ? "chevron-up" : "chevron-down"}
            size={20}
            iconColor="#666"
            rippleColor="transparent"
          />
        </TouchableOpacity>

        {showDropdown && (
          <View style={[styles.dropdownOverlay, { maxHeight: 250 }]}> {/* Add maxHeight to overlay for scroll */}
            <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
              {relationTypes.map((relation) => (
                <TouchableOpacity
                  key={relation.masterDataId}
                  style={styles.dropdownOption}
                  onPress={() => {
                    handleInputChange('relation', relation.name);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{relation.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        {errors && errors.relation && (
          <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{errors.relation}</Text>
        )}
      </View>

      {/* Full Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          underlineColorAndroid="transparent"
          selectionColor="transparent"
          placeholder="Enter full name"
          value={formData.name}
          onChangeText={text => handleInputChange('name', text)}
        />
        {errors && errors.name && (
          <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4,fontFamily: fonts.regular }}>{errors.name}</Text>
        )}
      </View>

      {/* Gender */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => handleInputChange('gender', 'Male')}
          >
            <RadioButton
              value="Male"
              status={formData.gender === 'Male' ? 'checked' : 'unchecked'}
              onPress={() => handleInputChange('gender', 'Male')}
              color="#C15E9C"
            />
            <Text style={styles.radioText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => handleInputChange('gender', 'Female')}
          >
            <RadioButton
              value="Female"
              status={formData.gender === 'Female' ? 'checked' : 'unchecked'}
              onPress={() => handleInputChange('gender', 'Female')}
              color="#C15E9C"
            />
            <Text style={styles.radioText}>Female</Text>
          </TouchableOpacity>
        </View>
        {errors && errors.gender && (
          <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4,fontFamily: fonts.regular }}>{errors.gender}</Text>
        )}
      </View>

      {/* Age */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Age *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={{ color: formData.age ? '#333' : '#999' }}>
            {formData.age ? formData.age : 'Select date of birth'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                const today = new Date();
                let age = today.getFullYear() - date.getFullYear();
                const m = today.getMonth() - date.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
                  age--;
                }
                handleInputChange('age', String(age));
              }
            }}
            maximumDate={new Date()}
          />
        )}
        {errors && errors.age && (
          <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4, fontFamily: fonts.regular }}>{errors.age}</Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.formButtons}>
        {/* <SecondaryButton 
          title="Cancel" 
          onPress={handleCancel}
          style={styles.cancelButton}
        /> */}
        <PrimaryButton
          title={isEditMode ? 'Update Family' : 'Save Family'}
          onPress={handleSaveMember}
          style={styles.saveButton}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContent}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Family Members</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <Image
              source={images.icons.close}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        </View>

        {showForm ? (
          renderForm()
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember} activeOpacity={1}>
              <LinearGradient
                colors={['#EEC4E2', '#F9EFF2', '#EEDAF5', '#F3B9BC']}
                locations={[0.0, 0.47, 0.75, 1.0]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0, y: 0.5 }}
                style={styles.addButtonBackground}
              />
              <View style={styles.addButtonContent}>
                <Image
                  source={images.icons.addCircle}
                  style={styles.addButtonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.addButtonText}>Add Family Members</Text>
              </View>
            </TouchableOpacity>

            {/* Family Members List */}
            <View style={styles.familyMembersList}>
              {familyMembers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#888', fontSize: 16, marginTop: 24, fontFamily: fonts.regular }}>
                  No Family Members
                </Text>
              ) : (
                familyMembers.map(renderFamilyMemberCard)
              )}
            </View>
          </ScrollView>
        )}
        {/* Toast Message (removed duplicate PrimaryButton) */}
      </SafeAreaView>
      <Toast
        visible={showToast}
        title={toastMessage.title}
        subtitle={toastMessage.subtitle}
        type={toastMessage.type}
        onHide={() => setShowToast(false)}
        duration={3000}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
    actionButton: {
      borderWidth: 1,
      borderRadius: 15,
      height: 30,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: fonts.regular,
      paddingTop: 2,
      paddingHorizontal: 4,
    },
  modalContent: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(25),
    // paddingBottom: getResponsivePadding(12),
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202427',
    fontFamily: fonts.semiBold,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: colors.black,
  },
  content: {
    ...commonStyles.container_layout,
    flex: 1,
    paddingTop: 16,
    backgroundColor: colors.bg_primary,
  },
  addButton: {
    position: 'relative',
    height: 50,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    width: '100%',
  },
  addButtonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  addButtonContent: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(228, 92, 156, 1)',
    borderRadius: 16,
  },
  addButtonIcon: {
    width: 16,
    height: 16,
    marginRight: 12,
    tintColor: '#000',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
     fontFamily: fonts.regular,
  },
  familyMembersList: {
    gap: 16,
  },
  familyMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  memberImage: {
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    fontFamily: fonts.semiBold,
  },
  memberRelation: {
    fontSize: 14,
    color: '#666',
    fontFamily: fonts.regular,
  },
  editButton: {
    borderColor: colors.primary,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 12,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(25),
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  dropdownContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
     fontFamily: fonts.medium,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
     fontFamily: fonts.regular,
  },
  placeholderText: {
    color: '#999',
     fontFamily: fonts.regular,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    backgroundColor: '#fff',
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#6200ee',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
     fontFamily: fonts.regular,
  },
  selectedOptionText: {
    color: '#fff',
     fontFamily: fonts.regular,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
     fontFamily: fonts.regular,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.regular,
  },
});

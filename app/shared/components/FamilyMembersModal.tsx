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
  View
} from 'react-native';
import { IconButton, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '../../../assets';
import commonStyles, { colors } from '../styles/commonStyles';
import { getResponsivePadding } from '../utils/responsive';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

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

const relationTypes = [
  'Spouse',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Other'
];

export default function FamilyMembersModal({ visible, onClose }: FamilyMembersModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    gender: 'Male',
    age: ''
  });

  // Sample family members data
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: 1,
      name: 'Sarah Doe',
      relation: 'Spouse',
      gender: 'Female',
      age: '26',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&h=60&fit=crop'
    },
    {
      id: 2,
      name: 'Michael Doe',
      relation: 'Son',
      gender: 'Male',
      age: '5',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop'
    }
  ]);

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

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relation: member.relation,
      gender: member.gender,
      age: member.age
    });
    setIsEditMode(true);
    setShowForm(true);
  };

  const handleSaveMember = () => {
    if (!formData.name || !formData.relation || !formData.age) {
      // Show validation error
      return;
    }

    if (isEditMode && editingMember) {
      // Update existing member
      const updatedMembers = familyMembers.map(member =>
        member.id === editingMember.id
          ? { ...member, ...formData }
          : member
      );
      setFamilyMembers(updatedMembers);
    } else {
      // Add new member
      const newMember: FamilyMember = {
        id: Date.now(),
        name: formData.name,
        relation: formData.relation,
        gender: formData.gender,
        age: formData.age,
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop'
      };
      setFamilyMembers([...familyMembers, newMember]);
    }

    setShowForm(false);
    resetForm();
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
    onClose();
  };

  const renderFamilyMemberCard = (member: FamilyMember) => (
    <View key={member.id} style={styles.familyMemberCard}>
      <Image source={{ uri: member.image }} style={styles.memberImage} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRelation}>{member.relation}</Text>
      </View>
      <SecondaryButton
        title="Edit"
        onPress={() => handleEditMember(member)}
        height={26}
        style={styles.editButton}
        textStyle={styles.editButtonText}
      />
    </View>
  );

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
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownList}>
              {relationTypes.map((relation) => (
                <TouchableOpacity
                  key={relation}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({ ...formData, relation });
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{relation}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
      </View>

      {/* Gender */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Gender *</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setFormData({ ...formData, gender: 'Male' })}
          >
            <RadioButton
              value="Male"
              status={formData.gender === 'Male' ? 'checked' : 'unchecked'}
              onPress={() => setFormData({ ...formData, gender: 'Male' })}
              color="#C15E9C"
            />
            <Text style={styles.radioText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setFormData({ ...formData, gender: 'Female' })}
          >
            <RadioButton
              value="Female"
              status={formData.gender === 'Female' ? 'checked' : 'unchecked'}
              onPress={() => setFormData({ ...formData, gender: 'Female' })}
              color="#C15E9C"
            />
            <Text style={styles.radioText}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Age */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Age *</Text>
        <TextInput
          style={styles.input}
          underlineColorAndroid="transparent"
          selectionColor="transparent"
          placeholder="Enter age"
          value={formData.age}
          onChangeText={(text) => setFormData({ ...formData, age: text })}
          keyboardType="numeric"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.formButtons}>
        {/* <SecondaryButton 
          title="Cancel" 
          onPress={handleCancel}
          style={styles.cancelButton}
        /> */}
        <PrimaryButton 
          title={isEditMode ? 'Update' : 'Save'} 
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
              {familyMembers.map(renderFamilyMemberCard)}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202427',
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
  },
  familyMembersList: {
    gap: 16,
  },
  familyMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 68,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: colors.bg_primary,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary   ,
    marginBottom: 8,
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
  },
  placeholderText: {
    color: '#999',
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
  },
  selectedOptionText: {
    color: '#fff',
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
  },
});





import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { RadioButton } from 'react-native-paper';
import commonStyles, { colors } from '@/app/shared/styles/commonStyles';
import { getResponsiveSpacing, getResponsiveFontSize, getResponsiveImageSize } from '@/app/shared/utils/responsive';
import { prescriptionStore } from '@/app/shared/utils/prescriptionStore';
import { useUser } from '@/app/shared/context/UserContext';
import axiosClient from '@/src/api/axiosClient';
import ApiRoutes from '@/src/api/employee/employee';
import Toast from '@/app/shared/components/Toast';
import AddressSelection from '../address/address-selection';
import LocationSelection from '../location/location-selection';
import { images } from '../../../assets';
import { fonts } from '@/app/shared/styles/fonts';

// ─────────────────────────────────────────────────────────────────────────────

export default function BookingPayLaterScreen() {
  const { userData } = useUser();

  // ── Prescription data from store ─────────────────────────────────────
  const [prescriptionImages, setPrescriptionImages] = useState<
    Array<{ uri: string; fileName?: string }>
  >([]);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  // ── Address state (mirrors booking.tsx) ──────────────────────────────
  const [selectedLocation, setSelectedLocation] = useState<{
    addressId: number;
    address: string;
    houseNumber: string;
    landmark: string;
    nickname: string;
  } | null>(null);
  const [addressVisible, setAddressVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [editAddressId, setEditAddressId] = useState<number | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // ── Patient / relation state (mirrors booking.tsx) ───────────────────
  const [patientType, setPatientType] = useState('self');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [showRelationDropdown, setShowRelationDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [labRelationTypes, setLabRelationTypes] = useState<
    { masterDataId: number; name: string }[]
  >([]);
  const [selectedRelation, setSelectedRelation] = useState<{
    masterDataId: number;
    name: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    relation: '',
    fullName: '',
    age: '',
    gender: '',
  });
  const [errors, setErrors] = useState('');

  // ── Status ID ────────────────────────────────────────────────────────
  const [statusId, setStatusId] = useState<number>(2687);

  // ── UI state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    subtitle: string;
    type: 'success' | 'error';
  }>({ title: '', subtitle: '', type: 'success' });

  const genderOptions = ['Male', 'Female', 'Other'];

  // ── On mount: read prescription from store ───────────────────────────
  useEffect(() => {
    const stored = prescriptionStore.get();
    if (stored.images.length > 0) {
      setPrescriptionImages(stored.images);
      setPrescriptionNotes(stored.notes);
    }
  }, []);

  // ── fetchAddresses (identical to booking.tsx) ─────────────────────────
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const patientId = userData?.e_id;
      if (!patientId) throw new Error('Patient ID not available');
      const responcedata: any = await axiosClient.get(
        ApiRoutes.Address.getAddressByPatientId(patientId),
      );
      if (
        responcedata.isSuccess &&
        Array.isArray(responcedata.data) &&
        responcedata.data.length > 0
      ) {
        const defaultAddress = responcedata.data.find((addr: any) => addr.isDefault === true);
        if (defaultAddress) {
          setSelectedLocation({
            addressId: defaultAddress.addressId,
            address: defaultAddress.address,
            houseNumber: defaultAddress.hNo,
            landmark: defaultAddress.landMark,
            nickname: defaultAddress.addressNickname,
          });
        } else {
          setSelectedLocation(null);
        }
      } else {
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error('Fetch address error:', error);
      setSelectedLocation(null);
    } finally {
      setLoading(false);
    }
  };

  // ── fetchAddressById (identical to booking.tsx) ───────────────────────
  const fetchAddressById = async (addressId: string) => {
    try {
      setLoading(true);
      const response: any = await axiosClient.get(
        ApiRoutes.Address.getAddressById(addressId),
      );
      if (response.isSuccess && response.data) {
        const addr = response.data;
        setSelectedLocation({
          addressId: addr.addressId,
          address: addr.address,
          houseNumber: addr.hNo,
          landmark: addr.landMark,
          nickname: addr.addressNickname,
        });
      }
    } catch (error) {
      console.error('Fetch address by ID error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Address handlers (identical to booking.tsx) ───────────────────────
  const handleViewAddress = () => {
    setAddressVisible(true);
  };

  const handleAddAddress = () => {
    setEditAddressId(null);
    setAddressVisible(false);
    setLocationModalVisible(true);
  };

  const handleEditAddress = () => {
    if (selectedLocation && selectedLocation.addressId) {
      setEditAddressId(selectedLocation.addressId);
      setLocationModalVisible(true);
    }
  };

  // ── Fetch statusId (categoryId=7, name="Requested") ──────────────────
  const fetchStatusId = useCallback(async () => {
    try {
      const response: any = await axiosClient.get(ApiRoutes.Master.getmasterdata(7));
      let status = 0;
      if (Array.isArray(response)) {
        const requested = response.find((item: any) => item.name === 'Requested' && item.isActive);
        if (requested) status = requested.masterDataId;
      } else if (response.isSuccess && Array.isArray(response.data)) {
        const requested = response.data.find(
          (item: any) => item.name === 'Requested' && item.isActive,
        );
        if (requested) status = requested.masterDataId;
      }
      setStatusId(status);
    } catch (error) {
      console.error('Failed to fetch statusId for Requested', error);
    }
  }, []);

  // ── Fetch relation types (categoryId=5) ──────────────────────────────
  const fetchRelationTypes = useCallback(async () => {
    try {
      const response: any = await axiosClient.get(ApiRoutes.Master.getmasterdata(5));
      if (Array.isArray(response)) {
        const filtered = response
          .filter((item: any) => item.isActive)
          .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
        setLabRelationTypes(filtered);
      } else if (response.isSuccess && Array.isArray(response.data)) {
        const filtered = response.data
          .filter((item: any) => item.isActive)
          .map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
        setLabRelationTypes(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch relation types', error);
    }
  }, []);

  useEffect(() => {
    if (userData?.e_id) {
      fetchAddresses();
    }
    fetchStatusId();
    fetchRelationTypes();
  }, [userData?.e_id]);

  // ── Edit prescription: go back to modal ──────────────────────────────
  const handleEdit = () => {
    prescriptionStore.set({
      images: prescriptionImages,
      notes: prescriptionNotes,
      option: 'specific',
      isEditMode: true,
    });
    router.back();
  };


  // Compress image before converting to base64 (max 800px wide, 60% quality)
  // Returns an object describing either a base64 payload (JPEG) or the uri to read
  const compressImage = async (
    uri: string,
  ): Promise<{ type: 'base64' | 'uri'; value: string; mimeType: string }> => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      if (manipulated.base64) {
        // We're forcing JPEG output from the manipulator
        return { type: 'base64', value: manipulated.base64, mimeType: 'image/jpeg' };
      }

      // Fall back to reading the returned uri. Best-effort mimeType from original name
      const originalName = uri.split('/').pop() ?? '';
      return { type: 'uri', value: manipulated.uri, mimeType: getMimeType(originalName) };
    } catch (e) {
      console.error('Image compression failed, using original:', e);
      const originalName = uri.split('/').pop() ?? '';
      return { type: 'uri', value: uri, mimeType: getMimeType(originalName) };
    }
  };

  const sanitizeBase64 = (raw: string): string => {
    let b64 = raw;

    // 1. Strip "data:...;base64," prefix if present
    const commaIdx = b64.indexOf(',');
    if (commaIdx !== -1 && commaIdx < 100 && b64.substring(0, commaIdx).includes('base64')) {
      b64 = b64.substring(commaIdx + 1);
    }

    // 2. Remove ALL whitespace, newlines, carriage returns
    b64 = b64.replace(/\s/g, '');

    // 3. Keep only valid base64 characters
    b64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');

    // 4. Remove any trailing = and re-pad correctly
    b64 = b64.replace(/=+$/, '');
    const remainder = b64.length % 4;
    if (remainder === 2) b64 += '==';
    else if (remainder === 3) b64 += '=';

    return b64;
  };

  const uriToBase64 = async (
    uri: string,
  ): Promise<{ base64: string; mimeType: string } | null> => {
    try {
      const compressed = await compressImage(uri);
      let rawBase64: string;
      let mimeType = compressed.mimeType || 'image/jpeg';

      if (compressed.type === 'base64') {
        rawBase64 = compressed.value;
      } else {
        rawBase64 = await FileSystem.readAsStringAsync(compressed.value, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // 1. Remove ANY whitespace/newlines immediately
      let clean = rawBase64.replace(/\s/g, '');

      // 2. Strip any data URI prefix if it somehow got in
      const commaIdx = clean.indexOf(',');
      if (commaIdx !== -1 && commaIdx < 100) {
        clean = clean.substring(commaIdx + 1);
      }

      // 3. Remove non-base64 characters
      clean = clean.replace(/[^A-Za-z0-9+/=]/g, '');

      // Ensure padding
      clean = clean.replace(/=+$/, '');
      const remainder = clean.length % 4;
      if (remainder === 2) clean += '==';
      else if (remainder === 3) clean += '=';

      console.log(
        `[Base64Log] Final length: ${clean.length}, Start: ${clean.substring(0, 40)}..., End: ${clean.substring(
          clean.length - 10,
        )}`,
      );

      return { base64: clean, mimeType };
    } catch (e) {
      console.error('uriToBase64 failed for', uri, e);
      return null;
    }
  };

  const getMimeType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    return 'image/jpeg';
  };

  // ── Remove image ─────────────────────────────────────────────────────
  const handleRemoveImage = (indexToRemove: number) => {
    setPrescriptionImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      prescriptionStore.set({
        ...prescriptionStore.get(),
        images: updated,
      });
      return updated;
    });
  };

  // ── Confirm order ────────────────────────────────────────────────────
  const handleConfirmOrder = async () => {
    // Validate address
    if (!selectedLocation) {
      setErrors('Please select or add new address');
      return;
    }
    setErrors('');

    // Validate patient details
    if (patientType === 'others') {
      let newFieldErrors = { relation: '', fullName: '', age: '', gender: '' };
      let hasError = false;
      if (!selectedRelation) { newFieldErrors.relation = 'Please select relation type'; hasError = true; }
      if (!fullName.trim()) { newFieldErrors.fullName = 'Please enter full name'; hasError = true; }
      if (!age.trim()) { newFieldErrors.age = 'Please enter age'; hasError = true; }
      if (!gender.trim()) { newFieldErrors.gender = 'Please select gender'; hasError = true; }
      setFieldErrors(newFieldErrors);
      if (hasError) return;
    } else {
      setFieldErrors({ relation: '', fullName: '', age: '', gender: '' });
    }

    if (prescriptionImages.length === 0) {
      showToast('No Images', 'Go back and upload at least one prescription image.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Convert images to raw base64 (no data URI prefix — server decodes raw base64, mimeType sent separately)
      const prescriptionFiles = await Promise.all(
        prescriptionImages.map(async (img) => {
          let fileName = img.fileName ?? img.uri.split('/').pop() ?? 'prescription.jpg';

          const result = await uriToBase64(img.uri);
          if (!result) {
            // If conversion failed, return a placeholder empty file (server will likely reject)
            return { fileBase64: '', fileName, mimeType: getMimeType(fileName) };
          }

          let { base64: fileBase64, mimeType } = result;

          // If we forced JPEG during compression, ensure filename extension matches MIME type
          if (mimeType === 'image/jpeg') {
            fileName = fileName.replace(/\.(png|gif|webp|jpeg|jpg)$/i, '') + '.jpg';
          }

          // Force fileBase64 to be a string (defensive) so JSON encodes the full base64 payload
          return { fileBase64: String(fileBase64), fileName, mimeType };
        }),
      );

      const isSelfService = patientType === 'self';
      // Format date as yyyymmdd (no separators) as required by the API
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const payload = {
        medicineOrderId: 0,
        orderType: 'Medicine',
        patientId: userData?.e_id ?? 0,
        address: selectedLocation.address,
        hNo: selectedLocation.houseNumber,
        landMark: selectedLocation.landmark,
        addressNickname: selectedLocation.nickname
          ? selectedLocation.nickname.charAt(0).toUpperCase() + selectedLocation.nickname.slice(1)
          : '',
        // Use yyyymmdd date format (no separators)
        deliveryDate: formattedDate,
        timeSlot: '',
        isSelfService: true,
        relationId: 0,
        relationName: "",
        relationAge: 0,
        relationGender: "",

        paymentDetails: 'pay_later',
        isPaymentDone: false,
        createdBy: userData?.e_id ?? 0,
        statusId: 2867,
        // Send numeric fees (Swagger shows numbers, not strings)
        handlingFee: 0,
        deliveryCharges: 0,
        expectedDeliveryDate: formattedDate,
        deliveryNotes: prescriptionNotes,
        prescriptionFiles,
      };

      // ── Log request (with more detail for first file) ──
      const loggablePayload = {
        ...payload,
        prescriptionFiles: payload.prescriptionFiles.map((f: any, idx: number) => ({
          // idx,
          fileName: f.fileName,
          mimeType: f.mimeType,
          fileBase64: f.fileBase64,
          //prefix: f.fileBase64?.substring(0, 50),
          //suffix: f.fileBase64?.substring(f.fileBase64.length - 10),
        })),
      };
      console.log('📤 FINAL PAYLOAD (Summary):', JSON.stringify(loggablePayload, null, 2));

      const response: any = await axiosClient.post(
        ApiRoutes.PrescriptionOrders.savePrescriptionOrder,
        payload,
      );

      console.log('RESPONSE:', JSON.stringify(response, null, 2));


      if (response?.isSuccess || response?.success) {
        prescriptionStore.clear();
        showToast(
          'Order Placed!',
          response?.message ?? 'Our team will call you to confirm your order.',
          'success',
        );
        setTimeout(() => {
          setToastVisible(false);
          router.replace('/(main)/orders' as any);
        }, 2000);
      } else {
        showToast('Order Failed', response?.message ?? 'Something went wrong. Please try again.', 'error');
      }
    } catch (e: any) {
      console.error('[BookingPayLater] confirm error', e);
      showToast('Error', e?.message ?? 'Failed to place order.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (title: string, subtitle: string, type: 'success' | 'error') => {
    setToastMessage({ title, subtitle, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  // ���────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────��────

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Info</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Image source={images.icons.close} style={styles.closeIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Prescription card ────────────────────────────────────────�� */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescription</Text>
          <View style={styles.prescriptionCard}>
            {prescriptionImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: getResponsiveSpacing(8) }}
              >
                {prescriptionImages.map((img, idx) => (
                  <View key={`prescImg-${idx}`} style={{ position: 'relative', marginRight: getResponsiveSpacing(10) }}>
                    <Image
                      source={{ uri: img.uri }}
                      style={[styles.prescriptionThumb, { marginRight: 0 }]}
                    />
                    <TouchableOpacity
                      style={styles.removeImageIcon}
                      onPress={() => handleRemoveImage(idx)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removeX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.prescriptionRow}>
                <View style={styles.prescriptionPreview} />
                <View style={styles.prescriptionPreview} />
                <View style={styles.prescriptionPreview} />
              </View>
            )}

            {prescriptionNotes ? (
              <Text style={styles.notesText} numberOfLines={3}>
                {prescriptionNotes}
              </Text>
            ) : null}

            <View style={styles.serviceFooter}>
              <Text style={{ flex: 1 }} />
              <TouchableOpacity style={styles.editAddressButton1} onPress={handleEdit}>
                <Text style={styles.editAddressText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Service Address (mirrors booking.tsx LAB flow) ──────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address</Text>
          {selectedLocation ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressNickname}>
                    {selectedLocation.nickname.charAt(0).toUpperCase() +
                      selectedLocation.nickname.slice(1)}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedLocation.houseNumber && `${selectedLocation.houseNumber}, `}
                    {selectedLocation.address}
                  </Text>
                  {selectedLocation.landmark ? (
                    <Text style={styles.landmarkText}>
                      Near {selectedLocation.landmark}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.editAddressButton} onPress={handleEditAddress}>
                  <Text style={styles.editAddressText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.addressCard}>
              <Text style={{ color: '#999', fontSize: 12, marginBottom: 0, fontFamily: fonts.regular }}>
                No address found. Please add a new address.
              </Text>
              <TouchableOpacity style={styles.addnewaddressButton} onPress={handleViewAddress}>
                <Text style={styles.AddressText}>+ Add New Address</Text>
              </TouchableOpacity>
            </View>
          )}
          {errors === 'Please select or add new address' && (
            <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{errors}</Text>
          )}
        </View>

        {/* ── Patient Details (mirrors booking.tsx) ───────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <View style={styles.patientCard}>
            <View style={styles.radioGroup}>
              <View style={styles.radioOption}>
                <RadioButton
                  value="self"
                  status={patientType === 'self' ? 'checked' : 'unchecked'}
                  onPress={() => setPatientType('self')}
                  color="#C15E9C"
                />
                <Text style={styles.radioLabel}>Self Service</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton
                  value="others"
                  status={patientType === 'others' ? 'checked' : 'unchecked'}
                  onPress={() => setPatientType('others')}
                  color="#C15E9C"
                />
                <Text style={styles.radioLabel}>For Others</Text>
              </View>
            </View>

            {patientType === 'others' && (
              <View style={styles.othersForm}>
                {/* Relation Type */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Relation Type</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowRelationDropdown(true)}>
                    <Text style={styles.dropdownText}>
                      {selectedRelation ? selectedRelation.name : 'Select Relation'}
                    </Text>
                    <View style={styles.dropdownIcon} />
                  </TouchableOpacity>
                  {fieldErrors.relation ? (
                    <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{fieldErrors.relation}</Text>
                  ) : null}
                </View>

                {/* Full Name */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    placeholder="Enter full name"
                    placeholderTextColor="#999"
                  />
                  {fieldErrors.fullName ? (
                    <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{fieldErrors.fullName}</Text>
                  ) : null}
                </View>

                {/* Age */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput
                    style={styles.textInput}
                    value={age}
                    onChangeText={(text) => {
                      setAge(text);
                      if (fieldErrors.age) setFieldErrors((prev) => ({ ...prev, age: '' }));
                    }}
                    placeholder="Enter age"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                  {fieldErrors.age ? (
                    <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{fieldErrors.age}</Text>
                  ) : null}
                </View>

                {/* Gender */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowGenderDropdown(true)}>
                    <Text style={styles.dropdownText}>{gender || 'Select Gender'}</Text>
                    <View style={styles.dropdownIcon} />
                  </TouchableOpacity>
                  {fieldErrors.gender ? (
                    <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{fieldErrors.gender}</Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Cancellation Policy ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cancellation Policy</Text>
          <View style={styles.policyCard}>
            <Text style={styles.policyText}>
              Free cancellation is done more than 2 hrs before the service or if a professional
              isn&apos;t assigned. A fee will be charged otherwise.
            </Text>
            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreText}>Learn more</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: getResponsiveSpacing(120) }} />
      </ScrollView>

      {/* ── Footer button ────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bottomButton, loading && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.bottomButtonText}>Will call you and confirm the order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Relation Type Dropdown Modal (identical to booking.tsx) ──── */}
      <Modal
        visible={showRelationDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRelationDropdown(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowRelationDropdown(false)}>
          <View style={styles.dropdownModal}>
            {labRelationTypes.map((relation) => (
              <TouchableOpacity
                key={relation.masterDataId}
                style={styles.dropdownOption}
                onPress={() => {
                  setSelectedRelation(relation);
                  if (fieldErrors && typeof setFieldErrors === 'function') {
                    setFieldErrors((prev) => ({ ...prev, relation: '' }));
                  }
                  setShowRelationDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{relation.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Gender Dropdown Modal (identical to booking.tsx) ─────────── */}
      <Modal
        visible={showGenderDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowGenderDropdown(false)}>
          <View style={styles.dropdownModal}>
            {genderOptions.map((genderOption, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownOption}
                onPress={() => {
                  setGender(genderOption);
                  if (fieldErrors && typeof setFieldErrors === 'function') {
                    setFieldErrors((prev) => ({ ...prev, gender: '' }));
                  }
                  setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{genderOption}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── All Address View Modal (identical to booking.tsx) ────────── */}
      {userData?.e_id && (
        <AddressSelection
          visible={addressVisible}
          patientId={userData?.e_id}
          onSelect={(addressId) => {
            setAddressVisible(false);
            if (addressId) {
              fetchAddressById(addressId.toString());
            }
          }}
          onAddNew={() => {
            setEditAddressId(null);
            setAddressVisible(false);
            setLocationModalVisible(true);
          }}
          onEdit={(addressId) => {
            setAddressVisible(false);
            setEditAddressId(addressId);
            setLocationModalVisible(true);
          }}
          onClose={() => setAddressVisible(false)}
          onAddressChanged={() => {
            if (typeof fetchAddresses === "function") fetchAddresses();
          }}
        />
      )}

      {/* ── Location Selection Modal (identical to booking.tsx) ──────── */}
      <LocationSelection
        visible={locationModalVisible}
        addressId={editAddressId}
        onClose={() => setLocationModalVisible(false)}
        onLocationSelected={(newAddress) => {
          setSavedAddresses((prev) => [
            ...prev,
            { id: Date.now().toString(), ...newAddress },
          ]);
          setLocationModalVisible(false);
          setAddressVisible(true);
        }}
      />

      {/* Toast */}
      <Toast
        visible={toastVisible}
        title={toastMessage.title}
        subtitle={toastMessage.subtitle}
        type={toastMessage.type}
        onHide={() => setToastVisible(false)}
        duration={3000}
      />
    </SafeAreaView>
  );
}

// ─── Styles (copied from booking.tsx with minimal additions) ──────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    ...commonStyles.container_header,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    color: '#202427',
    fontFamily: fonts.semiBold,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
  },
  section: {
    marginTop: getResponsiveSpacing(10),
  },
  sectionTitle: {
    fontSize: 13,
    color: '#000000',
    marginBottom: getResponsiveSpacing(4),
    fontFamily: fonts.semiBold,
  },

  // ── Prescription card ────────────────────────────────────────────────
  prescriptionCard: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveSpacing(12),
    padding: getResponsiveSpacing(16),
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  prescriptionRow: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing(8),
  },
  prescriptionPreview: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  prescriptionThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  removeImageIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removeX: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  notesText: {
    fontSize: 13,
    color: '#555',
    marginBottom: getResponsiveSpacing(6),
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: getResponsiveSpacing(8),
  },

  // ── Address card (copied exactly from booking.tsx) ───────────────────
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginRight: 12,
  },
  addressNickname: {
    fontSize: 14,
    color: '#C15E9C',
    marginBottom: 4,
    fontFamily: fonts.semiBold,
  },
  addressText: {
    fontSize: 12,
    color: '#000',
    lineHeight: 18,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  landmarkText: {
    fontSize: 12,
    color: '#666',
    fontFamily: fonts.regular,
  },
  addnewaddressButton: {
    borderRadius: 8,
    width: '50%',
    borderColor: '#0580FA',
    borderStyle: 'solid',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 12,
    textAlign: 'center',
    marginTop: 12,
    height: 28,
  },
  AddressText: {
    color: '#0580FA',
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  editAddressButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#C15E9C',
  },
  editAddressButton1: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#C15E9C',
  },
  editAddressText: {
    fontSize: 12,
    color: '#C15E9C',
    fontWeight: '500',
    fontFamily: fonts.regular,
  },

  // ── Patient card (copied exactly from booking.tsx) ────────────────────
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    padding: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#D9DEE6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    width: '49%',
  },
  radioLabel: {
    fontSize: 14,
    color: '#2B2B2B',
  },
  othersForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: '#666',
  },

  // ── Policy (copied from booking.tsx) ─────────────────────────────────
  policyCard: {},
  policyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontSize: 14,
    color: '#0881FC',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // ── Footer (copied from booking.tsx) ─────────────────────────────────
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomButton: {
    width: '100%',
    backgroundColor: '#C15E9C',
    borderRadius: getResponsiveSpacing(30),
    paddingVertical: getResponsiveSpacing(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: getResponsiveFontSize(15),
    fontFamily: fonts.semiBold,
  },

  // ── Dropdown modals (copied from booking.tsx) ─────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    maxHeight: 400,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

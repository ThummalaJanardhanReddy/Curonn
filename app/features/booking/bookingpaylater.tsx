
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
import * as SecureStore from 'expo-secure-store';

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
   useEffect(() => {
      const restoreUserData = async () => {
        const userData = await SecureStore.getItemAsync('userData');
        console.log("Restoring userData on Home Screen:", userData);
        if (userData) {
          setUserData(JSON.parse(userData));
        }
      };
      restoreUserData();
    }, []);
 const { setUserData } = useUser();
  // ── On mount: read prescription from store ───────────────────────────
  useEffect(() => {
    const stored = prescriptionStore.get();
    if (stored.images.length > 0) {
      setPrescriptionImages(stored.images);
      setPrescriptionNotes(stored.notes);
    }
  }, []);

   const patientId = Number(userData?.e_id || userData?.eId);
  // ── fetchAddresses (identical to booking.tsx) ─────────────────────────
  const fetchAddresses = async () => {
    try {
      setLoading(true);
       const patientId = userData?.e_id || userData?.eId;
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
    if (patientId) {
      fetchAddresses();
    }
    fetchStatusId();
    fetchRelationTypes();
  }, [patientId]);

  const fetchRelationDetails = async (relationId: number) => {
    try {
      setLoading(true);
     
      if (!patientId) return;
      const response: any = await axiosClient.get(
        ApiRoutes.Employee.getRelation(relationId, patientId)
      );

      // Handle both wrapped response { isSuccess: true, data: {...} } and raw response {...}
      const detail = (response && response.isSuccess && response.data) ? response.data : response;

      if (detail && (detail.relationName || detail.fullName)) {
        setFullName(detail.relationName || detail.fullName || '');
        setAge(detail.age ? detail.age.toString() : '');
        // Capitalize gender if it's 'male'/'female'
        const g = detail.gender || '';
        setGender(g.charAt(0).toUpperCase() + g.slice(1).toLowerCase());
      } else {
        // Clear fields if no detail found for this relation type
        setFullName('');
        setAge('');
        setGender('');
      }
    } catch (error) {
      // console.error('Fetch relation details error:', error);
      setFullName('');
      setAge('');
      setGender('');

    } finally {
      setLoading(false);
    }
  };

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
        patientId: patientId,
        address: selectedLocation.address,
        hNo: selectedLocation.houseNumber,
        landMark: selectedLocation.landmark,
        addressNickname: selectedLocation.nickname
          ? selectedLocation.nickname.charAt(0).toUpperCase() + selectedLocation.nickname.slice(1)
          : '',
        // Use yyyymmdd date format (no separators)
        deliveryDate: formattedDate,
        timeSlot: '',
        isSelfService: isSelfService,
        relationId: isSelfService ? 0 : (selectedRelation?.masterDataId ?? 0),
        relationName: isSelfService ? "" : fullName,
        relationAge: isSelfService ? 0 : (age ? Number(age) : 0),
        relationGender: isSelfService ? "" : gender,

        paymentDetails: 'pay_later',
        isPaymentDone: false,
        createdBy:patientId,
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

  // ───────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────

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

        {/* ── Prescription card ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prescription</Text>
          <View style={styles.prescriptionCard}>
            {prescriptionImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: getResponsiveSpacing(6) }}
                contentContainerStyle={{ paddingVertical: 8, paddingRight: 8 }}
              >
                {prescriptionImages.map((img, idx) => (
                  <View key={`prescImg-${idx}`} style={{ position: 'relative', marginRight: getResponsiveSpacing(15) }}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.prescriptionThumb}
                    />
                    <TouchableOpacity
                      style={styles.removeImageIcon}
                      onPress={() => handleRemoveImage(idx)}
                      activeOpacity={0.7}
                    >
                      <Image source={images.icons.close} style={styles.removeXIcon} resizeMode="contain" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.prescriptionRow}>
                <View style={styles.prescriptionPlaceholder} />
                <View style={styles.prescriptionPlaceholder} />
                <View style={styles.prescriptionPlaceholder} />
              </View>
            )}

            {prescriptionNotes ? (
              <Text style={styles.notesText} numberOfLines={3}>
                {prescriptionNotes}
              </Text>
            ) : null}

            <TouchableOpacity style={styles.editPillButton} onPress={handleEdit}>
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Patient Details ───────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <View style={styles.patientCard}>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOptionNew, patientType === 'self' && styles.selectedRadioOption]}
                onPress={() => setPatientType('self')}
              >
                <View style={[styles.customRadio, patientType === 'self' && styles.customRadioSelected]}>
                  {patientType === 'self' && <View style={styles.customRadioInner} />}
                </View>
                <Text style={[styles.radioLabel, patientType === 'self' && styles.selectedRadioLabel]}>Self Service</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radioOptionNew, patientType === 'others' && styles.selectedRadioOption]}
                onPress={() => setPatientType('others')}
              >
                <View style={[styles.customRadio, patientType === 'others' && styles.customRadioSelected]}>
                  {patientType === 'others' && <View style={styles.customRadioInner} />}
                </View>
                <Text style={[styles.radioLabel, patientType === 'others' && styles.selectedRadioLabel]}>For Family</Text>
              </TouchableOpacity>
            </View>

            {patientType === 'others' && (
              <View style={styles.othersForm}>
                {/* Relation Type */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Relation Type</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowRelationDropdown(true)}>
                    <Text style={styles.dropdownText}>
                      {selectedRelation ? selectedRelation.name : 'Select'}
                    </Text>
                    <View style={styles.dropdownArrow} />
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
                    <Text style={styles.dropdownText}>{gender || 'Select '}</Text>
                    <View style={styles.dropdownArrow} />
                  </TouchableOpacity>
                  {fieldErrors.gender ? (
                    <Text style={{ color: '#ff0000', fontSize: 13, marginTop: 4 }}>{fieldErrors.gender}</Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ── Service Address ──────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Address</Text>
          {selectedLocation ? (
            <View style={styles.addressCard}>
              <View style={styles.addressInfoNew}>
                <Text style={styles.addressNameBold}>
                  {userData?.fullName || "Anil Kumar"}
                </Text>
                <Text style={styles.addressTextNew}>
                  {selectedLocation.houseNumber && `${selectedLocation.houseNumber}, `}
                  {selectedLocation.address}
                  {selectedLocation.landmark && `, ${selectedLocation.landmark}`}
                </Text>

                <TouchableOpacity
                  style={styles.editAddressButtonNew}
                  onPress={handleViewAddress}
                >
                  <Text style={styles.editAddressTextNew}>Edit Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.addressCard}>
              <Text style={{ color: '#999', fontSize: 12, marginBottom: 10, fontFamily: fonts.regular }}>
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

        {/* ── Cancellation Policy ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.policyTitle}>Cancellation policy</Text>
          <View style={styles.policyCard}>
            <Text style={styles.policyTextNew}>
              Free cancellation is done more than 2 hrs before the service or if a professional
              isn&apos;t assigned. A fee with be charge otherwise
            </Text>
            <TouchableOpacity style={styles.learnMoreButton}>
              <Text style={styles.learnMoreTextNew}>Learn more</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: getResponsiveSpacing(20) }} />
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
                  fetchRelationDetails(relation.masterDataId);
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
      {patientId && (
        <AddressSelection
          visible={addressVisible}
          patientId={patientId}
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

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(10),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
   fontFamily: fonts.semiBold,
    fontSize: getResponsiveFontSize(16),
    color: colors.black,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 16,
    height: 16,
    tintColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing(20),
    backgroundColor: '#F5F5F9',
    paddingVertical: getResponsiveSpacing(10),
  },
  section: {
    marginTop: getResponsiveSpacing(5),
  },
  sectionTitle: {
   fontSize: 14,
    color: "#000000",
    marginBottom: getResponsiveSpacing(5),
    marginTop: getResponsiveSpacing(0),
    fontFamily: fonts.semiBold
  },
  prescriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(10),
  },
  prescriptionRow: {
    flexDirection: 'row',
    marginBottom: getResponsiveSpacing(6),
  },
  prescriptionThumb: {
    width: getResponsiveSpacing(80),
    height: getResponsiveSpacing(80),
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  prescriptionPlaceholder: {
    width: getResponsiveSpacing(80),
    height: getResponsiveSpacing(80),
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginRight: getResponsiveSpacing(12),
  },
  removeImageIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#737274',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    zIndex: 10,
  },
  // removeXIcon: {
  //   width: 8,
  //   height: 8,
  //   // tintColor: '#646060ff',
  //   tintColor: "black",
  // },
  removeXIcon: {
    width: 14,
    height: 14,
    tintColor: '#000',
    backgroundColor: "#fff",
    borderRadius: 7,
  },
  removeX: {
    padding: 4,
  },
  notesText: {
    fontSize: getResponsiveFontSize(13),
    color: '#333',
    fontFamily: fonts.regular,
    marginBottom: getResponsiveSpacing(6),
  },
  editPillButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 30,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    height: 30,

    borderColor: '#C35E9C',
  },
  editPillText: {
    fontSize: getResponsiveFontSize(13),
    color: '#C35E9C',
    fontFamily: fonts.semiBold,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: getResponsiveSpacing(5),
  },
  addressInfoNew: {
    flex: 1,
  },
  addressNameBold: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#3B2032',
    marginBottom: 6,
  },
  addressTextNew: {
    fontSize: 13,
    color: '#000',
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  editAddressButtonNew: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C15E9C',
  },
  editAddressTextNew: {
  fontSize: 13,
    color: '#C15E9C',
    fontFamily: fonts.medium,
  },
  addnewaddressButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  AddressText: {
    color: '#C15E9C',
    fontFamily: fonts.medium,
  },
  patientCard: {
  backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbdbdb",
    marginBottom: getResponsiveSpacing(10),
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioOptionNew: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#D9DEE6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    width: '48%',
  },
  selectedRadioOption: {
    borderColor: '#C35E9C',
  },
  customRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D9DEE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customRadioSelected: {
    borderColor: '#C35E9C',
  },
  customRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C35E9C',
  },
  radioLabel: {
    fontSize: 14,
    color: '#2B2B2B',
    fontFamily: fonts.regular,
  },
  selectedRadioLabel: {
    fontFamily: fonts.semiBold,
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
  dropdownArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#666',
    marginLeft: 10,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: '#666',
  },
  policyTitle: {
        fontSize: 14,
    color: "#000000",
    marginBottom: getResponsiveSpacing(5),
    marginTop: getResponsiveSpacing(10),
    fontFamily: fonts.semiBold
  },
  policyCard: {
    marginTop: 0,
  },
  policyTextNew: {
     fontSize: 12,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: fonts.regular
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
  },
  learnMoreTextNew: {
    fontSize: 13,
    color: "#0881FC",
    fontWeight: "500",
    textDecorationLine: "underline",
    fontFamily: fonts.medium
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    
  },
  bottomButton: {
    width: '100%',
    backgroundColor: '#C35E9C',
    borderRadius: getResponsiveSpacing(30),
    paddingVertical: getResponsiveSpacing(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(15),
    fontFamily: fonts.semiBold,
  },
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

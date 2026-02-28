import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { images } from "../../../assets";
import BackButton from "../../shared/components/BackButton";
import PrimaryButton from "../../shared/components/PrimaryButton";
import { colors } from "../../shared/styles/commonStyles";
import {
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
} from "../../shared/utils/responsive";
import { useDoctorConsultationStore } from "@/src/store/doctor-consultation";

interface Symptom {
  id: string;
  name: string;
  category: string;
}

export default function SymptomsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const { setSymptoms} = useDoctorConsultationStore();
  // Mock symptoms data - in real app this would come from API
  const allSymptoms: Symptom[] = useMemo(
    () => [
      { id: "1", name: "Fever", category: "General" },
      { id: "2", name: "Headache", category: "General" },
      { id: "3", name: "Cough", category: "Respiratory" },
      { id: "4", name: "Chest Pain", category: "Cardiovascular" },
      { id: "5", name: "Nausea", category: "Digestive" },
      { id: "6", name: "Dizziness", category: "Neurological" },
      { id: "7", name: "Fatigue", category: "General" },
      { id: "8", name: "Shortness of Breath", category: "Respiratory" },
      { id: "9", name: "Joint Pain", category: "Musculoskeletal" },
      { id: "10", name: "Skin Rash", category: "Dermatological" },
      { id: "11", name: "Abdominal Pain", category: "Digestive" },
      { id: "12", name: "Back Pain", category: "Musculoskeletal" },
    ],
    [],
  );

  const filteredSymptoms = useMemo(() => {
    let filtered = allSymptoms.filter(
      (symptom) =>
        !selectedSymptoms.some((selected) => selected.id === symptom.id),
    );

    if (searchQuery) {
      filtered = filtered.filter((symptom) =>
        symptom.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  }, [allSymptoms, selectedSymptoms, searchQuery]);

  const handleBack = () => {
    router.back();
  };

  const handleSymptomSelect = (symptom: Symptom) => {
    setSelectedSymptoms((prev) => [...prev, symptom]);
  };

  const handleSymptomDeselect = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.filter((symptom) => symptom.id !== symptomId),
    );
  };

  const handleProceedToChat = () => {
    router.push({
      pathname: "/features/chat/chat-screen",
      params: {
        selectedSymptoms: JSON.stringify(selectedSymptoms),
        doctorName: "Dr. Sarah Johnson", // This would come from previous screen
      },
    });
  };

  const handleConfirm = () => {
    setSymptoms(selectedSymptoms.map(s=>s.name));
    router.push({
      pathname: '/shared/components/doctor/confirmConsultation',
    })
  }

  const renderSymptomCard = useCallback(
    ({ item }: { item: Symptom }) => (
      <TouchableOpacity
        style={styles.symptomCard}
        onPress={() => handleSymptomSelect(item)}
        activeOpacity={0.8}
      >
        <Text style={styles.symptomName}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [],
  );

  const renderSelectedChip = useCallback(
    (symptom: Symptom) => (
      <View key={symptom.id} style={styles.selectedChip}>
        <Text style={styles.chipText}>{symptom.name}</Text>
        <TouchableOpacity
          onPress={() => handleSymptomDeselect(symptom.id)}
          style={styles.chipCloseButton}
        >
          <Text style={styles.chipCloseText}>×</Text>
        </TouchableOpacity>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          title="Symptoms"
          onPress={handleBack}
          style={styles.backButton}
          textStyle={styles.headerTitle}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Image source={images.icons.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for symptoms"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <Image source={images.icons.close} style={styles.clearIcon} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Selected Symptoms Chips */}
        {selectedSymptoms.length > 0 && (
          <View style={styles.selectedContainer}>
            <View style={styles.selectedChipsContainer}>
              {selectedSymptoms.map(renderSelectedChip)}
            </View>
          </View>
        )}

        {/* Most Selected Issue Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Most selected issue</Text>
        </View>

        {/* Symptoms Grid */}
        <View style={styles.symptomsContainer}>
          <View style={styles.symptomsGrid}>
            {filteredSymptoms.map((symptom) => (
              <View key={symptom.id} style={styles.symptomCardWrapper}>
                {renderSymptomCard({ item: symptom })}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom spacing for button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Proceed Button - Always visible at bottom */}
      {selectedSymptoms.length > 0 && (
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Confirm"
            onPress={handleConfirm}
            style={styles.proceedButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  header: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(50),
    paddingBottom: getResponsiveSpacing(15),
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    alignSelf: "flex-start",
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "bold",
    color: colors.black,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingTop: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(10),
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: getResponsiveSpacing(8),
    backgroundColor: "#fff",
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(8),
  },
  searchIcon: {
    ...getResponsiveImageSize(20, 20),
    marginRight: getResponsiveSpacing(8),
    tintColor: "#999",
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    paddingVertical: getResponsiveSpacing(4),
    color: "#333",
  },
  clearButton: {
    padding: getResponsiveSpacing(4),
    marginLeft: getResponsiveSpacing(8),
  },
  clearIcon: {
    ...getResponsiveImageSize(16, 16),
    tintColor: "#999",
  },
  selectedContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
  },
  selectedChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: getResponsiveSpacing(8),
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6DCF5",
    borderRadius: getResponsiveSpacing(8),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(6),
    marginBottom: getResponsiveSpacing(4),
  },
  chipText: {
    fontSize: getResponsiveFontSize(12),
    color: colors.primary,
    fontWeight: "500",
    marginRight: getResponsiveSpacing(6),
  },
  chipCloseButton: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: getResponsiveSpacing(4),
  },
  chipCloseText: {
    fontSize: getResponsiveFontSize(16),
    color: colors.black,
    fontWeight: "bold",
  },
  titleContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(15),
  },
  titleText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "bold",
    color: colors.text,
  },
  symptomsContainer: {
    paddingHorizontal: getResponsiveSpacing(20),
    paddingBottom: getResponsiveSpacing(20),
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: getResponsiveSpacing(8),
  },
  symptomCardWrapper: {
    marginBottom: getResponsiveSpacing(8),
  },
  symptomCard: {
    backgroundColor: "#F2F6FF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: getResponsiveSpacing(15),
    paddingHorizontal: getResponsiveSpacing(12),
    paddingVertical: getResponsiveSpacing(6),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  symptomName: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
  },
  bottomSpacing: {
    height: getResponsiveSpacing(80),
  },
  buttonContainer: {
    position: "absolute",
    bottom: getResponsiveSpacing(60),
    left: 0,
    right: 0,
    paddingHorizontal: getResponsiveSpacing(20),
    // paddingBottom: getResponsiveSpacing(30),
    // paddingTop: getResponsiveSpacing(15),
    backgroundColor: colors.bg_primary,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  proceedButton: {
    borderRadius: getResponsiveSpacing(23),
    height: getResponsiveSpacing(45),
    width: "100%",
  },
});

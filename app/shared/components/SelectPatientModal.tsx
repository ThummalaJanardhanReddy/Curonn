import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import PrimaryButton from './PrimaryButton'; // Adjust import if needed
import axiosClient from '../../../src/api/axiosClient';
import ApiRoutes from "@/src/api/employee/employee";
import { SafeAreaView } from "react-native-safe-area-context";
import { fonts } from '../styles/fonts';
import { images } from '@/assets';

interface FamilyMember {
  empRelationId: number;
  relationId: number;
  relationName: string;
  patientId: number;
  gender: string;
  age: number;
  image?: string;
  relation?: string;
}

interface RelationType {
  masterDataId: number;
  name: string;
}

interface SelectPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: FamilyMember) => void;
  patientId: number;
}

const SelectPatientModal: React.FC<SelectPatientModalProps> = ({ visible, onClose, onSelect, patientId }) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [relationTypes, setRelationTypes] = useState<RelationType[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !patientId) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        // Fetch family members
        const famRes = await axiosClient.get(ApiRoutes.Employee.GetPatientRelations(patientId));
        console.log('Family members response:', famRes);
        let famList: FamilyMember[] = [];
        if (Array.isArray(famRes)) famList = famRes;
        else if (famRes && famRes.data && Array.isArray(famRes.data)) famList = famRes.data;

        // Fetch patient self details
        const selfRes:any = await axiosClient.get(ApiRoutes.Employee.getById(patientId));
        let selfMember: FamilyMember | null = null;
        if (selfRes && (selfRes.eId || selfRes.e_id)) {
          selfMember = {
            empRelationId: 0, // 0 for self
            relationId: 0, // 0 for self
            relationName: selfRes.fullName || selfRes.name || "Self",
            patientId: selfRes.eId || selfRes.e_id,
            gender: selfRes.gender || "",
            age: selfRes.age || 0,
            relation: "Self",
          };
        }
        // Place self at the top
        const allMembers = selfMember ? [selfMember, ...famList] : famList;
        setFamilyMembers(allMembers);

        // Fetch relation types
        const relRes = await axiosClient.get(ApiRoutes.Master.getmasterdata(5));
        //console.log('Relation types response:', relRes);
        let relList: RelationType[] = [];
        if (Array.isArray(relRes)) relList = relRes.filter((item: any) => item.isActive).map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
        else if (relRes.isSuccess && Array.isArray(relRes.data)) relList = relRes.data.filter((item: any) => item.isActive).map((item: any) => ({ masterDataId: item.masterDataId, name: item.name }));
        setRelationTypes(relList);
      } catch (e) {
        setFamilyMembers([]);
        setRelationTypes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [visible, patientId]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 320 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 18, marginBottom: 5 }}>Book For</Text>
             <TouchableOpacity onPress={onClose} style={{ fontFamily: fonts.semiBold, fontSize: 18, marginBottom: 5 }}>
                          <Image source={images.icons.close} style={{ fontFamily: fonts.semiBold, fontSize: 18, marginBottom: 16 }} />
                        </TouchableOpacity>
                        </View>
            {loading ? (
              <ActivityIndicator size="large" color="#C15E9C" style={{ marginVertical: 40 }} />
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {familyMembers.length === 0 ? (
                  <Text style={{ fontFamily: fonts.regular, textAlign: 'center', color: '#888', fontSize: 16, marginTop: 24 }}>No Family Members</Text>
                ) : (
                  familyMembers.map((member) => (
                    <TouchableOpacity
                      key={member.empRelationId === 0 ? 'self' : member.empRelationId}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderWidth: selectedMember?.empRelationId === member.empRelationId ? 1.5 : 1,
                        borderColor: selectedMember?.empRelationId === member.empRelationId ? '#C15E9C' : '#dbdbdb',
                        borderRadius: 12,
                        marginBottom: 10,
                        backgroundColor: selectedMember?.empRelationId === member.empRelationId ? '#F9EFF2' : '#fff',
                      }}


                      onPress={() => {
                        setSelectedMember(member);
                        let memberToSend = member;
                        if ((member.empRelationId === 0 || member.relationId === 0) && (member.relation === 'Self' || (member.relationName || '').trim().toLowerCase() === 'self')) {
                          memberToSend = { ...member, empRelationId: member.patientId };
                        }
                        console.log("Modal onSelect called", memberToSend);
                        onSelect(memberToSend);
                        onClose();
                      }}

                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.semiBold, fontSize: 16, color: '#000000' }}>{member.relationName}</Text>
                        <Text style={{ fontFamily: fonts.regular, color: '#251729', fontSize: 13 }}>
                          {(member.empRelationId === 0 ? 'Self' : (relationTypes.find(r => r.masterDataId === member.relationId)?.name || member.relation || ''))} | {member.gender} | {member.age} yrs
                        </Text>
                      </View>
                      <View style={{
                        width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                        borderColor: '#C15E9C', alignItems: 'center', justifyContent: 'center', marginLeft: 8
                      }}>
                        {selectedMember?.empRelationId === member.empRelationId && (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#C15E9C' }} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
            {/* <PrimaryButton
              title="Continue"
              onPress={() => {
                if (selectedMember) onSelect(selectedMember);
                onClose();
              }}
              disabled={!selectedMember}
              style={{ marginTop: 16 }}
            /> */}
            {/* <PrimaryButton
            title="Cancel"
            onPress={onClose}
            style={{ marginTop: 8, backgroundColor: '#eee', color: '#333' }}
          /> */}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default SelectPatientModal;

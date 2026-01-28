import { Text, TextInput, View, StyleSheet, Dimensions, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";


export default function TambahSppt() {
  const db = useSQLiteContext();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = !!editId;
  const editIdNum = editId ? parseInt(editId, 10) : null;
  
  const [nopd, setNopd] = useState('');
  const [namaWp, setNamaWp] = useState('');
  const [alamatWp, setAlamatWp] = useState('');
  const [rtWp, setRtWp] = useState('');
  const [rwWp, setRwWp] = useState('');
  const [totalWp, setTotalWp] = useState('');

  // Reset form function
  const resetForm = useCallback(() => {
    if (!isEditMode) {
      setNopd('');
      setNamaWp('');
      setAlamatWp('');
      setRtWp('');
      setRwWp('');
      setTotalWp('');
    }
  }, [isEditMode]);

  // Fetch data for editing
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode || !editIdNum) return;
      
      try {
        const sppt = await db.getFirstAsync<any>(
          'SELECT * FROM sppt WHERE id = ?',
          [editIdNum]
        );
        
        if (sppt) {
          setNopd(sppt.nopd || '');
          setNamaWp(sppt.namaWp || '');
          setAlamatWp(sppt.alamatWp || '');
          setRtWp(sppt.rtWp || '');
          setRwWp(sppt.rwWp || '');
          setTotalWp(sppt.totalWp || '');
        }
      } catch (error) {
        console.error('Error fetching Kartu Keluarga:', error);
      }
    };

    fetchData();
  }, [isEditMode, editIdNum, db]);

  // Reset form when screen comes into focus (only if not editing)
  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [resetForm])
  );

  const handleAddSppt = async () => {
    // Validate required fields
    if (!nopd.trim() || !namaWp.trim() || !alamatWp.trim()) {
      Alert.alert('Error', 'Nopd, Nama Wajib Pajak, dan Alamat harus diisi');
      return;
    }

    // Validate NOPD
    const nopdValue = nopd.trim();
    if (!/^\d+$/.test(nopdValue)) {
      Alert.alert('Error', 'NOPD harus berupa angka saja');
      return;
    }

    try {
      const now = new Date().toISOString();
      
      if (isEditMode && editIdNum) {
        // Update existing Kartu Keluarga
        await db.runAsync(
          `UPDATE sppt SET
            nopd = ?,
            namaWp = ?,
            alamatWp = ?,
            rtWp = ?,
            rwWp = ?,
            totalWp = ?,
            updatedAt = ?
          WHERE id = ?`,
          [
            nopd.trim(),
            namaWp.trim(),
            alamatWp.trim(),
            rtWp.trim() || null,
            rwWp.trim() || null,
            totalWp.trim() || null,
            now,
            editIdNum
          ]
        );
        
        console.log('SPPT berhasil diupdate');
        // Navigate back to detail page
        router.push(`/(tabs)/databaseSppt`);
      } else {
        // Insert new SPPT
        const result = await db.runAsync(
          `INSERT INTO sppt (
            nopd, 
            namaWp, 
            alamatWp, 
            rtWp, 
            rwWp, 
            totalWp, 
            createdAt, 
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nopd.trim(),
            namaWp.trim(),
            alamatWp.trim(),
            rtWp.trim() || null,
            rwWp.trim() || null,
            totalWp.trim() || null,
            now,
            now
          ]
        );

        // Get the inserted ID (lastInsertRowId)
        const newSpptId = result.lastInsertRowId;
        
        console.log('Kartu Keluarga berhasil ditambahkan dengan ID:', newSpptId);
        
        // Reset form before navigation
        resetForm();
        
        // Navigate to add anggota screen with the new KK ID
        router.push(`/(tabs)/databaseSppt`);
      }
    } catch (error) {
      console.error('Error saving SPPT:', error);
      Alert.alert('Error', `Gagal ${isEditMode ? 'mengupdate' : 'menambahkan'} SPPT. Silakan coba lagi.`);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 76}
    >
      <ScrollView 
        style={{width: '90%'}}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.textForm}
          placeholder="NOPD"
          value={nopd}
          onChangeText={setNopd}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Nama Wajib Pajak"
          value={namaWp}
          onChangeText={setNamaWp}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Alamat"
          value={alamatWp}
          onChangeText={setAlamatWp}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="RT"
          value={rtWp}
          onChangeText={setRtWp}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="RW"
          value={rwWp}
          onChangeText={setRwWp}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Total Bayar"
          value={totalWp}
          onChangeText={setTotalWp}
          placeholderTextColor="#606C38"
        />
        <Pressable 
          style={styles.linkButton}
          onPress={() => {
            handleAddSppt?.();
          }}
        >
          <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
            <Feather name={isEditMode ? "edit" : "plus"} size={14} color="#FFFCEA" />
          </View>
          <Text style={styles.linkButtonText}>{isEditMode ? "Update SPPT" : "Simpan SPPT"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 24,
    paddingTop: '10%',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  textForm: {
    backgroundColor:'#FFFCEA',
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDA15E',
    paddingVertical: 8,
    borderRadius: 32,
    gap: 8,
    width: '90%',
    marginHorizontal: 'auto'
  },
  linkButtonText: {
    fontSize: 14,
    color: '#FFFCEA',
  },
});
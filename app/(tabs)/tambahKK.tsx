import { Text, TextInput, View, StyleSheet, Dimensions, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

export default function TambahKK() {
  const db = useSQLiteContext();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = !!editId;
  const editIdNum = editId ? parseInt(editId, 10) : null;
  
  const [nomorKK, setNomorKK] = useState('');
  const [namaKepalaKeluarga, setNamaKepalaKeluarga] = useState('');
  const [alamat, setAlamat] = useState('');
  const [rt, setRT] = useState('');
  const [rw, setRW] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kota, setKota] = useState('');
  const [provinsi, setProvinsi] = useState('');

  // Reset form function
  const resetForm = useCallback(() => {
    if (!isEditMode) {
      setNomorKK('');
      setNamaKepalaKeluarga('');
      setAlamat('');
      setRT('');
      setRW('');
      setKelurahan('');
      setKecamatan('');
      setKota('');
      setProvinsi('');
    }
  }, [isEditMode]);

  // Fetch data for editing
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode || !editIdNum) return;
      
      try {
        const kk = await db.getFirstAsync<any>(
          'SELECT * FROM kartuKeluarga WHERE id = ?',
          [editIdNum]
        );
        
        if (kk) {
          setNomorKK(kk.nomorKK || '');
          setNamaKepalaKeluarga(kk.namaKepalaKeluarga || '');
          setAlamat(kk.alamat || '');
          setRT(kk.rukunTetangga || '');
          setRW(kk.rukunWarga || '');
          setKelurahan(kk.kelurahan || '');
          setKecamatan(kk.kecamatan || '');
          setKota(kk.kota || '');
          setProvinsi(kk.provinsi || '');
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

  const handleAddKK = async () => {
    // Validate required fields
    if (!nomorKK.trim() || !namaKepalaKeluarga.trim() || !alamat.trim()) {
      Alert.alert('Error', 'Nomor KK, Nama Kepala Keluarga, dan Alamat harus diisi');
      return;
    }

    // Validate No KK
    const noKkValue = nomorKK.trim();
    if (!/^\d+$/.test(noKkValue)) {
      Alert.alert('Error', 'Nomor KK harus berupa angka saja');
      return;
    }

    try {
      const now = new Date().toISOString();
      
      if (isEditMode && editIdNum) {
        // Update existing Kartu Keluarga
        await db.runAsync(
          `UPDATE kartuKeluarga SET
            nomorKK = ?,
            namaKepalaKeluarga = ?,
            alamat = ?,
            rukunTetangga = ?,
            rukunWarga = ?,
            kelurahan = ?,
            kecamatan = ?,
            kota = ?,
            provinsi = ?,
            updatedAt = ?
          WHERE id = ?`,
          [
            nomorKK.trim(),
            namaKepalaKeluarga.trim(),
            alamat.trim(),
            rt.trim() || null,
            rw.trim() || null,
            kelurahan.trim() || null,
            kecamatan.trim() || null,
            kota.trim() || null,
            provinsi.trim() || null,
            now,
            editIdNum
          ]
        );
        
        console.log('Kartu Keluarga berhasil diupdate');
        // Navigate back to detail page
        router.push(`/(tabs)/detailKK?id=${editIdNum}`);
      } else {
        // Insert new Kartu Keluarga
        const result = await db.runAsync(
          `INSERT INTO kartuKeluarga (
            nomorKK, 
            namaKepalaKeluarga, 
            alamat, 
            rukunTetangga, 
            rukunWarga, 
            kelurahan, 
            kecamatan, 
            kota, 
            provinsi, 
            createdAt, 
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nomorKK.trim(),
            namaKepalaKeluarga.trim(),
            alamat.trim(),
            rt.trim() || null,
            rw.trim() || null,
            kelurahan.trim() || null,
            kecamatan.trim() || null,
            kota.trim() || null,
            provinsi.trim() || null,
            now,
            now
          ]
        );

        // Get the inserted ID (lastInsertRowId)
        const newKartuKeluargaId = result.lastInsertRowId;
        
        console.log('Kartu Keluarga berhasil ditambahkan dengan ID:', newKartuKeluargaId);
        
        // Reset form before navigation
        resetForm();
        
        // Navigate to add anggota screen with the new KK ID
        router.push(`/(tabs)/tambahAnggota?id=${newKartuKeluargaId}`);
      }
    } catch (error) {
      console.error('Error saving Kartu Keluarga:', error);
      Alert.alert('Error', `Gagal ${isEditMode ? 'mengupdate' : 'menambahkan'} Kartu Keluarga. Silakan coba lagi.`);
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
          placeholder="No.KK"
          value={nomorKK}
          onChangeText={setNomorKK}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Nama Kepala Keluarga"
          value={namaKepalaKeluarga}
          onChangeText={setNamaKepalaKeluarga}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Alamat"
          value={alamat}
          onChangeText={setAlamat}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="RT"
          value={rt}
          onChangeText={setRT}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="RW"
          value={rw}
          onChangeText={setRW}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Desa/Kelurahan"
          value={kelurahan}
          onChangeText={setKelurahan}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Kecamatan/Kapanewonan"
          value={kecamatan}
          onChangeText={setKecamatan}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Kota/Kabupaten"
          value={kota}
          onChangeText={setKota}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Provinsi"
          value={provinsi}
          onChangeText={setProvinsi}
          placeholderTextColor="#606C38"
        />
        <Pressable 
          style={styles.linkButton}
          onPress={() => {
            handleAddKK?.();
          }}
        >
          <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
            <Feather name={isEditMode ? "edit" : "plus"} size={14} color="#FFFCEA" />
          </View>
          <Text style={styles.linkButtonText}>{isEditMode ? "Update Kartu Keluarga" : "Simpan Kartu Keluarga"}</Text>
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
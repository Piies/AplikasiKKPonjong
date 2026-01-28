import { useState, useEffect, useCallback } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, Text, Dimensions, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useSQLiteContext } from "expo-sqlite";
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function TambahAnggota() {
  const db = useSQLiteContext();
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [tanggalLahirDate, setTanggalLahirDate] = useState<Date | null>(null);
  const [showTanggalLahirPicker, setShowTanggalLahirPicker] = useState(false);
  const [jenisKelamin, setJenisKelamin] = useState('');
  const [hubungan, setHubungan] = useState('');
  const [agama, setAgama] = useState('');
  const [pendidikan, setPendidikan] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [statusPerkawinan, setPerkawinan] = useState('');
  const [namaAyah, setNamaAyah] = useState('');
  const [namaIbu, setNamaIbu] = useState('');
  const [kartuKeluarga, setKartuKeluarga] = useState<any>(null);
  
  // Get params from route
  const { id, editId } = useLocalSearchParams<{ id?: string; editId?: string }>();
  const kartuKeluargaId = id ? parseInt(id, 10) : null;
  const isEditMode = !!editId;
  const editIdNum = editId ? parseInt(editId, 10) : null;

  // Reset form function
  const resetForm = useCallback(() => {
    if (!isEditMode) {
      setNik('');
      setNama('');
      setTempatLahir('');
      setTanggalLahir('');
      setTanggalLahirDate(null);
      setJenisKelamin('');
      setHubungan('');
      setAgama('');
      setPendidikan('');
      setPekerjaan('');
      setPerkawinan('');
      setNamaAyah('');
      setNamaIbu('');
    }
  }, [isEditMode]);

  const formatDateYYYYMMDD = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseYYYYMMDD = (value: string): Date | null => {
    const v = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const [y, m, d] = v.split('-').map((n) => parseInt(n, 10));
    const dt = new Date(y, m - 1, d);
    // Guard against invalid dates like 2026-02-31
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt;
  };

  // Fetch data for editing
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode || !editIdNum) return;
      
      try {
        const anggota = await db.getFirstAsync<any>(
          'SELECT * FROM anggotaKeluarga WHERE id = ?',
          [editIdNum]
        );
        
        if (anggota) {
          setNik(anggota.nik || '');
          setNama(anggota.nama || '');
          setTempatLahir(anggota.tempatLahir || '');
          const tgl = anggota.tanggalLahir || '';
          setTanggalLahir(tgl);
          setTanggalLahirDate(parseYYYYMMDD(tgl));
          setJenisKelamin(anggota.jenisKelamin || '');
          setHubungan(anggota.hubungan || '');
          setAgama(anggota.agama || '');
          setPendidikan(anggota.pendidikan || '');
          setPekerjaan(anggota.pekerjaan || '');
          setPerkawinan(anggota.statusPerkawinan || '');
          setNamaAyah(anggota.namaAyah || '');
          setNamaIbu(anggota.namaIbu || '');
        }
      } catch (error) {
        console.error('Error fetching Anggota Keluarga:', error);
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

  // Fetch kartuKeluarga from database
  useEffect(() => {
    const fetchKartuKeluarga = async () => {
      if (!kartuKeluargaId) return;
      
      try {
        const result = await db.getFirstAsync<{
          id: number;
          nomorKK: string;
          namaKepalaKeluarga: string;
          alamat: string;
        }>(
          'SELECT id, nomorKK, namaKepalaKeluarga, alamat FROM kartuKeluarga WHERE id = ?',
          [kartuKeluargaId]
        );
        
        if (result) {
          setKartuKeluarga(result);
        }
      } catch (error) {
        console.error('Error fetching Kartu Keluarga:', error);
      }
    };

    fetchKartuKeluarga();
  }, [kartuKeluargaId, db]);

  const handleAddAnggota = async () => {
    if (!kartuKeluargaId) {
      Alert.alert('Error', 'ID Kartu Keluarga tidak valid');
      return;
    }

    // Validate required fields
    if (!nik.trim() || !nama.trim()) {
      Alert.alert('Error', 'NIK dan Nama harus diisi');
      return;
    }

    // Validate NIK
    const nikValue = nik.trim();
    if (!/^\d+$/.test(nikValue)) {
      Alert.alert('Error', 'NIK harus berupa angka saja');
      return;
    }
    // Optional: enforce standard NIK length (16 digits)
    if (nikValue.length !== 16) {
      Alert.alert('Error', 'NIK harus 16 digit');
      return;
    }

    // Validate jenisKelamin
    if (jenisKelamin.trim() && !['L', 'P', 'LAIN'].includes(jenisKelamin.trim().toUpperCase())) {
      Alert.alert('Error', 'Jenis Kelamin harus L atau P atau Lain');
      return;
    }

    try {
      const now = new Date().toISOString();
      
      if (isEditMode && editIdNum) {
        // Update existing Anggota Keluarga
        await db.runAsync(
          `UPDATE anggotaKeluarga SET
            nik = ?,
            nama = ?,
            tempatLahir = ?,
            tanggalLahir = ?,
            jenisKelamin = ?,
            hubungan = ?,
            agama = ?,
            pendidikan = ?,
            pekerjaan = ?,
            statusPerkawinan = ?,
            namaAyah = ?,
            namaIbu = ?,
            updatedAt = ?
          WHERE id = ?`,
          [
            nik.trim(),
            nama.trim(),
            tempatLahir.trim() || null,
            tanggalLahir.trim() || null,
            jenisKelamin.trim().toUpperCase() || null,
            hubungan.trim() || null,
            agama.trim() || null,
            pendidikan.trim() || null,
            pekerjaan.trim() || null,
            statusPerkawinan.trim() || null,
            namaAyah.trim() || null,
            namaIbu.trim() || null,
            now,
            editIdNum
          ]
        );
        
        console.log('Anggota Keluarga berhasil diupdate');
        // Navigate back to detail page
        router.push(`/(tabs)/detailKK?id=${kartuKeluargaId}`);
      } else {
        // Insert new Anggota Keluarga
        const result = await db.runAsync(
          `INSERT INTO anggotaKeluarga (
            idKK, 
            nik, 
            nama, 
            tempatLahir, 
            tanggalLahir, 
            jenisKelamin, 
            hubungan, 
            agama, 
            pendidikan, 
            pekerjaan, 
            statusPerkawinan, 
            namaAyah, 
            namaIbu, 
            createdAt, 
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            kartuKeluargaId,
            nik.trim(),
            nama.trim(),
            tempatLahir.trim() || null,
            tanggalLahir.trim() || null,
            jenisKelamin.trim().toUpperCase() || null,
            hubungan.trim() || null,
            agama.trim() || null,
            pendidikan.trim() || null,
            pekerjaan.trim() || null,
            statusPerkawinan.trim() || null,
            namaAyah.trim() || null,
            namaIbu.trim() || null,
            now,
            now
          ]
        );
        const newAnggotaId = result.lastInsertRowId;
        console.log(`Anggota Keluarga ${newAnggotaId} berhasil ditambahkan`);
        
        // Reset form before navigation
        resetForm();
        
        // Navigate to detail page
        router.push(`/(tabs)/detailKK?id=${kartuKeluargaId}`);
      }
    } catch (error) {
      console.error('Error saving Anggota Keluarga:', error);
      Alert.alert('Error', `Gagal ${isEditMode ? 'mengupdate' : 'menambahkan'} Anggota Keluarga. Silakan coba lagi.`);
    }
  };


  if (!kartuKeluargaId || !kartuKeluarga) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kartu Keluarga tidak ditemukan</Text>
        </View>
      </View>
    );
  }
  return(
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
          placeholder="NIK"
          value={nik}
          onChangeText={setNik}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Nama"
          value={nama}
          onChangeText={setNama}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Tempat Lahir"
          value={tempatLahir}
          onChangeText={setTempatLahir}
          placeholderTextColor="#606C38"
        />
        <Pressable onPress={() => setShowTanggalLahirPicker(true)}>
          <TextInput
            style={styles.textForm}
            placeholder="Tanggal Lahir"
            value={tanggalLahir}
            editable={false}
            pointerEvents="none"
            placeholderTextColor="#606C38"
          />
        </Pressable>
        {showTanggalLahirPicker && (
          <DateTimePicker
            value={tanggalLahirDate ?? new Date()}
            mode="date"
            display='default'
            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
              // Android: picker closes after selection/cancel
              setShowTanggalLahirPicker(false);

              if (event.type === 'dismissed') return;
              if (!selectedDate) return; // cancelled
              setTanggalLahirDate(selectedDate);
              setTanggalLahir(formatDateYYYYMMDD(selectedDate));
            }}
          />
        )}
        <TextInput
          style={styles.textForm}
          placeholder="Jenis Kelamin"
          value={jenisKelamin}
          onChangeText={setJenisKelamin}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Hubungan"
          value={hubungan}
          onChangeText={setHubungan}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Agama"
          value={agama}
          onChangeText={setAgama}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Pendidikan"
          value={pendidikan}
          onChangeText={setPendidikan}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Pekerjaan"
          value={pekerjaan}
          onChangeText={setPekerjaan}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Status Perkawinan"
          value={statusPerkawinan}
          onChangeText={setPerkawinan}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Nama Ayah"
          value={namaAyah}
          onChangeText={setNamaAyah}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Nama Ibu"
          value={namaIbu}
          onChangeText={setNamaIbu}
          placeholderTextColor="#606C38"
        />
        <Pressable 
          style={styles.linkButton}
          onPress={handleAddAnggota}
        >
          <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
            <Feather name={isEditMode ? "edit" : "plus"} size={14} color="#FFFCEA" />
          </View>
          <Text style={styles.linkButtonText}>{isEditMode ? "Update Anggota Keluarga" : "Simpan Anggota Keluarga"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
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
    emptyState: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
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
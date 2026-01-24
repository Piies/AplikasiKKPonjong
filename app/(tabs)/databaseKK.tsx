import { Text, TextInput, View, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import Feather from "@expo/vector-icons/Feather";
import AccordionKK from "@/components/AccordionKK";
import { Link, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { KartuKeluargaWithAnggota, AnggotaKeluarga } from "@/types/database";

export default function DatabaseKK() {
  const db = useSQLiteContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<KartuKeluargaWithAnggota[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build search query
      let kartuKeluargaQuery = 'SELECT * FROM kartuKeluarga';
      const searchParams: string[] = [];
      
      if (searchQuery.trim()) {
        kartuKeluargaQuery += ' WHERE nomorKK LIKE ? OR namaKepalaKeluarga LIKE ? OR alamat LIKE ?';
        const searchTerm = `%${searchQuery.trim()}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      kartuKeluargaQuery += ' ORDER BY id DESC';
      
      // Fetch all kartuKeluarga
      const kartuKeluargaList = await db.getAllAsync<any>(kartuKeluargaQuery, searchParams);
      
      // Fetch all anggotaKeluarga
      const anggotaKeluargaList = await db.getAllAsync<any>('SELECT * FROM anggotaKeluarga');
      
      // Map database columns to type structure and combine data
      const combinedData: KartuKeluargaWithAnggota[] = kartuKeluargaList.map((kk: any) => {
        // Map anggotaKeluarga for this kartuKeluarga
        const anggotaList: AnggotaKeluarga[] = anggotaKeluargaList
          .filter((anggota: any) => anggota.idKK === kk.id)
          .map((anggota: any) => ({
            id: anggota.id,
            kartuKeluargaId: anggota.idKK,
            nik: anggota.nik,
            nama: anggota.nama,
            tempatLahir: anggota.tempatLahir || undefined,
            tanggalLahir: anggota.tanggalLahir || undefined,
            jenisKelamin: anggota.jenisKelamin as 'L' | 'P',
            hubungan: anggota.hubungan || undefined,
            agama: anggota.agama || undefined,
            pendidikan: anggota.pendidikan || undefined,
            pekerjaan: anggota.pekerjaan || undefined,
            statusPerkawinan: anggota.statusPerkawinan || undefined,
            namaAyah: anggota.namaAyah || undefined,
            namaIbu: anggota.namaIbu || undefined,
            createdAt: anggota.createdAt || undefined,
            updatedAt: anggota.updatedAt || undefined,
          }));
        
        return {
          id: kk.id,
          nomorKK: kk.nomorKK,
          namaKepalaKeluarga: kk.namaKepalaKeluarga,
          alamat: kk.alamat,
          rt: kk.rukunTetangga || undefined,
          rw: kk.rukunWarga || undefined,
          kelurahan: kk.kelurahan || undefined,
          kecamatan: kk.kecamatan || undefined,
          kota: kk.kota || undefined,
          provinsi: kk.provinsi || undefined,
          createdAt: kk.createdAt || undefined,
          updatedAt: kk.updatedAt || undefined,
          anggotaKeluarga: anggotaList.length > 0 ? anggotaList : undefined,
        };
      });
      
      setData(combinedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [db, searchQuery]);

  // Fetch data on mount and when search query changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data when screen comes into focus (e.g., after adding new data)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Handler for adding new anggota keluarga
  const handleAddAnggota = (kartuKeluargaId: number) => {
    router.push(`/(tabs)/tambahAnggota?id=${kartuKeluargaId}`);
  };

  // Handler for viewing detail
  const handleViewDetail = (kartuKeluargaId: number) => {
    router.push(`/(tabs)/detailKK?id=${kartuKeluargaId}`);
  };

  // Handler for editing Kartu Keluarga
  const handleEdit = (kartuKeluargaId: number) => {
    router.push(`/(tabs)/tambahKK?editId=${kartuKeluargaId}`);
  };

  return (
    <View style={styles.container}>
      <View style={{width: '90%', flexDirection:"row", alignItems:"center", gap:8 }}>
        <View style={styles.searchInput}>
          <TextInput
            style={{
              flex: 1,
              fontSize: 12,
            }}
            placeholder="Pencarian (Nomor KK, Nama Kepala Keluarga)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          <Feather name="search" size={16} color={'#111827'}/>
        </View>
        <Link href={'/tambahKK'} style={{
            backgroundColor:'#BC6C25', 
            paddingHorizontal:12, 
            paddingVertical:8, 
            borderRadius: 16, 
            color:'#FFFCEA',
            fontWeight:"bold",
          }}>
          Tambah KK
        </Link>
      </View>
      <ScrollView 
        style={{width:'90%'}}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#BC6C25" />
            <Text style={styles.emptyText}>Memuat data...</Text>
          </View>
        ) : data.length > 0 ? (
          data.map((kk) => (
            <AccordionKK
              key={kk.id}
              kartuKeluarga={kk}
              onAddAnggota={handleAddAnggota}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Tidak ada data ditemukan</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  searchInput: {
    flex:1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F1F1F1',
    color: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
});
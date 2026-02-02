import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import AccordionKK from "@/components/AccordionKK";
import { AnggotaKeluarga, KartuKeluargaWithAnggota } from "@/types/database";
import Feather from "@expo/vector-icons/Feather";
import { Link, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

export default function DatabaseKK() {
  const db = useSQLiteContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<KartuKeluargaWithAnggota[]>([]);
  const [loading, setLoading] = useState(true);
  const [jumlahPenduduk, setJumlahPenduduk] = useState(0);
  const [jumlahKK, setJumlahKK] = useState(0);
  const [jumlahPundudukLelaki, setJumlahPundudukLelaki] = useState(0);
  const [jumlahPundudukPerempuan, setJumlahPundudukPerempuan] = useState(0);

  const fetchStatistik = useCallback(async () => {
    try {
      // 1. Use 'AS total' (or any name) so we can access the value easily
      const resPenduduk = await db.getFirstAsync<{ total: number }>('SELECT COUNT(nik) as total FROM anggotaKeluarga');
      const resKK = await db.getFirstAsync<{ total: number }>('SELECT COUNT(nomorKK) as total FROM kartuKeluarga');
      const resLaki = await db.getFirstAsync<{ total: number }>('SELECT COUNT(nik) as total FROM anggotaKeluarga WHERE jenisKelamin = "L"');
      const resPerempuan = await db.getFirstAsync<{ total: number }>('SELECT COUNT(nik) as total FROM anggotaKeluarga WHERE jenisKelamin = "P"');
      
      // 2. Access the '.total' property. Use optional chaining and default to 0.
      setJumlahPenduduk(resPenduduk?.total ?? 0);
      setJumlahKK(resKK?.total ?? 0);
      setJumlahPundudukLelaki(resLaki?.total ?? 0);
      setJumlahPundudukPerempuan(resPerempuan?.total ?? 0);
    } catch (error) {
      console.error('Error fetching statistik:', error);
    }
  }, [db]);

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
    fetchStatistik(); // <--- Add this
  }, [fetchData, fetchStatistik]); // <--- Add fetchStatistik to dependency array

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchStatistik(); // <--- Add this
    }, [fetchData, fetchStatistik])
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
      <View style={{width: '90%'}}>
        <Text style={styles.textStatistik}>Jumlah KK: {jumlahKK}</Text>
        <Text style={styles.textStatistik}>Jumlah Penduduk: {jumlahPenduduk}</Text>
        <Text style={styles.textStatistik}>Jumlah Laki-laki: {jumlahPundudukLelaki}</Text>
        <Text style={styles.textStatistik}>Jumlah Perempuan: {jumlahPundudukPerempuan}</Text>
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
    gap: 16,
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
  textStatistik: {
    fontSize: 14,
    color: '#0A0A0A',
    textAlign: 'left',
    fontWeight: 'bold',
  },
});
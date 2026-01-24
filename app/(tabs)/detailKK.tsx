import { Text, View, StyleSheet, Dimensions, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect, useCallback } from 'react';
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import CardAnggota from "@/components/CardAnggota";
import Feather from "@expo/vector-icons/Feather";
import { useSQLiteContext } from "expo-sqlite";
import { KartuKeluarga, AnggotaKeluarga } from "@/types/database";

export default function DetailKK() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kartuKeluargaId = id ? parseInt(id, 10) : null;
  
  const [kartuKeluarga, setKartuKeluarga] = useState<KartuKeluarga | null>(null);
  const [filteredAnggota, setFilteredAnggota] = useState<AnggotaKeluarga[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from database
  const fetchData = useCallback(async () => {
    if (!kartuKeluargaId) return;
    
    try {
      setLoading(true);
      
      // Fetch kartuKeluarga
      const kk = await db.getFirstAsync<any>(
        'SELECT * FROM kartuKeluarga WHERE id = ?',
        [kartuKeluargaId]
      );
      
      if (kk) {
        // Map database columns to type structure
        const mappedKK: KartuKeluarga = {
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
        };
        setKartuKeluarga(mappedKK);
      } else {
        setKartuKeluarga(null);
      }
      
      // Fetch anggotaKeluarga for this kartuKeluarga
      const anggotaList = await db.getAllAsync<any>(
        'SELECT * FROM anggotaKeluarga WHERE idKK = ?',
        [kartuKeluargaId]
      );
      
      // Map database columns to type structure
      const mappedAnggota: AnggotaKeluarga[] = anggotaList.map((anggota: any) => ({
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
      
      setFilteredAnggota(mappedAnggota);
    } catch (error) {
      console.error('Error fetching data:', error);
      setKartuKeluarga(null);
      setFilteredAnggota([]);
    } finally {
      setLoading(false);
    }
  }, [db, kartuKeluargaId]);

  // Fetch data on mount and when kartuKeluargaId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAddAnggota = (kartuKeluargaId: number) => {
    router.push(`/(tabs)/tambahAnggota?id=${kartuKeluargaId}`);
  };

  const handleEditAnggota = (anggotaId: number) => {
    router.push(`/(tabs)/tambahAnggota?editId=${anggotaId}&id=${kartuKeluargaId}`);
  };

  // Handler for deleting anggota keluarga
  const handleDeleteAnggota = async (anggotaId: number) => {
    Alert.alert(
      'Hapus Anggota Keluarga',
      'Apakah Anda yakin ingin menghapus anggota keluarga ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM anggotaKeluarga WHERE id = ?', [anggotaId]);
              console.log('Anggota Keluarga berhasil dihapus');
              // Refresh data
              fetchData();
            } catch (error) {
              console.error('Error deleting Anggota Keluarga:', error);
              Alert.alert('Error', 'Gagal menghapus anggota keluarga. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  // Handler for deleting Kartu Keluarga
  const handleDeleteKK = async (kartuKeluargaId: number) => {
    Alert.alert(
      'Hapus Kartu Keluarga',
      'Apakah Anda yakin ingin menghapus kartu keluarga ini? Semua anggota keluarga juga akan dihapus.',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all anggota keluarga first (foreign key constraint)
              await db.runAsync('DELETE FROM anggotaKeluarga WHERE idKK = ?', [kartuKeluargaId]);
              // Then delete the kartu keluarga
              await db.runAsync('DELETE FROM kartuKeluarga WHERE id = ?', [kartuKeluargaId]);
              console.log('Kartu Keluarga berhasil dihapus');
              // Navigate back to database list
              router.back();
            } catch (error) {
              console.error('Error deleting Kartu Keluarga:', error);
              Alert.alert('Error', 'Gagal menghapus kartu keluarga. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#BC6C25" />
          <Text style={styles.emptyText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  if (!kartuKeluargaId || !kartuKeluarga) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Kartu Keluarga tidak ditemukan</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>{kartuKeluarga.namaKepalaKeluarga}</Text>
        <Text style={styles.headerSubtitle}>No. KK: {kartuKeluarga.nomorKK}</Text>
        <Text style={styles.headerAddress}>{kartuKeluarga.alamat}</Text>
      </View>
      <ScrollView 
        style={{width:'90%'}}
        contentContainerStyle={{ paddingBottom: 20, gap:8 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredAnggota.length > 0 ? (
          filteredAnggota.map((a) => (
            <CardAnggota
              key={a.id}
              anggotaKeluarga={a}
              onDeleteAnggota={handleDeleteAnggota}
              onEditAnggota={handleEditAnggota}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Belum ada anggota keluarga</Text>
          </View>
        )}
        <Pressable 
          style={styles.linkButton}
          onPress={() => handleAddAnggota?.(kartuKeluarga.id)}
        >
          <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
            <Feather name="plus" size={14} color="#FFFCEA" />
          </View>
          <Text style={styles.linkButtonText}>{"Tambah Anggota Keluarga"}</Text>
        </Pressable>
        <Pressable 
          style={styles.linkButton}
          onPress={() => router.push(`/(tabs)/tambahKK?editId=${kartuKeluargaId}`)}
        >
          <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
            <Feather name="edit" size={14} color="#FFFCEA" />
          </View>
          <Text style={styles.linkButtonText}>{"Edit Kartu Keluarga"}</Text>
        </Pressable>
        <Pressable 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#791009',
            paddingVertical: 8,
            borderRadius: 32,
            gap: 8,
            flex:1,
          }}
          onPress={() => handleDeleteKK?.(kartuKeluargaId)}
        >
          <Feather name="trash" size={18} color="#FFFCEA" />
          <Text style={styles.linkButtonText}>{"Hapus Kartu Keluarga"}</Text>
        </Pressable>
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
  headerInfo: {
    width: '90%',
    padding: 16,
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0A0A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  headerAddress: {
    fontSize: 13,
    color: '#6B7280',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDA15E',
    paddingVertical: 8,
    borderRadius: 32,
    gap: 8,
    flex:1,
  },
  linkButtonText: {
    fontSize: 14,
    color: '#FFFCEA',
  },
});
import { Text, TextInput, View, StyleSheet, Dimensions, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import Feather from "@expo/vector-icons/Feather";
import DeleteReasonModal from "@/components/DeleteReasonModal";
import { Link, router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Sppt } from "@/types/database";
import CardSppt from "@/components/CardSppt";

type DeleteTarget = { type: 'sppt'; id: number; noTerkait: string; namaTerkait: string } | null;

export default function DatabaseSppt() {
  const db = useSQLiteContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<Sppt[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  // Fetch data from database
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build search query
      let SpptQuery = 'SELECT * FROM SPPT';
      const searchParams: string[] = [];
      
      if (searchQuery.trim()) {
        SpptQuery += ' WHERE nopd LIKE ? OR namaWp LIKE ? OR alamatWp LIKE ?';
        const searchTerm = `%${searchQuery.trim()}%`;
        searchParams.push(searchTerm, searchTerm, searchTerm);
      }
      
      SpptQuery += ' ORDER BY id DESC';
      
      // Fetch all Sppt
      const SpptList = await db.getAllAsync<any>(SpptQuery, searchParams);
        
      const formattedData: Sppt[] = SpptList.map((item: any) => ({
        id: item.id,
        namaWp: item.namaWp,
        nopd: item.nopd,
        alamatWp: item.alamatWp || undefined,
        rtWp: item.rtWp || undefined,
        rwWp: item.rwWp || undefined, // Assumed mandatory based on interface
        totalWp: item.totalWp,
        createdAt: item.createdAt || undefined,
        updatedAt: item.updatedAt || undefined,
      }));
      
      setData(formattedData);
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
  const handleAddSppt = (SpptId: number) => {
    router.push(`/(tabs)/tambahSppt?id=${SpptId}`);
  };

  // Handler for edit sppt
  const handleEditSppt = (SpptId: number) => {
    router.push(`/(tabs)/tambahSppt?editId=${SpptId}`);
  };

  // Handler for delete sppt - opens modal for reason
  const handleDeleteSppt = (sppt: Sppt) => {
    setDeleteTarget({
      type: 'sppt',
      id: sppt.id,
      noTerkait: sppt.nopd || '',
      namaTerkait: sppt.namaWp || '',
    });
  };

  const handleDeleteConfirm = async (alasan: string) => {
    if (!deleteTarget) return;
    try {
      await db.runAsync(
        'INSERT INTO logPenghapusan (tipe, idTerkait, noTerkait, namaTerkait, alasan) VALUES (?, ?, ?, ?, ?)',
        [deleteTarget.type, deleteTarget.id, deleteTarget.noTerkait, deleteTarget.namaTerkait, alasan]
      );
      await db.runAsync('DELETE FROM sppt WHERE id = ?', [deleteTarget.id]);
      console.log('SPPT berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting SPPT:', error);
      Alert.alert('Error', 'Gagal menghapus SPPT. Silakan coba lagi.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <DeleteReasonModal
        visible={!!deleteTarget}
        title="Hapus SPPT"
        message="Apakah Anda yakin ingin menghapus SPPT ini? Silakan masukkan alasan penghapusan."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <View style={{width: '90%', flexDirection:"row", alignItems:"center", gap:8 }}>
        <View style={styles.searchInput}>
          <TextInput
            style={{
              flex: 1,
              fontSize: 12,
            }}
            placeholder="Pencarian (NOPD, Nama, Alamat)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          <Feather name="search" size={16} color={'#111827'}/>
        </View>
        <Link href={'/tambahSppt'} style={{
            backgroundColor:'#BC6C25', 
            paddingHorizontal:12, 
            paddingVertical:8, 
            borderRadius: 16, 
            color:'#FFFCEA',
            fontWeight:"bold",
          }}>
          Tambah SPPT
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
          data.map((sppt) => (
            <CardSppt
              key={sppt.id}
              sppt={sppt}
              onDeleteSppt={handleDeleteSppt}
              onEditSppt={handleEditSppt}
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
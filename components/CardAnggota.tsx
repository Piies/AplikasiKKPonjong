import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Link, Href } from 'expo-router';
import { AnggotaKeluarga } from '@/types/database';

type Props = {
  anggotaKeluarga: AnggotaKeluarga;
  onDeleteAnggota?: (anggotaId: number) => void;
  onEditAnggota?: (anggotaId: number) => void;
};

export default function CardAnggota({ anggotaKeluarga, onDeleteAnggota, onEditAnggota}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Format content text from the row data
  const formatContent = (a: AnggotaKeluarga): string => {
    const lines = [
      `NIK: ${a.nik}`,
      `Nama: ${a.nama}`,
      a.jenisKelamin ? `Jenis Kelamin: ${a.jenisKelamin}` : '',
      a.tempatLahir ? `Tempat Lahir: ${a.tempatLahir}` : '',
      a.tanggalLahir ? `Tanggal Lahir: ${a.tanggalLahir}` : '',
      a.hubungan ? `Hubungan: ${a.hubungan}` : '',
      a.agama ? `Agama: ${a.agama}` : '',
      a.pendidikan ? `Pendidikan: ${a.pendidikan}` : '',
      a.pekerjaan ? `Pekerjaan: ${a.pekerjaan}` : '',
      a.statusPerkawinan ? `Status Perkawinan: ${a.statusPerkawinan}` : '',
      'Kewarganegaraan: WNI',
      a.namaAyah ? `Nama Ayah: ${a.namaAyah}` : '',
      a.namaIbu ? `Nama Ibu: ${a.namaIbu}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View>
          <Text style={styles.title}>{anggotaKeluarga.nama}</Text>
          <Text style={{fontSize:14, color:'#8F8F8F'}}>NIK: {anggotaKeluarga.nik}</Text>
        </View>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#0A0A0A"
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.content}>
          <Text style={styles.contentText}>{formatContent(anggotaKeluarga)}</Text>
          <Pressable 
            style={styles.editButton}
            onPress={() => onEditAnggota?.(anggotaKeluarga.id)}
          >
            <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
              <Feather name="edit" size={14} color="#FFFCEA" />
            </View>
            <Text style={styles.linkButtonText}>{"Edit Anggota Keluarga"}</Text>
          </Pressable>
          <Pressable 
            style={styles.linkButton}
            onPress={() => onDeleteAnggota?.(anggotaKeluarga.id)}
          >
            <Feather name="trash" size={18} color="#FFFCEA" />
            <Text style={styles.linkButtonText}>{"Hapus Anggota Keluarga"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FCFCFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginVertical: 8,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F1F1F1',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0A0A',
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDA15E',
    paddingVertical: 8,
    borderRadius: 32,
    gap: 8,
    flex:1,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#791009',
    paddingVertical: 8,
    borderRadius: 32,
    gap: 8,
    flex:1,
  },
  linkButtonText: {
    fontSize: 14,
    color: '#FFFCEA',
  },
  anggotaSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  anggotaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A0A0A',
    marginBottom: 8,
  },
  anggotaList: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
});


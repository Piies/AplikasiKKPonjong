import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Link, Href } from 'expo-router';
import { KartuKeluargaWithAnggota, AnggotaKeluarga } from '@/types/database';

type Props = {
  kartuKeluarga: KartuKeluargaWithAnggota;
  onAddAnggota?: (kartuKeluargaId: number) => void;
  onViewDetail?: (kartuKeluargaId: number) => void;
  onEdit?: (kartuKeluargaId: number) => void;
};

export default function AccordionKK({ kartuKeluarga, onAddAnggota, onViewDetail, onEdit }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Format content text from the row data
  const formatContent = (kk: KartuKeluargaWithAnggota): string => {
    const lines = [
      `No. KK: ${kk.nomorKK}`,
      `Alamat: ${kk.alamat}`,
      kk.rt && kk.rw ? `RT/RW: ${kk.rt}/${kk.rw}` : '',
      kk.kelurahan ? `Kelurahan: ${kk.kelurahan}` : '',
      kk.kecamatan ? `Kecamatan: ${kk.kecamatan}` : '',
      kk.kota ? `Kota/Kabupaten: ${kk.kota}` : '',
      kk.provinsi ? `Provinsi: ${kk.provinsi}` : '',
    ].filter(Boolean);
    return lines.join('\n');
  };

  // Format anggota list for display
  const formatAnggotaList = (anggota: AnggotaKeluarga[]): string => {
    if (!anggota || anggota.length === 0) {
      return 'Belum ada anggota keluarga';
    }
    return anggota
      .map((a, index) => `${index + 1}. ${a.nama} (${a.hubungan})`)
      .join('\n');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View>
          <Text style={styles.title}>{kartuKeluarga.namaKepalaKeluarga}</Text>
          <Text style={{fontSize:14, color:'#8F8F8F'}}>No.KK: {kartuKeluarga.nomorKK}</Text>
        </View>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#0A0A0A"
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.content}>
          <Text style={styles.contentText}>{formatContent(kartuKeluarga)}</Text>
          
          {/* Display anggota keluarga if available */}
          {kartuKeluarga.anggotaKeluarga && kartuKeluarga.anggotaKeluarga.length > 0 && (
            <View style={styles.anggotaSection}>
              <Text style={styles.anggotaTitle}>Anggota Keluarga:</Text>
              <Text style={styles.anggotaList}>
                {formatAnggotaList(kartuKeluarga.anggotaKeluarga)}
              </Text>
            </View>
          )}
          
          <View style={{flexDirection:'row', gap:12,}}>
            <Pressable 
              style={styles.linkButton}
              onPress={() => onAddAnggota?.(kartuKeluarga.id)}
            >
              <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
                <Feather name="plus" size={14} color="#FFFCEA" />
              </View>
              <Text style={styles.linkButtonText}>{"Tambah Anggota Keluarga"}</Text>
            </Pressable>
            <Pressable onPress={() => onEdit?.(kartuKeluarga.id)}>
              <Feather name='edit' size={32} color={'#BC6C25'}/>
            </Pressable>
            <Pressable onPress={() => onViewDetail?.(kartuKeluarga.id)}>
              <Feather name='info' size={32} color={'#8F8F8F'}/>
            </Pressable>
          </View>
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


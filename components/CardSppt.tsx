import { Sppt } from '@/types/database';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  sppt: Sppt;
  onDeleteSppt?: (sppt: Sppt) => void;
  onEditSppt?: (SpptId: number) => void;
};

export default function CardSppt({sppt, onDeleteSppt, onEditSppt}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View>
          <Text style={styles.title}>{sppt.namaWp ?? '-'}</Text>
          <Text style={{fontSize:14, color:'#8F8F8F'}}>NOPD: {sppt.nopd ?? '-'}</Text>
        </View>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#0A0A0A"
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={styles.content}>
          <View>
            <Text style={styles.contentText}>
              NOPD: {sppt.nopd ?? '-'}
            </Text>
            <Text style = {styles.contentSectHead}>
              Nama Wajib Pajak
            </Text>
            <Text style={styles.contentText}>
              Nama Wajib Pajak: {sppt.namaWp}
            </Text>
            <Text style = {styles.contentSectHead}>
              Letak Wajib Pajak
            </Text>
            <Text style={styles.contentText}>
              Alamat: {sppt.alamatWp}
            </Text>
            <Text style={styles.contentText}>
              RT: {sppt.rtWp}
            </Text>
            <Text style={styles.contentText}>
              RW: {sppt.rwWp}
            </Text>
            <Text style = {styles.contentSectHead}>
              PBB-P2 Yang Harus Dibayar (Rp)
            </Text>
            <Text style={styles.contentText}>
              Total Harus Dibayar: {sppt.totalWp}
            </Text>
          </View>
          <Pressable 
            style={styles.editButton}
            onPress={() => onEditSppt?.(sppt.id)}
          >
            <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
              <Feather name="edit" size={14} color="#FFFCEA" />
            </View>
            <Text style={styles.linkButtonText}>{"Edit SPPT"}</Text>
          </Pressable>
          <Pressable 
            style={styles.linkButton}
            onPress={() => onDeleteSppt?.(sppt)}
          >
            <Feather name="trash" size={18} color="#FFFCEA" />
            <Text style={styles.linkButtonText}>{"Hapus SPPT"}</Text>
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
    color: '#283618',
    lineHeight: 20,
  },
  contentSectHead: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#283618',
    lineHeight: 22,
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


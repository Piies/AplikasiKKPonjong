import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView, Pressable, Modal, Alert, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Dropdown } from 'react-native-element-dropdown';
import Feather from '@expo/vector-icons/Feather';
import { KartuKeluargaWithAnggota } from '@/types/database';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as MailComposer from 'expo-mail-composer';

type ExportType = 'one' | 'all';
type ExportDestination = 'local' | 'gmail';
type ExportFormat = 'excel' | 'pdf';

interface KKOption {
  label: string;
  value: number;
}

export default function ExportData() {
  const db = useSQLiteContext();
  const [exportType, setExportType] = useState<ExportType | null>(null);
  const [selectedKK, setSelectedKK] = useState<number | null>(null);
  const [kkOptions, setKkOptions] = useState<KKOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [exportDestination, setExportDestination] = useState<ExportDestination | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingKK, setLoadingKK] = useState(false);

  // Fetch KK list for dropdown
  const fetchKKList = useCallback(async () => {
    try {
      setLoadingKK(true);
      const kkList = await db.getAllAsync<any>(
        'SELECT id, nomorKK, namaKepalaKeluarga FROM kartuKeluarga ORDER BY namaKepalaKeluarga ASC'
      );
      
      const options: KKOption[] = kkList.map((kk: any) => ({
        label: `${kk.nomorKK} - ${kk.namaKepalaKeluarga}`,
        value: kk.id,
      }));
      
      setKkOptions(options);
    } catch (error) {
      console.error('Error fetching KK list:', error);
      Alert.alert('Error', 'Gagal memuat daftar Kartu Keluarga');
    } finally {
      setLoadingKK(false);
    }
  }, [db]);

  useEffect(() => {
    fetchKKList();
  }, [fetchKKList]);

  // Fetch data based on selection
  const fetchData = useCallback(async (): Promise<KartuKeluargaWithAnggota[]> => {
    try {
      let query = 'SELECT * FROM kartuKeluarga';
      const params: any[] = [];
      
      if (exportType === 'one' && selectedKK) {
        query += ' WHERE id = ?';
        params.push(selectedKK);
      }
      
      query += ' ORDER BY id DESC';
      
      const kartuKeluargaList = await db.getAllAsync<any>(query, params);
      const anggotaKeluargaList = await db.getAllAsync<any>('SELECT * FROM anggotaKeluarga');
      
      const combinedData: KartuKeluargaWithAnggota[] = kartuKeluargaList.map((kk: any) => {
        const anggotaList = anggotaKeluargaList
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
      
      return combinedData;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }, [db, exportType, selectedKK]);

  // Generate CSV/Excel content
  const generateCSV = (data: KartuKeluargaWithAnggota[]): string => {
    let csv = 'Nomor KK,Nama Kepala Keluarga,Alamat,RT,RW,Kelurahan,Kecamatan,Kota,Provinsi';
    csv += ',NIK,Nama Anggota,Tempat Lahir,Tanggal Lahir,Jenis Kelamin,Hubungan,Agama,Pendidikan,Pekerjaan,Status Perkawinan,Nama Ayah,Nama Ibu\n';
    
    data.forEach((kk) => {
      const baseInfo = [
        `"${kk.nomorKK}"`,
        `"${kk.namaKepalaKeluarga}"`,
        `"${kk.alamat || ''}"`,
        `"${kk.rt || ''}"`,
        `"${kk.rw || ''}"`,
        `"${kk.kelurahan || ''}"`,
        `"${kk.kecamatan || ''}"`,
        `"${kk.kota || ''}"`,
        `"${kk.provinsi || ''}"`,
      ].join(',');
      
      if (kk.anggotaKeluarga && kk.anggotaKeluarga.length > 0) {
        kk.anggotaKeluarga.forEach((anggota) => {
          csv += baseInfo + ',' + [
            `"${anggota.nik || ''}"`,
            `"${anggota.nama || ''}"`,
            `"${anggota.tempatLahir || ''}"`,
            `"${anggota.tanggalLahir || ''}"`,
            `"${anggota.jenisKelamin || ''}"`,
            `"${anggota.hubungan || ''}"`,
            `"${anggota.agama || ''}"`,
            `"${anggota.pendidikan || ''}"`,
            `"${anggota.pekerjaan || ''}"`,
            `"${anggota.statusPerkawinan || ''}"`,
            `"${anggota.namaAyah || ''}"`,
            `"${anggota.namaIbu || ''}"`,
          ].join(',') + '\n';
        });
      } else {
        csv += baseInfo + ',' + ',,,,,,,,,,\n';
      }
    });
    
    return csv;
  };

  // Generate PDF HTML
  const generatePDFHTML = (data: KartuKeluargaWithAnggota[]): string => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #283618; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #BC6C25; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .kk-header { background-color: #e8e8e8; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Data Kartu Keluarga</h1>
        <table>
          <thead>
            <tr>
              <th>Nomor KK</th>
              <th>Nama Kepala Keluarga</th>
              <th>Alamat</th>
              <th>RT/RW</th>
              <th>Kelurahan</th>
              <th>Kecamatan</th>
              <th>Kota</th>
              <th>Provinsi</th>
              <th>NIK</th>
              <th>Nama Anggota</th>
              <th>Jenis Kelamin</th>
              <th>Hubungan</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.forEach((kk) => {
      const baseInfo = [
        kk.nomorKK,
        kk.namaKepalaKeluarga,
        kk.alamat || '',
        `${kk.rt || ''}/${kk.rw || ''}`,
        kk.kelurahan || '',
        kk.kecamatan || '',
        kk.kota || '',
        kk.provinsi || '',
      ];
      
      if (kk.anggotaKeluarga && kk.anggotaKeluarga.length > 0) {
        kk.anggotaKeluarga.forEach((anggota) => {
          html += '<tr>';
          baseInfo.forEach((info) => {
            html += `<td>${info}</td>`;
          });
          html += `
            <td>${anggota.nik || ''}</td>
            <td>${anggota.nama || ''}</td>
            <td>${anggota.jenisKelamin || ''}</td>
            <td>${anggota.hubungan || ''}</td>
          </tr>`;
        });
      } else {
        html += '<tr>';
        baseInfo.forEach((info) => {
          html += `<td>${info}</td>`;
        });
        html += '<td></td><td></td><td></td><td></td></tr>';
      }
    });
    
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    return html;
  };

  // Handle export
  const handleExport = async () => {
    if (!exportDestination || !exportFormat) {
      Alert.alert('Error', 'Silakan pilih tujuan dan format ekspor');
      return;
    }

    if (exportType === 'one' && !selectedKK) {
      Alert.alert('Error', 'Silakan pilih Kartu Keluarga');
      return;
    }

    try {
      setLoading(true);
      const data = await fetchData();
      
      if (data.length === 0) {
        Alert.alert('Info', 'Tidak ada data untuk diekspor');
        setLoading(false);
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const fileName = exportType === 'one' 
        ? `KK_${data[0].nomorKK}_${timestamp}`
        : `Semua_KK_${timestamp}`;

			if (exportFormat === 'excel') {
				const csvContent = generateCSV(data);
				
				// 1. Create the file instance in the Cache directory
				// Note: ensure 'FileSystem.Paths.cache' is correct for your specific API version imports
				const file = new FileSystem.File(FileSystem.Paths.cache, `${fileName}.csv`);

				// 2. Create and Write content
				await file.create(); 
				await file.write(csvContent);

				// 3. GET THE URI DIRECTLY FROM THE FILE OBJECT
				// Do not manually type 'file://...' or use documentDirectory here.
				const fileUri = file.uri; 

				if (exportDestination === 'local') {
					if (await Sharing.isAvailableAsync()) {
						await Sharing.shareAsync(fileUri, {
							mimeType: 'text/csv',
							dialogTitle: 'Ekspor Data KK',
							UTI: 'public.comma-separated-values-text' 
						});
					} else {
						Alert.alert('Error', 'Fitur sharing tidak tersedia di perangkat ini');
					}
				} else if (exportDestination === 'gmail') {
					const isAvailable = await MailComposer.isAvailableAsync();
					if (isAvailable) {
						await MailComposer.composeAsync({
							subject: `Data Kartu Keluarga - ${fileName}`,
							body: 'Lampiran data Kartu Keluarga dalam format CSV/Excel',
							attachments: [fileUri],
						});
					} else {
						Alert.alert('Error', 'Email tidak tersedia di perangkat ini');
					}
				}
			} else if (exportFormat === 'pdf') {
        const html = generatePDFHTML(data);
        const { uri } = await Print.printToFileAsync({ html });
        
        if (exportDestination === 'local') {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Ekspor Data KK',
            });
          } else {
            Alert.alert('Error', 'Fitur sharing tidak tersedia di perangkat ini');
          }
        } else if (exportDestination === 'gmail') {
          const isAvailable = await MailComposer.isAvailableAsync();
          if (isAvailable) {
            await MailComposer.composeAsync({
              subject: `Data Kartu Keluarga - ${fileName}`,
              body: 'Lampiran data Kartu Keluarga dalam format PDF',
              attachments: [uri],
            });
          } else {
            Alert.alert('Error', 'Email tidak tersedia di perangkat ini');
          }
        }
      }

      closeModal();
      Alert.alert('Sukses', 'Data berhasil diekspor');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Gagal mengekspor data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    if (exportType === 'one' && !selectedKK) {
      Alert.alert('Error', 'Silakan pilih Kartu Keluarga terlebih dahulu');
      return;
    }
    // Reset selections when opening modal
    setExportDestination(null);
    setExportFormat(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    // Reset selections when closing modal
    setExportDestination(null);
    setExportFormat(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ekspor Data Kartu Keluarga</Text>
        
        {/* Export Type Dropdown */}
        <View style={styles.section}>
          <Text style={styles.label}>Pilih Tipe Ekspor</Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            data={[
              { label: 'Satu Kartu Keluarga', value: 'one' },
              { label: 'Semua Kartu Keluarga', value: 'all' },
            ]}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Pilih tipe ekspor"
            value={exportType}
            onChange={(item) => {
              setExportType(item.value);
              if (item.value === 'all') {
                setSelectedKK(null);
              }
            }}
            renderLeftIcon={() => (
              <Feather name="file-text" size={20} color="#283618" style={styles.icon} />
            )}
          />
        </View>

        {/* KK Selection Dropdown (only if one KK selected) */}
        {exportType === 'one' && (
          <View style={styles.section}>
            <Text style={styles.label}>Pilih Kartu Keluarga</Text>
            {loadingKK ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#BC6C25" />
                <Text style={styles.loadingText}>Memuat data...</Text>
              </View>
            ) : (
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={kkOptions}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Pilih Kartu Keluarga"
                value={selectedKK}
                onChange={(item) => setSelectedKK(item.value)}
                renderLeftIcon={() => (
                  <Feather name="users" size={20} color="#283618" style={styles.icon} />
                )}
              />
            )}
          </View>
        )}

        {/* Export Button */}
        {exportType && (exportType === 'all' || selectedKK) && (
          <Pressable style={styles.exportButton} onPress={openModal}>
            <Feather name="download" size={20} color="#FFFCEA" />
            <Text style={styles.exportButtonText}>Ekspor Data</Text>
          </Pressable>
        )}

        {/* Export Modal */}
        <Modal
          visible={showModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pilih Opsi Ekspor</Text>
                <Pressable onPress={closeModal}>
                  <Feather name="x" size={24} color="#283618" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Destination Selection */}
                <View style={styles.section}>
                  <Text style={styles.label}>Tujuan Ekspor</Text>
                  <View style={styles.optionRow}>
                    <Pressable
                      style={[
                        styles.optionButton,
                        exportDestination === 'local' && styles.optionButtonSelected,
                      ]}
                      onPress={() => setExportDestination('local')}
                    >
                      <Feather 
                        name="save" 
                        size={20} 
                        color={exportDestination === 'local' ? '#FFFCEA' : '#283618'} 
                      />
                      <Text
                        style={[
                          styles.optionText,
                          exportDestination === 'local' && styles.optionTextSelected,
                        ]}
                      >
                        Simpan Lokal
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.optionButton,
                        exportDestination === 'gmail' && styles.optionButtonSelected,
                      ]}
                      onPress={() => setExportDestination('gmail')}
                    >
                      <Feather 
                        name="mail" 
                        size={20} 
                        color={exportDestination === 'gmail' ? '#FFFCEA' : '#283618'} 
                      />
                      <Text
                        style={[
                          styles.optionText,
                          exportDestination === 'gmail' && styles.optionTextSelected,
                        ]}
                      >
                        Kirim via Email
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Format Selection */}
                <View style={styles.section}>
                  <Text style={styles.label}>Format File</Text>
                  <View style={styles.optionRow}>
                    <Pressable
                      style={[
                        styles.optionButton,
                        exportFormat === 'excel' && styles.optionButtonSelected,
                      ]}
                      onPress={() => setExportFormat('excel')}
                    >
                      <Feather 
                        name="file" 
                        size={20} 
                        color={exportFormat === 'excel' ? '#FFFCEA' : '#283618'} 
                      />
                      <Text
                        style={[
                          styles.optionText,
                          exportFormat === 'excel' && styles.optionTextSelected,
                        ]}
                      >
                        Excel (CSV)
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.optionButton,
                        exportFormat === 'pdf' && styles.optionButtonSelected,
                      ]}
                      onPress={() => setExportFormat('pdf')}
                    >
                      <Feather 
                        name="file-text" 
                        size={20} 
                        color={exportFormat === 'pdf' ? '#FFFCEA' : '#283618'} 
                      />
                      <Text
                        style={[
                          styles.optionText,
                          exportFormat === 'pdf' && styles.optionTextSelected,
                        ]}
                      >
                        PDF
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.modalButton,
                    styles.confirmButton,
                    (!exportDestination || !exportFormat) && styles.disabledButton,
                  ]}
                  onPress={handleExport}
                  disabled={!exportDestination || !exportFormat || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFCEA" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Ekspor</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    width: Dimensions.get('window').width,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: '10%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#283618',
    marginBottom: 32,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#283618',
    marginBottom: 8,
  },
  dropdown: {
    height: 50,
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#111827',
  },
  icon: {
    marginRight: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#F1F1F1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BC6C25',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFCEA',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#283618',
  },
  modalBody: {
    maxHeight: Dimensions.get('window').height * 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#BC6C25',
    borderColor: '#BC6C25',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#283618',
  },
  optionTextSelected: {
    color: '#FFFCEA',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#283618',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#BC6C25',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFCEA',
    fontSize: 16,
    fontWeight: '600',
  },
});

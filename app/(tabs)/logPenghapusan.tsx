import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";

type LogEntry = {
  id: number;
  tipe: string;
  idTerkait: number;
  noTerkait?: string | null;
  namaTerkait?: string | null;
  alasan: string;
  createdAt: string;
};

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function getTipeLabel(tipe: string): string {
  return tipe === 'anggota' ? 'Anggota Keluarga' : tipe === 'kk' ? 'Kartu Keluarga' : tipe === 'sppt' ? 'SPPT PBB P2' : '';
}

export default function LogPenghapusan() {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await db.getAllAsync<any>(
        'SELECT id, tipe, idTerkait, noTerkait, namaTerkait, alasan, createdAt FROM logPenghapusan ORDER BY id DESC'
      );
      setLogs(rows.map((r: any) => ({
        id: r.id,
        tipe: r.tipe || '',
        idTerkait: r.idTerkait,
        noTerkait: r.noTerkait,
        namaTerkait: r.namaTerkait,
        alasan: r.alasan || '',
        createdAt: r.createdAt,
      })));
    } catch (error) {
      console.error('Error fetching log penghapusan:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [fetchLogs])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#BC6C25" />
          <Text style={styles.emptyText}>Memuat log...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Log Penghapusan</Text>
        <Text style={styles.headerSubtitle}>
          Riwayat penghapusan Anggota Keluarga, Kartu Keluarga, dan SPPT
        </Text>
        <Text style={styles.headerSubtitle}>
          Untuk penghapusan riwayat penghapusan ini, silakan melakukan backup data dan kemudian install ulang aplikasi ini.
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>Belum ada data penghapusan</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[
                  styles.badge,
                  log.tipe === 'kk' ? styles.badgeKK : log.tipe === 'sppt' ? styles.badgeSppt : styles.badgeAnggota
                ]}>
                  <Text style={styles.badgeText}>
                    {getTipeLabel(log.tipe)}
                  </Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(log.createdAt)}</Text>
              </View>
              {(log.namaTerkait || log.noTerkait) ? (
                <Text style={styles.cardId}>
                  {log.namaTerkait && `${log.namaTerkait}`}
                  {log.namaTerkait && log.noTerkait && ' • '}
                  {log.noTerkait && (log.tipe === 'sppt' ? `NOPD: ${log.noTerkait}` : log.tipe === 'anggota' ? `NIK: ${log.noTerkait}` : `No. KK: ${log.noTerkait}`)}
                </Text>
              ) : (
                <Text style={styles.cardId}>ID: {log.idTerkait}</Text>
              )}
              <Text style={styles.cardAlasan}>{log.alasan}</Text>
            </View>
          ))
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
    paddingTop: '5%',
    width: Dimensions.get('window').width,
  },
  header: {
    width: '90%',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0A0A0A',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    width: '90%',
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeAnggota: {
    backgroundColor: '#D1FAE5',
  },
  badgeKK: {
    backgroundColor: '#FEE2E2',
  },
  badgeSppt: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  cardDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  cardId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardAlasan: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

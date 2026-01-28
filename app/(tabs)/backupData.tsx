import Feather from "@expo/vector-icons/Feather";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from "react-native";
import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Format bytes to human readable format
const formatBytes = (bytes: number | null): string => {
  if (bytes === null || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function BackupData() {
  const db = useSQLiteContext();
  const [databaseSize, setDatabaseSize] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const TABLE_KK_ONLY = ['kartuKeluarga', 'anggotaKeluarga'];
  const TABLE_ALL = ['kartuKeluarga', 'anggotaKeluarga', 'sppt', 'userData'];

  const escapeValue = (value: any) => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    // Escape single quotes in strings
    const safe = String(value).replace(/'/g, "''");
    return `'${safe}'`;
  };

  const generateSqlDumpForTables = async (tables: string[]) => {
    let dump = `-- Backup generated at ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      // Get CREATE TABLE statement
      const schemaRow = await db.getFirstAsync<any>(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table]
      );

      // Get column info
      const columnsInfo = await db.getAllAsync<any>(`PRAGMA table_info(${table})`);
      const columnNames = columnsInfo.map((c: any) => c.name);

      dump += `--\n-- Dumping data for table \`${table}\`\n--\n\n`;

      // Get all rows
      const rows = await db.getAllAsync<any>(`SELECT * FROM ${table}`);
      for (const row of rows) {
        const values = columnNames.map((col: string) => escapeValue(row[col]));
        dump += `INSERT INTO ${table} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
      }

      dump += '\n';
    }

    return dump;
  };

  const createAndShareBackup = async (tables: string[], filename: string) => {
    try {
      setIsBackingUp(true);

      const sqlDump = await generateSqlDumpForTables(tables);

      const backupDir = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '');
      const fileUri = `${backupDir}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, sqlDump, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Backup selesai',
          `File cadangan telah dibuat di:\n${fileUri}`
        );
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/sql',
        dialogTitle: 'Bagikan file cadangan SQL',
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Gagal membuat cadangan', 'Terjadi kesalahan saat membuat file cadangan.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const restoreFromBackup = async (tables: string[]) => {
    try {
      setIsRestoring(true);

      // Load document picker at runtime to avoid hard dependency in types
      const DocumentPicker = require('expo-document-picker') as any;

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/sql', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = 'assets' in result && result.assets && result.assets.length > 0
        ? result.assets[0]
        : (result as any);

      const fileUri = asset.uri;
      console.log('Reading backup file from:', fileUri);

      const sql = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log('Backup file size:', sql.length, 'characters');
      console.log('First 500 chars of backup:', sql.substring(0, 500));

      // Start a transaction for atomic restore
      await db.execAsync('BEGIN TRANSACTION;');

      try {
        // Clear existing data from tables being restored (in reverse order to respect foreign keys)
        // anggotaKeluarga should be deleted before kartuKeluarga due to foreign key relationship
        const deleteOrder = ['anggotaKeluarga', 'kartuKeluarga', 'sppt', 'userData'];
        for (const table of deleteOrder) {
          if (tables.includes(table)) {
            console.log(`Clearing existing data from table: ${table}`);
            await db.execAsync(`DELETE FROM ${table};`);
          }
        }

        // Parse SQL statements more carefully
        // Split by semicolon, but handle multi-line statements
        const lines = sql.split('\n');
        let currentStatement = '';
        const statements: string[] = [];

        for (const line of lines) {
          const trimmed = line.trim();
          // Skip empty lines and comments
          if (trimmed.length === 0 || trimmed.startsWith('--')) {
            continue;
          }
          
          currentStatement += (currentStatement ? ' ' : '') + trimmed;
          
          // If line ends with semicolon, we have a complete statement
          if (trimmed.endsWith(';')) {
            statements.push(currentStatement);
            currentStatement = '';
          }
        }

        // Add any remaining statement (in case file doesn't end with semicolon)
        if (currentStatement.trim().length > 0) {
          statements.push(currentStatement);
        }

        console.log(`Found ${statements.length} potential SQL statements`);

        let insertedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i].trim();
          
          // Remove trailing semicolon if present (we'll add it back)
          const cleanStatement = statement.replace(/;$/, '');
          
          if (cleanStatement.length === 0) {
            continue;
          }

          // Only run INSERT statements, and only for the requested tables
          const insertMatch = cleanStatement.match(/^INSERT\s+INTO\s+["`']?(\w+)["`']?/i);
          if (!insertMatch) {
            skippedCount++;
            continue;
          }
          
          const tableName = insertMatch[1];
          console.log(`Found INSERT statement for table: ${tableName}`);
          
          if (!tables.includes(tableName)) {
            console.log(`Skipping table ${tableName} (not in restore list)`);
            skippedCount++;
            continue;
          }

          try {
            // Execute the statement with semicolon
            const sqlToExecute = cleanStatement + ';';
            console.log(`Executing statement ${i + 1}/${statements.length} for ${tableName}`);
            await db.execAsync(sqlToExecute);
            insertedCount++;
          } catch (stmtError: any) {
            errorCount++;
            console.error(`Error executing statement ${i + 1} for table ${tableName}:`, stmtError);
            console.error(`Statement was: ${cleanStatement.substring(0, 200)}...`);
            // Continue with other statements even if one fails
          }
        }

        console.log(`Restore complete: ${insertedCount} inserted, ${skippedCount} skipped, ${errorCount} errors`);

        // Commit the transaction
        await db.execAsync('COMMIT;');

        if (insertedCount > 0) {
          Alert.alert(
            'Pemulihan selesai', 
            `Data berhasil dipulihkan dari cadangan.\n${insertedCount} record dipulihkan.${errorCount > 0 ? `\n${errorCount} error terjadi.` : ''}`
          );
        } else {
          Alert.alert(
            'Peringatan', 
            `Tidak ada data yang dipulihkan.\n${skippedCount} statement dilewati.\n${errorCount} error terjadi.\n\nPastikan file cadangan valid dan formatnya benar.`
          );
        }
      } catch (error: any) {
        // Rollback on any error
        console.error('Transaction error, rolling back:', error);
        await db.execAsync('ROLLBACK;');
        throw error;
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      const errorMessage = error?.message || 'Terjadi kesalahan saat memulihkan data dari cadangan.';
      Alert.alert('Gagal memulihkan data', errorMessage);
    } finally {
      setIsRestoring(false);
    }
  };

  // Get database size using PRAGMA queries
  useEffect(() => {
    const getDatabaseSize = async () => {
      try {
        // PRAGMA queries return results - the column name might vary
        // Try to get page_size and page_count
        const pageSizeResult = await db.getFirstAsync<any>('PRAGMA page_size');
        const pageCountResult = await db.getFirstAsync<any>('PRAGMA page_count');

        // PRAGMA results might have the value in different column names
        // Common patterns: the value might be in a column named after the pragma,
        // or it might be the first numeric value in the result
        let pageSize: number | null = null;
        let pageCount: number | null = null;

        // Extract page_size - try common column names or first numeric value
        if (pageSizeResult) {
          pageSize = pageSizeResult.page_size || 
                     pageSizeResult.value || 
                     Object.values(pageSizeResult).find((v: any) => typeof v === 'number') as number;
        }

        // Extract page_count - try common column names or first numeric value
        if (pageCountResult) {
          pageCount = pageCountResult.page_count || 
                      pageCountResult.value || 
                      Object.values(pageCountResult).find((v: any) => typeof v === 'number') as number;
        }

        if (pageSize && pageCount) {
          // Calculate total size: page_size * page_count
          const sizeInBytes = pageSize * pageCount;
          setDatabaseSize(sizeInBytes);
        } else {
          console.warn('Could not extract page_size or page_count from PRAGMA results');
          setDatabaseSize(null);
        }
      } catch (error) {
        console.error('Error getting database size:', error);
        setDatabaseSize(null);
      } finally {
        setIsLoading(false);
      }
    };

    getDatabaseSize();
  }, [db]);

  return (
    <View style={styles.container}>
			<Text style={styles.sectionHeader}>Cadangkan Data</Text>
      <View style={{flexDirection:"row", justifyContent: 'space-between'}}>
        <Text style={styles.optionsText}>Ukuran Data</Text>
        <Text style={styles.optionsText}>
          {isLoading ? 'Loading...' : formatBytes(databaseSize)}
        </Text>
      </View>
			<TouchableOpacity 
				style={styles.optionsRow}
				onPress={() => createAndShareBackup(TABLE_KK_ONLY, 'backup_kartu_keluarga.sql')}
        activeOpacity={0.7}
        disabled={isBackingUp}
			>
				<View style={styles.optionsTextBox}>
          <Text style={styles.optionsText}>
            Cadangkan Kartu Keluarga
          </Text>
          <Text style={styles.optionsDesc}>
            Membuat cadangan data untuk satu Kartu Keluarga tertentu
          </Text>
        </View>
        <Feather
          name='chevron-right'
          size={28}
          color="#0A0A0A"
        />
			</TouchableOpacity>
			<TouchableOpacity 
				style={styles.optionsRow}
				onPress={() => createAndShareBackup(TABLE_ALL, 'backup_semua_data.sql')}
        activeOpacity={0.7}
        disabled={isBackingUp}
			>
				<View style={styles.optionsTextBox}>
          <Text style={styles.optionsText}>
            Cadangkan semua data
          </Text>
          <Text style={styles.optionsDesc}>
            Membuat cadangan seluruh data yang tersimpan di dalam cadangan lokal
          </Text>
        </View>
        <Feather
          name='chevron-right'
          size={28}
          color="#0A0A0A"
        />
			</TouchableOpacity>
			<Text style={styles.sectionHeader}>Pemulihan Data</Text>
      <TouchableOpacity 
				style={styles.optionsRow}
				onPress={() => restoreFromBackup(TABLE_KK_ONLY)}
        		activeOpacity={0.7}
          disabled={isBackingUp || isRestoring}
			>
				<View style={styles.optionsTextBox}>
          <Text style={styles.optionsText}>
            Pulihkan Kartu Keluarga
          </Text>
          <Text style={styles.optionsDesc}>
            Membuat cadangan seluruh data Kartu Keluarga yang tersimpan di dalam cadangan lokal
          </Text>
        </View>
        <Feather
          name='chevron-right'
          size={28}
          color="#0A0A0A"
        />
			</TouchableOpacity>
      <TouchableOpacity 
				style={styles.optionsRow}
				onPress={() => restoreFromBackup(TABLE_ALL)}
        		activeOpacity={0.7}
          disabled={isBackingUp || isRestoring}
			>
				<View style={styles.optionsTextBox}>
          <Text style={styles.optionsText}>
            Pulihkan semua Kartu Keluarga
          </Text>
          <Text style={styles.optionsDesc}>
            Membuat cadangan seluruh data Kartu Keluarga yang tersimpan di dalam cadangan lokal
          </Text>
        </View>
        <Feather
          name='chevron-right'
          size={28}
          color="#0A0A0A"
        />
			</TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    width: Dimensions.get('window').width,
		paddingHorizontal: '5%',
		paddingTop: '10%',
		gap: 20,

  },
	sectionHeader: {
		color: '#8F8F8F',
		fontSize: 18,
	},
	optionsRow: {
		flexDirection: 'row',
		height: 'auto',
    justifyContent: 'flex-start',
    alignItems: 'center'
	},
  optionsTextBox: {
    height: 'auto',
    width: '95%'
  },
	optionsText: {
		fontWeight: 'bold',
		fontSize: 18,
	},
	optionsDesc: {
		color: '#8F8F8F',
		fontSize: 12
	}
});
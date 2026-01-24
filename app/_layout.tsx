import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

export default function RootLayout() {
  const createDbIfNeeded = async (db: SQLiteDatabase) => {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS kartuKeluarga (
        id INTEGER PRIMARY KEY,
        nomorKK VARCHAR(255),
        namaKepalaKeluarga VARCHAR(255),
        alamat VARCHAR(255),
        rukunTetangga VARCHAR(255),
        rukunWarga VARCHAR(255),
        kelurahan VARCHAR(255),
        kecamatan VARCHAR(255),
        kota VARCHAR(255),
        provinsi VARCHAR(255),
        createdAt datetime,
        updatedAt datetime
        );
      CREATE TABLE IF NOT EXISTS anggotaKeluarga (
        id INTEGER PRIMARY KEY,
        idKK INTEGER,
        nik VARCHAR(255),
        nama VARCHAR(255),
        tempatLahir varchar(255),
        tanggalLahir varchar(255),
        jenisKelamin varchar(255),
        hubungan varchar(255),
        agama varchar(255),
        pendidikan varchar(255),
        pekerjaan varchar(255),
        statusPerkawinan varchar(255),
        namaAyah varchar(255),
        namaIbu varchar(255),
        createdAt datetime,
        updatedAt datetime
        );
      CREATE TABLE IF NOT EXISTS sppt (
        id INTEGER PRIMARY KEY,
        nopd VARCHAR(255),
        namaWp VARCHAR(255),
        alamatWp varchar(255),
        rtWp varchar(255),
        rwWp varchar(255),
        totalWp varchar(255),
        createdAt datetime,
        updatedAt datetime
        );`
    );
  };

  return (
    <SQLiteProvider databaseName='AplikasiKKNPonjongJaya.db' onInit={createDbIfNeeded}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>  
    </SQLiteProvider>
  );
}

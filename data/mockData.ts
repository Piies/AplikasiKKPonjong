// Temporary mock data that mimics SQLite query results
// Replace this with actual SQLite queries later

import { KartuKeluarga, AnggotaKeluarga, KartuKeluargaWithAnggota } from '@/types/database';

// Mock KartuKeluarga table data
export const mockKartuKeluarga: KartuKeluarga[] = [
  {
    id: 1,
    nomorKK: '1234567890123456',
    namaKepalaKeluarga: 'Budi Santoso',
    alamat: 'Jl. Merdeka No. 123',
    rt: '001',
    rw: '005',
    kelurahan: 'Double Ponjong',
    kecamatan: 'Ponjong',
    kota: 'Gunung Kidul',
    provinsi: 'DI Yogyakarta',
  },
  {
    id: 2,
    nomorKK: '2345678901234567',
    namaKepalaKeluarga: 'Siti Nurhaliza',
    alamat: 'Jl. Sudirman No. 45',
    rt: '002',
    rw: '005',
    kelurahan: 'Triple Ponjong',
    kecamatan: 'Sleman',
    kota: 'Yogyakarta',
    provinsi: 'DI Yogyakarta',
  },
  {
    id: 3,
    nomorKK: '3456789012345678',
    namaKepalaKeluarga: 'Ahmad Fauzi',
    alamat: 'Jl. Diponegoro No. 78',
    rt: '003',
    rw: '005',
    kelurahan: 'Triple Ponjong',
    kecamatan: 'Sleman',
    kota: 'Yogyakarta',
    provinsi: 'DI Yogyakarta',
  },
];

// Mock AnggotaKeluarga table data (with foreign keys)
export const mockAnggotaKeluarga: AnggotaKeluarga[] = [
  // Anggota for KartuKeluarga id: 1
  {
    id: 1,
    kartuKeluargaId: 1,
    nama: 'Budi Santoso',
    nik: '1234567890123456',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1980-05-15',
    jenisKelamin: 'L',
    hubungan: 'Kepala Keluarga',
    agama: 'Islam',
    pendidikan: 'S1',
    pekerjaan: 'Pegawai Swasta',
    statusPerkawinan: 'Kawin',
  },
  {
    id: 2,
    kartuKeluargaId: 1,
    nama: 'Siti Rahayu',
    nik: '1234567890123457',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1982-08-20',
    jenisKelamin: 'P',
    hubungan: 'Istri',
    agama: 'Islam',
    pendidikan: 'SMA',
    pekerjaan: 'Ibu Rumah Tangga',
    statusPerkawinan: 'Kawin',
  },
  {
    id: 3,
    kartuKeluargaId: 1,
    nama: 'Ahmad Rizki',
    nik: '1234567890123458',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '2005-03-10',
    jenisKelamin: 'L',
    hubungan: 'Anak',
    agama: 'Islam',
    pendidikan: 'SMP',
    pekerjaan: 'Pelajar',
    statusPerkawinan: 'Belum Kawin',
  },
  // Anggota for KartuKeluarga id: 2
  {
    id: 4,
    kartuKeluargaId: 2,
    nama: 'Siti Nurhaliza',
    nik: '2345678901234567',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1985-11-25',
    jenisKelamin: 'P',
    hubungan: 'Kepala Keluarga',
    agama: 'Islam',
    pendidikan: 'S1',
    pekerjaan: 'Guru',
    statusPerkawinan: 'Cerai Hidup',
  },
  {
    id: 5,
    kartuKeluargaId: 2,
    nama: 'Rina Putri',
    nik: '2345678901234568',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '2010-07-12',
    jenisKelamin: 'P',
    hubungan: 'Anak',
    agama: 'Islam',
    pendidikan: 'SD',
    pekerjaan: 'Pelajar',
    statusPerkawinan: 'Belum Kawin',
  },
  // Anggota for KartuKeluarga id: 3
  {
    id: 6,
    kartuKeluargaId: 3,
    nama: 'Ahmad Fauzi',
    nik: '3456789012345678',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1978-02-14',
    jenisKelamin: 'L',
    hubungan: 'Kepala Keluarga',
    agama: 'Islam',
    pendidikan: 'S2',
    pekerjaan: 'PNS',
    statusPerkawinan: 'Kawin',
  },
];

// Helper function to get AnggotaKeluarga by kartuKeluargaId (simulates SQLite JOIN query)
// In real implementation, this would be: SELECT * FROM AnggotaKeluarga WHERE kartuKeluargaId = ?
export function getAnggotaByKartuKeluargaId(
  kartuKeluargaId: number,
  anggotaList: AnggotaKeluarga[]
): AnggotaKeluarga[] {
  return anggotaList.filter((anggota) => anggota.kartuKeluargaId === kartuKeluargaId);
}

// Helper function to combine KartuKeluarga with its AnggotaKeluarga
// This simulates what you'd get from a JOIN query or multiple queries
export function getKartuKeluargaWithAnggota(
  kartuKeluarga: KartuKeluarga[],
  anggotaKeluarga: AnggotaKeluarga[]
): KartuKeluargaWithAnggota[] {
  return kartuKeluarga.map((kk) => ({
    ...kk,
    anggotaKeluarga: getAnggotaByKartuKeluargaId(kk.id, anggotaKeluarga),
  }));
}

// Export combined data ready to use
export const mockKartuKeluargaWithAnggota = getKartuKeluargaWithAnggota(
  mockKartuKeluarga,
  mockAnggotaKeluarga
);


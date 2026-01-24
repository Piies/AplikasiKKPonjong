// Database types for SQLite implementation
// These match what you'll get from SQLite queries

export interface KartuKeluarga {
  id: number;
  nomorKK: string;
  namaKepalaKeluarga: string;
  alamat: string;
  rt?: string;
  rw?: string;
  kelurahan?: string;
  kecamatan?: string;
  kota?: string;
  provinsi?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnggotaKeluarga {
  id: number;
  kartuKeluargaId: number; // Foreign key to KartuKeluarga
  nama: string;
  nik: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  jenisKelamin: 'L' | 'P';
  hubungan: string; // e.g., "Kepala Keluarga", "Istri", "Anak", etc.
  agama?: string;
  pendidikan?: string;
  pekerjaan?: string;
  statusPerkawinan?: string;
  namaAyah?: string;
  namaIbu?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Combined type for KartuKeluarga with its related AnggotaKeluarga
export interface KartuKeluargaWithAnggota extends KartuKeluarga {
  anggotaKeluarga?: AnggotaKeluarga[];
}

export interface Sppt {
  id: number;
  namaWp: string;
  nopd: string;
  alamatWp?: string;
  rtWp?: string;
  rwWp: string;
  totalWp: string;
  createdAt?: string;
  updatedAt?: string;
}
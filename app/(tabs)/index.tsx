import { Text, TextInput, View, StyleSheet, Dimensions } from "react-native";
import { Link } from 'expo-router';
import { Image, ImageBackground } from 'expo-image';
import { useState, useEffect } from 'react';

import IconButton from "@/components/IconButton";
import Feather from "@expo/vector-icons/Feather";
import { useSQLiteContext } from "expo-sqlite";

const gradient_main = require('@/assets/images/gradient-home.png');
const welcome_decor = require('@/assets/images/welcome-msg-decor.png');
const placeholderName = 'Bapak/Ibu'

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const db = useSQLiteContext();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await db.getFirstAsync<any>(
        'SELECT * FROM userData WHERE id = 1'
      );
      setUserData(userData);
    };
    fetchUserData();
  }, []);

  const now = new Date();

  return (
    <View style={styles.container}>
      {/*background*/}
      <View style={styles.backgroundContainer}>
        <ImageBackground
          source={gradient_main} 
          style={styles.backgroundImage} 
          contentFit="cover" // Covers the container area
        />
      </View>

      {/* Content */}
      <View style={styles.welcomeMessage}>
        <Feather name="user" size={40} color={'gray'} />
        <View style={{
          justifyContent: 'flex-end'
        }}>
          <Text style={{
            fontWeight: 'bold', 
            fontSize:16,}}>
            Selamat {now.getHours() < 12 ? 'Pagi' : now.getHours() < 13 ? 'Siang' : now.getHours() < 18 ? 'Sore' : 'Malam'},{userData && userData.username ? userData.username : placeholderName}
          </Text>
          <Text style={{
            color: '#8F8F8F',
            fontStyle: 'italic',
            fontSize: 12,
          }}>
            Padukuhan {userData && userData.padukuhan ? userData.padukuhan : ''}
          </Text>
        </View>
        <Image source={welcome_decor} style={{height:50, aspectRatio: 2}}/>
      </View>
      <View style={styles.searchInput}>
        <TextInput
          style={{
            flex: 1,
            fontSize: 12,
          }}
          placeholder="Pencarian (Nomor KK, Nama Kepala Keluarga)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        <Feather name="search" size={16} color={'#111827'}/>
      </View>
      <View style={styles.menuGrid}>
        <IconButton label="Database Keluarga" iconName="users" href={"/databaseKK"}/>
        <IconButton label="Tambah Kartu Keluarga Baru" iconName="file-plus" href={"/tambahKK"}/>
        <IconButton label="Export Data" iconName="share" href={"/exportData"}/>
        <IconButton label="Backup Data" iconName="database" href={"/backupData"}/>
      </View>
      <View style={{alignItems:"center", justifyContent: "center", width:'100%'}}>
        <IconButton label="PBB-P2" iconName="file" href={"/databaseSppt"}/>
      </View>
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
  welcomeMessage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  searchInput: {
    width: '80%',
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
  menuGrid: {
    width: '80%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    rowGap: 16,
  },
  text: {
    color: '#0a0a0a',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
  backgroundContainer: {
    position: 'absolute', // Pulls it out of the normal layout flow
    bottom: 0,            // Sticks it to the bottom
    left: 0,
    right: 0, 
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.4, // Calculate height based on aspect ratio
    zIndex: -1,           // Ensures it stays behind your text/buttons
    backgroundColor: '#FCFCFC',
  },
  backgroundImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.4,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
});
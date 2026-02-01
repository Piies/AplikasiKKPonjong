import { Tabs, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { View, Dimensions, useWindowDimensions, TouchableOpacity } from 'react-native';

const header_decor = require('@/assets/images/header-decor.png');

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#283618',
        headerStyle: {
          backgroundColor: '#FCFCFC',
        },
        headerShadowVisible: false,
        headerTintColor: '#0A0A0A',
        headerLeftContainerStyle: {
          paddingLeft: 10,
        },
        headerLeft: () => (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
            <Image
              source={header_decor}
              style={{
                height: Dimensions.get('window').height * 0.06,
                width: Dimensions.get('window').width * 0.09,
                resizeMode: 'contain',
              }}
            />
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8, justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={24} color="#0A0A0A" />
            </TouchableOpacity>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: '#FCFCFC',
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          headerTitle: '',
          headerLeftContainerStyle: {
            paddingLeft: 10,
          },
          headerLeft: () => (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
              <Image
                source={header_decor}
                style={{
                  height: Dimensions.get('window').height * 0.06,
                  width: Dimensions.get('window').width * 0.09,
                  resizeMode: 'contain',
                }}
              />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 14,
          },
          tabBarIcon: ({ color, focused }) => (
            <Feather name="home" size={24} color="#0A0A0A" />
          ), }} />
      <Tabs.Screen 
        name="pengaturan" 
        options={{ 
          title: 'Pengaturan',
          tabBarLabelStyle: {
            fontSize: 14,
          },
          tabBarIcon: ({ color, focused }) => (
            <Feather name="settings" size={24} color="0A0A0A" />
          ),
        }} />
      <Tabs.Screen 
        name="databaseKK" 
        options={{ 
          title: 'Database Keluarga',
          href: null,
          // Uses the default headerLeft from screenOptions (with back button)
        }} />
      <Tabs.Screen 
        name="detailKK" 
        options={{ 
          title: 'Detail Kartu Keluarga',
          href: null,
        }} />
      <Tabs.Screen 
        name="tambahKK" 
        options={{ 
          title: 'Kartu Keluarga',
          href: null,
        }} />
      <Tabs.Screen 
        name="tambahAnggota" 
        options={{ 
          title: 'Anggota Keluarga',
          href: null,
        }} />
      <Tabs.Screen 
        name="databaseSppt" 
        options={{ 
          title: 'Database SPPT PBB P2',
          href: null,
        }} />
      <Tabs.Screen 
        name="tambahSppt" 
        options={{ 
          title: 'SPPT PBB P2',
          href: null,
        }} />
      <Tabs.Screen 
        name="exportData" 
        options={{ 
          title: 'Export Data',
          href: null,
        }} />
      <Tabs.Screen 
        name="backupData" 
        options={{ 
          title: 'Backup Data',
          href: null,
        }} />
      <Tabs.Screen 
        name="logPenghapusan" 
        options={{ 
          title: 'Log Penghapusan',
          href: null,
        }} />
    </Tabs>
  );
}

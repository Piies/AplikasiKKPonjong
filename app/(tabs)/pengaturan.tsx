import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import Feather from "@expo/vector-icons/Feather";
import { useSQLiteContext } from "expo-sqlite";


export default function Pengaturan() {
  const db = useSQLiteContext();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [username, setUsername] = useState('');
  const [padukuhan, setPadukuhan] = useState('');
  const [email, setEmail] = useState('');

  // Reset form function
  const resetForm = useCallback(() => {
    if (!isEditMode) {
      setUsername('');
      setPadukuhan('');
      setEmail('');
    }
  }, [isEditMode]);

  // Check if user with id = 1 exists and load data
  useEffect(() => {
    const checkAndLoadUserData = async () => {
      try {
        const userData = await db.getFirstAsync<any>(
          'SELECT * FROM userData WHERE id = ?',
          [1]
        );
        
        if (userData) {
          // User with id = 1 exists, enter edit mode
          setIsEditMode(true);
          setUsername(userData.username || '');
          setPadukuhan(userData.padukuhan || '');
          setEmail(userData.email || '');
        } else {
          // User with id = 1 doesn't exist, stay in add mode
          setIsEditMode(false);
          resetForm();
        }
      } catch (error) {
        console.error('Error checking User Data:', error);
        setIsEditMode(false);
        resetForm();
      } finally {
        setIsLoading(false);
      }
    };

    checkAndLoadUserData();
  }, [db, resetForm]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const reloadData = async () => {
        try {
          const userData = await db.getFirstAsync<any>(
            'SELECT * FROM userData WHERE id = ?',
            [1]
          );
          
          if (userData) {
            setIsEditMode(true);
            setUsername(userData.username || '');
            setPadukuhan(userData.padukuhan || '');
            setEmail(userData.email || '');
          } else {
            setIsEditMode(false);
            resetForm();
          }
        } catch (error) {
          console.error('Error reloading User Data:', error);
        }
      };

      reloadData();
    }, [db, resetForm])
  );

  const handleEditUserData = async () => {
    // Validate required fields
    if (!username.trim() || !padukuhan.trim() || !email.trim()) {
      Alert.alert('Error', 'Username, Padukuhan, dan Email harus diisi');
      return;
    }

    try {
      const now = new Date().toISOString();
      
      if (isEditMode) {
        // Update existing User Data with id = 1
        await db.runAsync(
          `UPDATE userData SET
            username = ?,
            padukuhan = ?,
            email = ?,
            updatedAt = ?
          WHERE id = ?`,
          [
            username.trim(),
            padukuhan.trim(),
            email.trim(),
            now,
            1
          ]
        );
        
        console.log('User Data berhasil diupdate');
        Alert.alert('Success', 'Pengaturan berhasil diupdate');
      } else {
        // Insert new User Data
        const result = await db.runAsync(
          `INSERT INTO userData (
            username, 
            padukuhan, 
            email, 
            createdAt, 
            updatedAt
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            username.trim(),
            padukuhan.trim(),
            email.trim(),
            now,
            now
          ]
        );

        // Get the inserted ID (lastInsertRowId)
        const newUserId = result.lastInsertRowId;
        
        console.log('User Data berhasil ditambahkan dengan ID:', newUserId);
        
        // After inserting, check if it's id = 1 and switch to edit mode
        if (newUserId === 1) {
          setIsEditMode(true);
        } else {
          resetForm();
        }
        
        Alert.alert('Success', 'Pengaturan berhasil disimpan');
      }
    } catch (error) {
      console.error('Error saving User Data:', error);
      Alert.alert('Error', `Gagal ${isEditMode ? 'mengupdate' : 'menambahkan'} User Data. Silakan coba lagi.`);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        style={{width: '90%'}}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.textForm}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Padukuhan"
          value={padukuhan}
          onChangeText={setPadukuhan}
          placeholderTextColor="#606C38"
        />
        <TextInput
          style={styles.textForm}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#606C38"
        />
        <Pressable 
          style={styles.linkButton}
          onPress={handleEditUserData}
        >
          <View style={{backgroundColor:'#BC6C25', borderRadius:24, aspectRatio:1, width: 24, height: 24, alignItems: 'center', justifyContent: 'center'}}>
            <Feather name="save" size={14} color="#FFFCEA" />
          </View>
          <Text style={styles.linkButtonText}>{isEditMode ? "Update Pengaturan" : "Simpan Pengaturan"}</Text>
        </Pressable>
        <View style={{
          margin: 'auto',
          gap: 12,
          padding: 24,
          alignItems: 'center',
        }}>
          <Text style={{fontWeight: 'bold', color: '#0A0A0A', }}>Manual Penggunaan Aplikasi:</Text>
          <Link href='https://docs.google.com/document/d/1MDFW7uUQlAr-iPG5tqo1EsFZOL_TWN1wQwAi0z2HVrY/edit?usp=sharing' asChild>
            <Pressable style={{
              backgroundColor: '#3086F6',
              padding: 16,
              borderRadius: 32,
            }}>
                <Text style={{fontWeight: 'bold', color: '#FFF'}}>Dokumen Penggunaan</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
      <Text style={{
        textAlign: 'center',
        margin: 'auto',
        color: '#777',
        fontWeight: 500,
        fontSize: 12,
      }}>
        {`
Aplikasi disusun oleh:
Melvin Cahyadi Tirtayasa
KKN-PPM UGM di Ponjong Periode 4 2025
        `}
      </Text>
      {/*for some reason the text tab spacing affects the centering???*/}
    </KeyboardAvoidingView>
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
  textForm: {
    backgroundColor:'#FFFCEA',
    flex: 1,
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDA15E',
    paddingVertical: 8,
    borderRadius: 32,
    gap: 8,
    width: '90%',
    marginHorizontal: 'auto'
  },
  linkButtonText: {
    fontSize: 14,
    color: '#FFFCEA',
  },
});
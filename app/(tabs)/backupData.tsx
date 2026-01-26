import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";


export default function BackupData() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text>Backup Data</Text>
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
    backgroundColor: '#FCFCFC',
    width: Dimensions.get('window').width,
  },
});
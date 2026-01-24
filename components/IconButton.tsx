import { StyleSheet, View, Pressable, Text } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Link, Href } from 'expo-router';

type Props = {
  label: string;
  iconName: keyof typeof Feather.glyphMap;
  href: Href
};

export default function IconButton({ label, iconName, href }: Props) {

  return (
    <View style={styles.buttonContainer}>
      <Link href={href} asChild>
        <Pressable style={styles.button}>
          <Feather name={iconName} size={32} style={styles.buttonIcon} />
          <Text style={styles.buttonLabel}>{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    width: 108, 
    height: 108,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  button: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // 3. Remove flexDirection: 'row' since we usually don't want 
    // text next to an icon in a small circle/square
  },
  buttonIcon: {
    color: '#BC6C25',
    backgroundColor: '#FFFCEA',
    padding: 20,
    borderRadius: 16,
  },
  buttonLabel: {
    color: '#0A0A0A',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold'
  },
});

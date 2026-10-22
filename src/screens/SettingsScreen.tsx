
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useInvoiceStore } from '../store/useInvoiceStore';

export const SettingsScreen = () => {
  const { profile, setProfile } = useInvoiceStore();

  const updateProfile = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Business Profile</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>These details will appear on your generated PDFs.</Text>
      
      <View style={styles.section}>
        <TextInput label="Business Name" value={profile.name} onChangeText={t => updateProfile('name', t)} mode="outlined" style={styles.input} />
        <TextInput label="Email" value={profile.email} onChangeText={t => updateProfile('email', t)} mode="outlined" style={styles.input} />
        <TextInput label="Phone" value={profile.phone} onChangeText={t => updateProfile('phone', t)} mode="outlined" style={styles.input} />
        <TextInput label="Address" value={profile.address} onChangeText={t => updateProfile('address', t)} mode="outlined" style={styles.input} />
        <TextInput label="Tax ID" value={profile.taxId} onChangeText={t => updateProfile('taxId', t)} mode="outlined" style={styles.input} />
      </View>

      <Button mode="contained" onPress={() => alert('Profile saved!')} style={styles.saveBtn}>Save Profile</Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { marginBottom: 8, fontWeight: 'bold', color: '#3F51B5' },
  subtitle: { marginBottom: 20, color: '#666' },
  section: { gap: 12 },
  input: { marginBottom: 8 },
  saveBtn: { marginTop: 30, paddingVertical: 8, backgroundColor: '#3F51B5' },
});

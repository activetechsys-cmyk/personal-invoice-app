
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { DBManager } from '../db/manager';
import * as ImagePicker from 'expo-image-picker';

export const SettingsScreen = () => {
  const { profile, setProfile } = useInvoiceStore();
  const [form, setForm] = useState(profile);

  const handleSave = async () => {
    await DBManager.saveProfile(form);
    setProfile(form);
    alert('Profile saved successfully!');
  };

  const pickImage = async (field: 'logoUri' | 'signatureUri') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setForm({ ...form, [field]: result.assets[0].uri });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>Business Profile</Text>
        
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>Branding</Text>
          
          <View style={styles.imagePickerRow}>
            <View style={styles.imageContainer}>
              {form.logoUri ? (
                <Image source={{ uri: form.logoUri }} style={styles.image} />
              ) : (
                <View style={styles.placeholder}><Text>No Logo</Text></View>
              )}
            </View>
            <Button mode="outlined" onPress={() => pickImage('logoUri')}>Pick Logo</Button>
          </View>

          <View style={styles.imagePickerRow}>
            <View style={styles.imageContainer}>
              {form.signatureUri ? (
                <Image source={{ uri: form.signatureUri }} style={styles.image} />
              ) : (
                <View style={styles.placeholder}><Text>No Signature</Text></View>
              )}
            </View>
            <Button mode="outlined" onPress={() => pickImage('signatureUri')}>Pick Signature</Button>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionLabel}>Business Details</Text>
          <TextInput
            label="Business Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Address"
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            label="Phone"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
          <TextInput
            label="Tax ID"
            value={form.taxId}
            onChangeText={(text) => setForm({ ...form, taxId: text })}
            mode="outlined"
            style={styles.input}
          />
        </View>

        <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
          Save Profile
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontWeight: 'bold', marginBottom: 20, color: '#3F51B5' },
  section: { marginBottom: 25 },
  sectionLabel: { marginBottom: 15, color: '#666', fontWeight: '600' },
  input: { marginBottom: 12 },
  divider: { marginVertical: 20 },
  saveButton: { marginTop: 20, paddingVertical: 8 },
  imagePickerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8
  },
  imageContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 8, 
    overflow: 'hidden', 
    backgroundColor: '#eee' 
  },
  image: { width: '100%', height: '100%' },
  placeholder: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    fontSize: 10, 
    color: '#999' 
  },
});

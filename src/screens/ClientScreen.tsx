
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, List, FAB, Portal, Modal, Text } from 'react-native-paper';
import { DBManager } from '../db/manager';
import { Client } from '../types';

export const ClientScreen = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [visible, setVisible] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

  const loadClients = async () => {
    const data = await DBManager.getClients();
    setClients(data);
  };

  useEffect(() => { loadClients(); }, []);

  const handleAddClient = async () => {
    if (!newClient.name) return Alert.alert('Error', 'Name is required');
    await DBManager.addClient(newClient);
    setNewClient({ name: '', email: '', phone: '', address: '' });
    setVisible(false);
    loadClients();
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Clients</Text>
      <ScrollView style={styles.list}>
        {clients.map(client => (
          <List.Item 
            key={client.id} 
            title={client.name} 
            description={client.email} 
            left={p => <List.Icon icon="account" />} 
          />
        ))}
      </ScrollView>

      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge">Add New Client</Text>
          <TextInput label="Name *" value={newClient.name} onChangeText={t => setNewClient({...newClient, name: t})} mode="outlined" style={styles.input} />
          <TextInput label="Email" value={newClient.email} onChangeText={t => setNewClient({...newClient, email: t})} mode="outlined" style={styles.input} />
          <TextInput label="Phone" value={newClient.phone} onChangeText={t => setNewClient({...newClient, phone: t})} mode="outlined" style={styles.input} />
          <TextInput label="Address" value={newClient.address} onChangeText={t => setNewClient({...newClient, address: t})} mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleAddClient} style={styles.button}>Save Client</Button>
        </Modal>
      </Portal>

      <FAB icon="plus" style={styles.fab} onPress={() => setVisible(true)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { marginBottom: 20, fontWeight: 'bold', color: '#3F51B5' },
  list: { flex: 1 },
  modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 12 },
  input: { marginBottom: 12 },
  button: { marginTop: 10 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: '#3F51B5' },
});

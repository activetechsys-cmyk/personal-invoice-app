
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Menu, Divider } from 'react-native-paper';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { DBManager } from '../db/manager';
import { Client } from '../types';
import { InvoiceItemRow } from '../components/InvoiceItemRow';
import { generateInvoicePDF } from '../utils/pdfGenerator';

export const InvoiceScreen = () => {
  const { currentInvoice, updateInvoiceField, addItem, profile } = useInvoiceStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    DBManager.getClients().then(setClients);
  }, []);

  const calculateTotals = () => {
    const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * (currentInvoice.taxRate / 100);
    const discount = subtotal * (currentInvoice.discountRate / 100);
    return { subtotal, tax, discount, total: subtotal + tax - discount };
  };

  const { subtotal, tax, discount, total } = calculateTotals();

  const handleSave = async () => {
    if (!currentInvoice.client) return Alert.alert('Error', 'Please select a client');
    if (currentInvoice.items.length === 0) return Alert.alert('Error', 'Add at least one item');

    try {
      const id = await DBManager.createInvoice(
        { 
          clientId: currentInvoice.client.id, 
          invoiceNumber: currentInvoice.invoiceNumber,
          dateIssued: currentInvoice.dateIssued,
          dateDue: currentInvoice.dateDue,
          taxRate: currentInvoice.taxRate,
          discountRate: currentInvoice.discountRate,
          notes: currentInvoice.notes
        }, 
        currentInvoice.items
      );
      Alert.alert('Success', `Invoice #${currentInvoice.invoiceNumber} saved with ID ${id}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save invoice');
    }
  };

  const handlePrint = async () => {
    if (!currentInvoice.client) return Alert.alert('Error', 'Please select a client first');
    if (currentInvoice.items.length === 0) return Alert.alert('Error', 'Invoice must have items to print');

    try {
      await generateInvoicePDF(profile, { ...currentInvoice, id: 0 }, currentInvoice.client);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>New Invoice</Text>

      <View style={styles.section}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setMenuVisible(true)} style={styles.clientBtn}>
              {currentInvoice.client ? `Client: ${currentInvoice.client.name}` : 'Select Client'}
            </Button>
          }
        >
          {clients.map(c => (
            <Menu.Item key={c.id} onPress={() => {
              useInvoiceStore.getState().setCurrentClient(c);
              setMenuVisible(false);
            }} title={c.name} />
          ))}
        </Menu>

        <View style={styles.grid}>
          <TextInput label="Invoice #" value={currentInvoice.invoiceNumber} onChangeText={v => updateInvoiceField('invoiceNumber', v)} mode="outlined" style={styles.input} />
          <TextInput label="Due Date" value={currentInvoice.dateDue} onChangeText={v => updateInvoiceField('dateDue', v)} mode="outlined" style={styles.input} />
        </View>
      </View>

      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Line Items</Text>
        {currentInvoice.items.map((_, i) => <InvoiceItemRow key={i} index={i} />)}
        <Button icon="plus" mode="text" onPress={addItem} style={styles.addItemBtn}>Add Item</Button>
      </View>

      <View style={styles.footer}>
        <View style={styles.calcRow}>
          <Text>Subtotal:</Text>
          <Text style={styles.bold}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.calcRow}>
          <TextInput label="Tax %" value={String(currentInvoice.taxRate)} keyboardType="numeric" onChangeText={v => updateInvoiceField('taxRate', parseFloat(v) || 0)} mode="flat" style={styles.smallInput} />
          <Text style={styles.bold}>${tax.toFixed(2)}</Text>
        </View>
        <View style={styles.calcRow}>
          <TextInput label="Discount %" value={String(currentInvoice.discountRate)} keyboardType="numeric" onChangeText={v => updateInvoiceField('discountRate', parseFloat(v) || 0)} mode="flat" style={styles.smallInput} />
          <Text style={styles.bold}>-${discount.toFixed(2)}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.totalRow}>
          <Text variant="headlineSmall">Total:</Text>
          <Text variant="headlineSmall" style={styles.grandTotal}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>Save Invoice</Button>
        <Button mode="outlined" onPress={handlePrint} style={styles.printBtn}>Print PDF</Button>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { marginBottom: 20, fontWeight: 'bold', color: '#3F51B5' },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12, fontWeight: 'bold' },
  grid: { flexDirection: 'row', gap: 12, marginTop: 12 },
  input: { flex: 1 },
  clientBtn: { width: '100%', justifyContent: 'flex-start' },
  divider: { marginVertical: 16 },
  addItemBtn: { alignSelf: 'flex-start' },
  footer: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginTop: 20 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  smallInput: { width: 100, marginRight: 10 },
  bold: { fontWeight: 'bold', fontSize: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  grandTotal: { fontWeight: 'bold', color: '#3F51B5' },
  actionContainer: { gap: 12, marginTop: 30 },
  saveBtn: { paddingVertical: 8, backgroundColor: '#3F51B5' },
  printBtn: { paddingVertical: 8 },
});

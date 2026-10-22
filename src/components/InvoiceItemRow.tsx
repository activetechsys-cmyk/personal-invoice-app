
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useInvoiceStore } from '../store/useInvoiceStore';

export const InvoiceItemRow = ({ index }: { index: number }) => {
  const { currentInvoice, updateItem } = useInvoiceStore();
  const item = currentInvoice.items[index];

  const handleChange = (field: string, value: any) => {
    // Fix: call store action with (index, field, value)
    updateItem(index, field, value);
  };

  return (
    <View style={styles.row}>
      <TextInput
        label="Description"
        value={item.description}
        onChangeText={v => handleChange('description', v)}
        mode="flat"
        style={styles.descInput}
        dense
      />
      <TextInput
        label="Qty"
        value={String(item.quantity)}
        onChangeText={v => handleChange('quantity', parseFloat(v) || 0)}
        mode="flat"
        keyboardType="numeric"
        style={styles.qtyInput}
        dense
      />
      <TextInput
        label="Price"
        value={String(item.unitPrice)}
        onChangeText={v => handleChange('unitPrice', parseFloat(v) || 0)}
        mode="flat"
        keyboardType="numeric"
        style={styles.priceInput}
        dense
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>
          ${(item.quantity * item.unitPrice).toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 10 
  },
  descInput: { 
    flex: 3, 
    fontSize: 13,
    height: 40
  },
  qtyInput: { 
    flex: 0.5, 
    fontSize: 13,
    height: 40 
  },
  priceInput: { 
    flex: 1, 
    fontSize: 13,
    height: 40 
  },
  totalContainer: { 
    flex: 0.8, 
    justifyContent: 'center', 
    alignItems: 'flex-end' 
  },
  totalText: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#3F51B5' 
  },
});

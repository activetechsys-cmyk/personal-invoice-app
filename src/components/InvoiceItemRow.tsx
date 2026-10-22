
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, IconButton, Text } from 'react-native-paper';
import { useInvoiceStore } from '../store/useInvoiceStore';

export const InvoiceItemRow = ({ index }: { index: number }) => {
  const { currentInvoice, updateItem, removeItem } = useInvoiceStore();
  const item = currentInvoice.items[index];

  return (
    <View style={styles.row}>
      <TextInput
        label="Description"
        mode="outlined"
        value={item.description}
        onChangeText={(val) => updateItem(index, 'description', val)}
        style={styles.desc}
      />
      <TextInput
        label="Qty"
        mode="outlined"
        value={String(item.quantity)}
        keyboardType="numeric"
        onChangeText={(val) => updateItem(index, 'quantity', parseFloat(val) || 0)}
        style={styles.qty}
      />
      <TextInput
        label="Price"
        mode="outlined"
        value={String(item.unitPrice)}
        keyboardType="numeric"
        onChangeText={(val) => updateItem(index, 'unitPrice', parseFloat(val) || 0)}
        style={styles.price}
      />
      <Text style={styles.total}>
        ${(item.quantity * item.unitPrice).toFixed(2)}
      </Text>
      <IconButton 
        icon="delete" 
        onPress={() => removeItem(index)} 
        iconColor="red" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  desc: { flex: 3 },
  qty: { flex: 1 },
  price: { flex: 1 },
  total: {
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'right',
  },
});


import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Text } from 'react-native-paper';
import { DBManager } from './src/db/manager';
import { ClientScreen } from './src/screens/ClientScreen';
import { InvoiceScreen } from './src/screens/InvoiceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  const [index, setIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    DBManager.init().then(() => setInitialized(true));
  }, []);

  if (!initialized) return <View style={styles.center}><Text>Initializing Database...</Text></View>;

  const routes = [
    { key: 'invoice', title: 'Invoice', icon: '📄', component: <InvoiceScreen /> },
    { key: 'clients', title: 'Clients', icon: '👥', component: <ClientScreen /> },
    { key: 'settings', title: 'Settings', icon: '⚙️', component: <SettingsScreen /> },
  ];

  const renderScene = routes[index].component;

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.content}>{renderScene}</View>
        <View style={styles.tabBar}>
          {routes.map((route, i) => (
            <TouchableOpacity 
              key={route.key} 
              style={[styles.tabItem, index === i && styles.activeTab]} 
              onPress={() => setIndex(i)}
            >
              <Text style={[styles.tabIcon, index === i && styles.activeTabText]}>
                {route.icon}
              </Text>
              <Text style={[styles.tabText, index === i && styles.activeTabText]}>
                {route.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { 
    flexDirection: 'row', 
    height: 65, 
    borderTopWidth: 1, 
    borderTopColor: '#eee', 
    backgroundColor: '#fff',
    paddingBottom: 10
  },
  tabItem: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 10 
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#3F51B5'
  },
  tabIcon: { 
    fontSize: 20, 
    marginBottom: 2,
    color: '#666' 
  },
  tabText: { 
    fontSize: 10, 
    color: '#666' 
  },
  activeTabText: { 
    color: '#3F51B5', 
    fontWeight: 'bold' 
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export const AnnouncementBar = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🚚 No Delivery fees for orders over $200 <Text style={styles.conditions}>*Conditions Apply</Text></Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  conditions: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '400',
  },
});

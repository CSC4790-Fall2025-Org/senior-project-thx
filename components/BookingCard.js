import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from './AppStyles';

export default function BookingCard({
  image, title, provider, date, time, status, onMenuPress,
}) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} resizeMode="cover" />
      <View style={styles.details}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.provider}>By {provider}</Text>
        <View style={styles.datetimeRow}>
          <Text style={styles.datetime}>Date{"\n"}{date}</Text>
          <Text style={styles.datetime}>Time{"\n"}{time}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
        <Text style={styles.menuIcon}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: colors.placeholder,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.heading,
  },
  provider: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 5,
  },
  datetimeRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  datetime: {
    fontSize: 13,
    color: colors.textPrimary,
    marginRight: 18,
  },
  statusRow: {
    marginTop: 2,
    alignItems: 'flex-end',
  },
  status: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 'bold',
  },
  menuBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  menuIcon: {
    fontSize: 22,
    color: colors.heading,
  },
});
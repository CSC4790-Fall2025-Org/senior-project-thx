import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/AppStyles';

const { width } = Dimensions.get('window');

export default function BookingCard({ image, service, stylist, date, time, status }) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.service}>{service}</Text>
        <Text style={styles.stylist}>By {stylist}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailText}>{time}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.status}>{status}</Text>
          </View>
        </View>
      </View>
      {/* Dots menu icon */}
      <TouchableOpacity style={styles.menuIcon}>
        <Ionicons name="ellipsis-vertical" size={width * 0.06} color={colors.heading} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: width * 0.035,
    padding: width * 0.03,
    marginBottom: width * 0.04,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.03,
    marginRight: width * 0.04,
    backgroundColor: colors.placeholder,
  },
  info: {
    flex: 1,
  },
  service: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: colors.heading,
    marginBottom: 2,
  },
  stylist: {
    fontSize: width * 0.037,
    color: colors.heading,
    marginBottom: width * 0.012,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailCol: {
    marginRight: width * 0.06,
  },
  detailLabel: {
    fontSize: width * 0.032,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailText: {
    fontSize: width * 0.035,
    color: colors.textPrimary,
  },
  status: {
    fontSize: width * 0.035,
    color: colors.gradientEnd,
    fontWeight: 'bold',
    marginLeft: width * 0.02,
  },
  menuIcon: {
    position: 'absolute',
    right: width * 0.03,
    top: width * 0.03,
    padding: 8,
  },
});
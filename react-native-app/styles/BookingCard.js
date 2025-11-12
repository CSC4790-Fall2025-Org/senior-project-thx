import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from './AppStyles';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function BookingCard({
  image,
  service,
  stylist,
  date,
  time,
  status,
  onDelete,
  onMessage,
  booking,
  showDeleteIcon // pass this prop from MyBookings.js to show delete icon instead of menu
}) {
  const navigation = useNavigation();

  // Only do the confirmation prompt ONCE, delegate the deletion and confirmation message to parent
  const handleDelete = () => {
    if (onDelete) onDelete();
  };

  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.service}>{service}</Text>
        <Text style={styles.stylist}>
          By <Text style={styles.stylistBold}>{stylist}</Text>
        </Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailText}>{time}</Text>
          </View>
          {status && (
            <View style={styles.detailCol}>
              <Text style={styles.status}>{status}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.menuContainer}>
        {showDeleteIcon ? (
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={handleDelete}
            accessibilityLabel="Delete Booking"
          >
            <Feather name="trash-2" size={width * 0.05} color={colors.gradientEnd} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={() => navigation.navigate('BookingInfo', { booking })}
            accessibilityLabel="More Options"
          >
            <Ionicons name="ellipsis-vertical" size={width * 0.04} color={colors.heading} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: width * 0.045,
    padding: width * 0.03,
    marginBottom: width * 0.03,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 7,
    alignItems: 'center',
    position: 'relative',
    minHeight: width * 0.30,
    zIndex: 1,
  },
  image: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.02,
    marginRight: width * 0.05,
    backgroundColor: colors.placeholder,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  service: {
    fontSize: width * 0.055,
    fontWeight: '800',
    color: colors.heading,
    marginBottom: 2,
  },
  stylist: {
    fontSize: width * 0.04,
    color: colors.heading,
    fontWeight: '300',
    marginBottom: width * 0.018,
  },
  stylistBold: {
    fontWeight: 'bold',
    color: colors.heading,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: width * 0.01,
  },
  detailCol: {
    marginRight: width * 0.07,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: width * 0.034,
    color: colors.textPrimary,
    fontWeight: '300',
    marginBottom: 2,
  },
  detailText: {
    fontSize: width * 0.037,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  status: {
    fontSize: width * 0.037,
    color: colors.gradientEnd,
    fontWeight: 'bold',
    marginLeft: width * 0.02,
  },
  menuContainer: {
    position: 'absolute',
    right: width * 0.02,
    top: width * 0.02,
    zIndex: 1000,
    alignItems: 'flex-end',
    minHeight: 40,
    minWidth: 40,
  },
  menuIcon: {
    padding: 8,
    zIndex: 1001,
  },
});
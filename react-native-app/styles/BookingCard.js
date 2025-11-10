import React, {useState} from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from './AppStyles';
import { useNavigation } from '@react-navigation/native';
import Modal from 'react-native-modal';
import { api } from '../src/api';

const { width, height } = Dimensions.get('window');

export default function BookingCard({
  image,
  service,
  stylist,
  clientEmail,
  clientName,
  location,
  bookingId,
  date,
  time,
  status,
  onDelete,
  onMessage,
  booking,
  showDeleteIcon // pass this prop from MyBookings.js to show delete icon instead of menu
}) {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  // Only do the confirmation prompt ONCE, delegate the deletion and confirmation message to parent
  const handleDelete = async () => {
    if (!bookingId) {
      Alert.alert("Error", "Booking ID is missing");
      return;
    }
  
    try {
      await api(`/bookings/${bookingId}/`, { method: 'DELETE' });
      Alert.alert("Success", "Booking deleted successfully");
      if (onDelete) onDelete(); // tell parent to refresh
    } catch (err) {
      console.log("DELETE ERROR:", err.message);
      Alert.alert("Error", err.message);
    }
  };
  
  

  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.service}>{service}</Text>
        <Text style={styles.stylist}>
          {showDeleteIcon ? (
            <>by <Text style={styles.stylistBold}>{stylist}</Text></>
          ) : (
            <>Booked by <Text style={styles.stylistBold}>{stylist}</Text></>
          )}
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
            onPress={() => onDelete && onDelete()} // just call parent
            accessibilityLabel="Delete Booking"
          >
            <Feather name="trash-2" size={width * 0.05} color={colors.gradientEnd} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={() => setModalVisible(true)} 
            accessibilityLabel="More Options"
          >
            <Ionicons name="ellipsis-vertical" size={width * 0.04} color={colors.heading} />
          </TouchableOpacity>
        )}
      </View>
      <Modal
  isVisible={modalVisible}
  animationIn="slideInUp"
  animationOut="slideOutDown"
  onBackdropPress={() => setModalVisible(false)}
  onBackButtonPress={() => setModalVisible(false)}
  useNativeDriver
  backdropTransitionOutTiming={0}
  style={styles.centerModal}
>
  <View style={styles.popup}>
    <Text style={styles.popupTitle}>Client Info</Text>

    {/* Evenly spaced info container */}
    <View style={styles.infoContainer}>
      <Text style={styles.popupTextLeft}>Booked By: {clientName || 'N/A'}</Text>
      <Text style={styles.popupTextLeft}>Email: {clientEmail || 'N/A'}</Text>
      <Text style={styles.popupTextLeft}>Suggested Location: {location || 'N/A'}</Text>
    </View>

    {/* Delete Booking Button */}
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => {
        if (onDelete) onDelete();
        setModalVisible(false);
      }}
      
    >
      <Text style={styles.deleteText}>Delete Booking</Text>
    </TouchableOpacity>

    {/* Close Button */}
    <TouchableOpacity
      style={[styles.closeButton, { marginTop: 10 }]}
      onPress={() => setModalVisible(false)}
    >
      <Text style={styles.closeText}>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>

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
    marginRight: width * 0.02,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: width * 0.034,
    color: colors.textPrimary,
    fontWeight: '300',
    marginBottom: 2,
  },
  detailText: {
    fontSize: width * 0.032,
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
    padding: 3,
    zIndex: 1001,
  },
  centerModal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  popup: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  popupTitle: { fontSize: 20, fontWeight: 'bold', color: colors.heading, marginBottom: 10 },
  popupText: { fontSize: 16, color: colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  locationText: { fontSize: 15, color: '#555', textAlign: 'center' },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#000000',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },

  deleteButton: {
    marginTop: 15,
    backgroundColor: colors.gradientEnd, 
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70, 
    marginVertical: 10,
  },
  popupTextLeft: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'left',
    width: '100%',
  },
  
  
});
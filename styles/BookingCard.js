import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  booking, // pass the full booking object if you want to send it to BookingInfo
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleBackgroundPress = () => {
    setModalVisible(false);
  };

  const handleDelete = () => {
    setModalVisible(false);
    Alert.alert(
      "Delete Booking",
      "Are you sure you want to delete this booking?",
      [
        { text: "No", onPress: () => {}, style: "cancel" },
        { text: "Yes", onPress: () => { if (onDelete) onDelete(); } }
      ],
      { cancelable: true }
    );
  };

  const handleOption = (option) => {
    setModalVisible(false);
    if (option === 'delete') {
      handleDelete();
    }
    if (option === 'edit') {
      // Navigate to BookingInfo page with booking data
      navigation.navigate('BookingInfo', { booking }); 
    }
    if (option === 'message' && onMessage) onMessage();
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
        <TouchableOpacity
          style={styles.menuIcon}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={width * 0.04} color={colors.heading} />
        </TouchableOpacity>
      </View>
      {/* Modal centered, closes when background pressed */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleBackgroundPress}
      >
        <Pressable style={styles.modalOverlay} onPress={handleBackgroundPress}>
          <View style={styles.centeredView}>
            <View style={styles.modalMenu}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleOption('edit')}>
                <Text style={styles.dropdownText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleOption.bind(null, 'delete')}>
                <Text style={styles.dropdownText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleOption('message')}>
                <Text style={styles.dropdownText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleBackgroundPress}>
                <Text style={[styles.dropdownText, { color: '#888' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  modalMenu: {
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 14,
    minWidth: 160,
    paddingVertical: 12,
    paddingHorizontal: 8,
    zIndex: 1003,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: colors.heading,
    fontWeight: '600',
  },
});
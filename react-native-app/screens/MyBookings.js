import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Alert, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppStyles, { colors } from '../styles/AppStyles';
import BookingCard from '../styles/BookingCard';
import Feather from 'react-native-vector-icons/Feather';
import { api } from '../src/api';
import { API_BASE } from '../src/config';

const { width, height } = Dimensions.get('window');

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const host = API_BASE.replace(/\/api\/?$/, '');
  return `${host}${url}`;
};

export default function MyBookings({ navigation }) {
  const [bookingsData, setBookingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch bookings from backend API on mount
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/bookings/'); // Fetch backend data with service_name included

      const mappedData = data.map(item => ({
        id: String(item.id),
        service: item.service_name || "Unknown Service",
        stylist: item.provider_name || "",
        date: item.time_detail?.date || "",
        time: formatTimeRange(item.time_detail?.start_time, item.time_detail?.end_time),
        image: { uri: item.image },
      }));

      setBookingsData(mappedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const profile = await api('/profile/me/');
      const raw = profile.profile_picture || profile.avatar || profile.image || profile.profile_image || profile.photo || null;
      const rawUrl = typeof raw === 'string' ? raw : (raw && (raw.url || raw.uri));
      setProfileImageUri(buildAbsolute(rawUrl || '') || null);
    } catch (e) {
      // ignore
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchProfile();
      fetchBookings();
    })();
  }, [fetchProfile]);

  useFocusEffect(
    useCallback(() => {
      // refresh profile image when screen gains focus (keeps it in sync with Profile page)
      fetchProfile();
      fetchBookings();
    }, [fetchProfile])
  );
  
  const formatTimeRange = (start, end) => {
    if (!start || !end) return "Unknown time";

    const format = (timeStr) => {
      const [hour, min] = timeStr.split(':');
      let hourNum = parseInt(hour, 10);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      hourNum = hourNum % 12 || 12;
      return `${hourNum}:${min} ${ampm}`;
    };

    return `${format(start)} - ${format(end)}`;
  };

  const handleDeleteBooking = (id) => {
    Alert.alert(
      "Delete Booking",
      "Are you sure you want to delete this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Call backend delete
              await api(`/bookings/${id}/`, { method: 'DELETE' });
  
              // Only update UI after successful delete
              setBookingsData(prev => prev.filter(booking => booking.id !== id));
              
              Alert.alert("Deleted", `Booking ID ${id} was successfully deleted.`, [{ text: "OK" }]);
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete booking");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.gradientStart} />
        <Text>Loading your bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={{ color: 'red' }}>{error}</Text>
        <TouchableOpacity onPress={() => {
          setLoading(true);
          setError(null);
          fetchBookings();
        }}>
          <Text style={{ color: colors.gradientStart, marginTop: 10 }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.headerBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Back button with text */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={width * 0.03} color={colors.heading} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        {/* Profile avatar in top right */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={styles.avatarIcon}>🙂</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>
      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title}>My Bookings <Text style={styles.count}>({bookingsData.length})</Text></Text>
        <FlatList
          data={bookingsData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <BookingCard
              image={item.image}
              service={item.service}
              stylist={item.stylist}
              date={item.date}
              time={item.time}
              onDelete={() => handleDeleteBooking(item.id)}
              onMessage={() => alert(`Message stylist for booking id ${item.id}`)}
              showDeleteIcon
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      {/* NAVIGATION BAR */}
      <View style={styles.navBarContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
          <Feather name="calendar" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('MessageList')}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SavedServices')}>
          <Feather name="heart" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBg: {
    width: width,
    height: height * 0.13,
    paddingTop: height * 0.06,
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: width * 0.05,
    top: height * 0.06,
    zIndex: 1,
  },
  backText: {
    fontSize: width * 0.04,
    color: colors.heading,
    fontWeight: '500',
    marginLeft: 3,
  },
  avatarWrapper: {
    position: 'absolute',
    right: width * 0.05,
    top: height * 0.06,
    zIndex: 1,
  },
  avatarOuter: { width: width * 0.12, height: width * 0.12, borderRadius: width * 0.06, backgroundColor: 'rgba(237,118,120,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: width * 0.096, height: width * 0.096, borderRadius: (width * 0.096) / 2, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarIcon: {
    fontSize: width * 0.06,
    lineHeight: width * 0.096,
    includeFontPadding: false,
    textAlign: 'center',
  },
  content: {
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.04,
    flex: 1,
  },
  title: {
    fontSize: width * 0.065,
    fontWeight: 'bold',
    color: colors.heading,
    marginBottom: height * 0.018,
    marginTop: height * 0.01,
  },
  count: {
    fontSize: width * 0.045,
    color: colors.heading,
    fontWeight: '400',
  },
  navBarContainer: {
    height: 62,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 10,
  },
});
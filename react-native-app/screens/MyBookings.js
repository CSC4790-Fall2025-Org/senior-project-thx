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

const TABS = { CLIENT: 'client', MY: 'my' };

export default function MyBookings({ navigation }) {
  const [activeTab, setActiveTab] = useState(TABS.CLIENT);
  const [clientBookings, setClientBookings] = useState([]); // you're provider
  const [myBookings, setMyBookings] = useState([]);         // you booked others
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImageUri, setProfileImageUri] = useState(null);

  const formatTimeRange = (start, end) => {
    if (!start || !end) return 'Unknown time';
    const fmt = (t) => {
      const [h, m] = t.split(':');
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${m} ${ampm}`;
    };
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const mapItem = (item, role) => {
    const base = {
      id: String(item.id),
      service: item.service_name || 'Unknown Service',
      date: item.time_detail?.date || '',
      time: formatTimeRange(item.time_detail?.start_time, item.time_detail?.end_time),
      image: { uri: item.image },
    };
    if (role === TABS.CLIENT) {
      // show client name (customer) when you're the provider
      const who = item.customer_name || 'Client';
      return { ...base, stylist: who };
    }
    // role === MY: show provider name
    const who = item.provider_name || 'Provider';
    return { ...base, stylist: who };
  };

  const fetchClient = async () => {
    const data = await api('/bookings/?role=provider');
    return (data || []).map((it) => mapItem(it, TABS.CLIENT));
  };

  const fetchMine = async () => {
    const data = await api('/bookings/');
    return (data || []).map((it) => mapItem(it, TABS.MY));
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [client, mine] = await Promise.all([fetchClient(), fetchMine()]);
      setClientBookings(client);
      setMyBookings(mine);
    } catch (e) {
      setError(e?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await api('/profile/me/');
      const raw = profile.profile_picture || profile.avatar || profile.image || profile.profile_image || profile.photo || null;
      const rawUrl = typeof raw === 'string' ? raw : (raw && (raw.url || raw.uri));
      setProfileImageUri(buildAbsolute(rawUrl || '') || null);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      await fetchProfile();
      loadAll();
    })();
  }, [fetchProfile, loadAll]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      loadAll();
    }, [fetchProfile, loadAll])
  );

  const data = activeTab === TABS.CLIENT ? clientBookings : myBookings;
  const total = data.length;

  const handleDeleteBooking = (id) => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to delete this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api(`/bookings/${id}/`, { method: 'DELETE' });
              // Only client-made bookings are deletable (scoped server-side);
              // Update client-side list optimistically:
              setMyBookings((prev) => prev.filter((b) => b.id !== id));
              Alert.alert('Deleted', `Booking ID ${id} was successfully deleted.`, [{ text: 'OK' }]);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete booking');
            }
          },
        },
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
        <TouchableOpacity onPress={loadAll}>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={width * 0.03} color={colors.heading} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarOuter}>
            <View className="avatarInner" style={styles.avatarInner}>
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
        <Text style={styles.title}>
          Bookings <Text style={styles.count}>({total})</Text>
        </Text>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab(TABS.CLIENT)}
            style={[styles.tabButton, activeTab === TABS.CLIENT && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === TABS.CLIENT && styles.tabTextActive]}>
              Client Bookings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab(TABS.MY)}
            style={[styles.tabButton, activeTab === TABS.MY && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === TABS.MY && styles.tabTextActive]}>
              My Bookings
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookingCard
              image={item.image}
              service={item.service}
              stylist={item.stylist}
              date={item.date}
              time={item.time}
              onDelete={() => handleDeleteBooking(item.id)}
              onMessage={() => alert(`Message for booking id ${item.id}`)}
              // only allow delete on "My Bookings"
              showDeleteIcon={activeTab === TABS.MY}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ paddingVertical: 32, alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>
                {activeTab === TABS.CLIENT
                  ? 'No client bookings yet.'
                  : "You haven't booked any services yet."}
              </Text>
            </View>
          }
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

const TAB_HEIGHT = 40;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  backText: { fontSize: width * 0.04, color: colors.heading, fontWeight: '500', marginLeft: 3 },
  avatarWrapper: { position: 'absolute', right: width * 0.05, top: height * 0.06, zIndex: 1 },
  avatarOuter: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    backgroundColor: 'rgba(237,118,120,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: width * 0.096,
    height: width * 0.096,
    borderRadius: (width * 0.096) / 2,
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: width * 0.06, lineHeight: width * 0.096, includeFontPadding: false, textAlign: 'center' },
  content: { marginTop: height * 0.02, paddingHorizontal: width * 0.04, flex: 1 },
  title: {
    fontSize: width * 0.065,
    fontWeight: 'bold',
    color: colors.heading,
    marginBottom: height * 0.012,
    marginTop: height * 0.01,
  },
  count: { fontSize: width * 0.045, color: colors.heading, fontWeight: '400' },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    height: TAB_HEIGHT,
    marginBottom: height * 0.012,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontSize: width * 0.038, color: '#666', fontWeight: '600' },
  tabTextActive: { color: colors.heading },

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

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
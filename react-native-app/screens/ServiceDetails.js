import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api';
import { API_BASE } from '../src/config';
import * as Linking from 'expo-linking';

const { height } = Dimensions.get('window');
const DEMO_HEADERS = {};

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const host = API_BASE.replace(/\/api\/?$/, '');
  return `${host}${url}`;
};

const ServiceDetails = ({route, navigation}) => {
  const { id } = route.params;
  const [service, setService] = useState(null);
  const [activeTab, setActiveTab] = useState('About');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch service details
      const data = await api(`/services/${id}/`);
      if (!mounted) return;

      setService(data);

      // 2️⃣ Check if current user has this service saved
      const profile = await api("/profile/me/");
      const savedServiceIds = profile.saved_services?.map(s => s.id) || [];
      setSaved(savedServiceIds.includes(data.id));

    } catch (e) {
      console.warn("Failed to load service or profile", e);
      setError(e.message || "Failed to load service");
    } finally {
      if (mounted) setLoading(false);
    }
  })();

  return () => { mounted = false; };
}, [id]);

useEffect(() => {
  if (!service) return;

  const checkSaved = async () => {
    try {
      const data = await api(`/services/${id}/`); // or service already has saved info
      setSaved(data.is_saved || false); // DRF should return is_saved boolean in GET
    } catch (err) {
      console.warn("Failed to check saved state", err);
    }
  };

  checkSaved();
}, [service]);

  const providerName = useMemo(() => {
    if (!service) return null;
    return service.provider_name || service.user_name || service.owner_name || null;
  }, [service]);

  const priceText = useMemo(() => {
    if (!service?.price) return null;
    const num = Number(service.price);
    return Number.isFinite(num) ? `$${num.toFixed(2)}` : `$${service.price}`;
  }, [service]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error || !service) {
    return (
      <View style={[styles.container, { padding: 20 }]}>
        <TouchableOpacity style={styles.backInline} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ color: 'crimson', marginTop: 12 }}>{error || 'Service not found.'}</Text>
      </View>
    );
  }

  // service.images may be array of either strings or objects {id, url}
  const images = Array.isArray(service.images) ? service.images : service.image ? [service.image] : [];
  // helper that resolves each image to a uri string suitable for <Image>
  const resolveImageUri = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return buildAbsolute(img);
    // object case: prefer obj.url, fall back to obj.uri
    return buildAbsolute(img.url || img.uri);
  };

  // Show only the first image in the top-right image area
  const firstImageUri = images && images.length > 0 ? resolveImageUri(images[0]) : null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F6C484A6', '#ED7678A6']} style={styles.gradient} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#333" />
        </TouchableOpacity>

        <View style={styles.textDetails}>
          <Text style={styles.type}>{service.name}</Text>
          {!!providerName && <Text style={styles.provider}>By {providerName}</Text>}
          {!!priceText && <Text style={styles.cost}>{priceText}</Text>}
          <TouchableOpacity 
              style={styles.favButton}
              onPress={async () => {
                try {
                  // Immediately toggle in UI for responsiveness
                  setSaved((prev) => !prev);

                  const response = await api(`/services/${id}/toggle-save/`, {
                    method: 'POST',
                  });

                  // Your DRF view returns { saved: true/false }
                  if (response?.saved !== undefined) {
                    setSaved(response.saved);
                  }
                } catch (error) {
                  console.error('Failed to toggle save:', error);
                  // Revert if API fails
                  setSaved((prev) => !prev);
                }
              }}
          >
            <FontAwesome name={saved ? "heart" : "heart-o"} size={25} color="#333" />
          </TouchableOpacity>
        </View>

        {/* IMAGE: show only the first image instead of a carousel */}
        <View style={styles.imageCarouselWrapper}>
          {firstImageUri ? (
            <Image source={{ uri: firstImageUri }} style={styles.serviceImage} />
          ) : (
            <View style={[styles.serviceImage, { backgroundColor: "#EEE" }]} />
          )}
        </View>
      </LinearGradient>

      {/* rest of UI unchanged */}
      <View style={styles.extraButtonsContainer}>
      <TouchableOpacity
  style={styles.square}
  onPress={() => {
    const destination = service.location?.trim() || 'Villanova University';

    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(destination)}`,
      android: `geo:0,0?q=${encodeURIComponent(destination)}`
    });

    Linking.openURL(url);
  }}
>
  <FontAwesome name="map-o" size={30} />
  <Text style={styles.squareLabel}>Direction</Text>
</TouchableOpacity>

        <TouchableOpacity style={styles.square} onPress={() => {/* future: open chat */}}>
          <AntDesign name="message" size={30} />
          <Text style={styles.squareLabel}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.square} onPress={() => {/* future: share */}}>
          <Feather name="share-2" size={30} />
          <Text style={styles.squareLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.aboutReviewsContainer}>
        <View style={styles.aboutReviewsBox}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'About' && styles.activeTabButton]} onPress={() => setActiveTab('About')}>
            <Text style={[styles.tabText, activeTab === 'About' && styles.activeTabText]}>About</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabButton, activeTab === 'Review' && styles.activeTabButton]} onPress={() => setActiveTab('Review')}>
            <Text style={[styles.tabText, activeTab === 'Review' && styles.activeTabText]}>Review</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContentWrapper}>
        {activeTab === 'About' ? (
          <View style={styles.aboutScrollContainer}>
            <ScrollView style={styles.tabContentScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.tabContentText}>{service.description || 'No description provided.'}</Text>
            </ScrollView>
          </View>
        ) : (
          <Text style={styles.tabContentText}>(No reviews yet)</Text>
        )}
      </View>

      {/* RECENT WORKS */}
      <View style={styles.recentWorksContainer}>
        <View style={styles.recentWorksCard}>
          <Text style={styles.recentTitle}>Recent Works</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentImageRow}>
            {images && images.length > 0 ? (
              images.map((img, idx) => {
                const uri = resolveImageUri(img);
                return (
                  <View key={idx} style={styles.recentImageWrapper}>
                    <Image source={{ uri }} style={styles.recentImage} />
                  </View>
                );
              })
            ) : (
              <Text style={styles.noWorksText}>No recent works yet.</Text>
            )}
          </ScrollView>
        </View>
      </View>

      <TouchableOpacity
        style={styles.appointmentButton}
        onPress={() =>
          navigation.navigate('BookingInfo', {
            serviceId: service.id,
            serviceName: service.name,
            price: service.price,
            slots: service.availabilities ?? [],
          })
        }
      >
        <Text style={styles.appointmentText}>Book Appointment</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ServiceDetails;

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 86 },

  gradient: { height: height * 0.29, width: '100%' },
  backInline: { flexDirection: 'row', alignItems: 'center' },
  backButton: { position: 'absolute', top: '20%', left: '3.6%' },

  textDetails: { position: 'absolute', top: '28.7%', left: '5%' },
  imageCarouselWrapper: { position: 'absolute', top: '28.7%', right: 0, height: 160, width: 160, paddingRight: 8 },

  serviceImage: { width: 160, height: 160, borderRadius: 10, marginLeft: 8 },

  type: { fontSize: 35, fontWeight: 'bold', marginBottom: 1, marginTop: 25, color: '#3C1E10' },
  provider: { fontSize: 15, color: '#3C1E10', marginBottom: 10 },
  cost: { fontSize: 25, fontWeight: 'bold', color: '#3C1E10' },
  favButton: { position: 'absolute', right: -60, top: 10 },

  extraButtonsContainer: {
    width: '100%',
    height: height * 0.17,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  square: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareLabel: {
    fontSize: 15,
    color: '#333',
    marginTop: 6,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },

  aboutReviewsContainer: { height: 60, width: '100%', alignItems: 'center', justifyContent: 'center' },
  aboutReviewsBox: {
    height: 50,
    width: 347,
    backgroundColor: '#F6C484',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  tabButton: { paddingVertical: 8, minWidth: 150, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 16, color: '#3C1E10', fontFamily: 'Poppins' },
  activeTabButton: { backgroundColor: '#fff' },
  activeTabText: { color: '#3C1E10' },

  tabContentWrapper: { alignItems: 'center', flex: 1 },
  aboutScrollContainer: { minHeight: height * 0.22 },
  tabContentScroll: { width: 347, paddingHorizontal: 5, paddingVertical: 10 },
  tabContentText: { fontSize: 20, color: '#3C1E10', fontFamily: 'Poppins', lineHeight: 30 },

  recentWorksContainer: { paddingHorizontal: 16, marginTop: 12, marginBottom: 0 },
  recentWorksCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  recentTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, color: '#111' },
  recentImageRow: { paddingLeft: 4, paddingRight: 8, alignItems: 'center' },
  recentImageWrapper: {
    marginRight: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  recentImage: { width: 90, height: 90, borderRadius: 10 },

  noWorksText: { color: '#666', paddingVertical: 8 },

  appointmentButton: {
    position: 'absolute',
    bottom: 16, 
    left: '5%',
    width: '90%',
    height: 52,
    backgroundColor: '#ED7678',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  appointmentText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins' },
});
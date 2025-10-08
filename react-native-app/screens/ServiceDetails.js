import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Image, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../src/api';

const { height } = Dimensions.get('window'); 
const DEMO_HEADERS = {};
 
const ServiceDetails = ({route, navigation}) => { 
    const { id } = route.params; // ← we navigate here with { id } from Home
    const [service, setService] = useState(null);
    const [activeTab, setActiveTab] = useState('About');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        let mounted = true;
        (async () => {
        try {
            setError('');
            setLoading(true);
            const data = await api(`/services/${id}/`, { headers: { ...DEMO_HEADERS } });
            if (mounted) setService(data);
        } catch (e) {
            if (mounted) setError(e.message?.toString() || 'Failed to load service.');
        } finally {
            if (mounted) setLoading(false);
        }
        })();
        return () => {
        mounted = false;
        };
    }, [id]); 

    const providerName = useMemo(() => {
        if (!service) return null;
        return service.provider_name || service.user_name || service.owner_name || null;
    }, [service]);

    const priceText = useMemo(() => {
        if (!service?.price) return null;
        const num = Number(service.price);
        return Number.isFinite(num) ? `$${num.toFixed(2)}` : `$${service.price}`;
    }, [service]);

    const onBook = () => {
        // Pass slots to BookingInfo
        navigation.navigate('BookingInfo', {
            serviceId: service.id,
            serviceName: service.name,
            price: service.price,
            slots: service.availabilities || [],
        });
    };

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

    return (
        <View style={styles.container}>
        {/* HEADER / GRADIENT */}
        <LinearGradient
            colors={['#F6C484A6', '#ED7678A6']}
            style={styles.gradient}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
        >
            {/* BACK BUTTON */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={30} color="#333" />
            </TouchableOpacity>

            {/* SERVICE INFO */}
            <View style={styles.textDetails}>
            <Text style={styles.type}>{service.name}</Text>
            {!!providerName && <Text style={styles.provider}>By {providerName}</Text>}
            {!!priceText && <Text style={styles.cost}>{priceText}</Text>}
            {/* Heart (optional: wire PATCH /api/services/{id}/ isSaved) */}
            <TouchableOpacity style={styles.favButton} onPress={() => { /* toggle save later */ }}>
                <Feather name="heart" size={25} color="#333" />
            </TouchableOpacity>
            </View>

            {/* IMAGE (if you later send a URL string in service.image) */}
            {service.image ? (
            <Image source={{ uri: service.image }} style={styles.serviceImage} />
            ) : (
            <View style={[styles.serviceImage, { backgroundColor: '#EEE' }]} />
            )}
        </LinearGradient>

        {/* MORE DETAILS (kept as-is visually) */}
        <View style={styles.extraButtonsContainer}>
            <TouchableOpacity style={styles.square}>
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

        {/* ABOUT & REVIEWS TABS */}
        <View style={styles.aboutReviewsContainer}>
            <View style={styles.aboutReviewsBox}>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'About' && styles.activeTabButton]}
                onPress={() => setActiveTab('About')}
            >
                <Text style={[styles.tabText, activeTab === 'About' && styles.activeTabText]}>
                About
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabButton, activeTab === 'Review' && styles.activeTabButton]}
                onPress={() => setActiveTab('Review')}
            >
                <Text style={[styles.tabText, activeTab === 'Review' && styles.activeTabText]}>
                Review
                </Text>
            </TouchableOpacity>
            </View>
        </View>

        {/* TAB CONTENT */}
        <View style={styles.tabContentWrapper}>
            {activeTab === 'About' ? (
            <View style={styles.aboutScrollContainer}>
                <ScrollView style={styles.tabContentScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.tabContentText}>
                    {service.description || 'No description provided.'}
                </Text>
                </ScrollView>
            </View>
            ) : (
            <Text style={styles.tabContentText}>(No reviews yet)</Text>
            )}
        </View>

        {/* BOOK APPOINTMENT BUTTON */}
        <TouchableOpacity
            style={styles.appointmentButton}
            onPress={() =>
                navigation.navigate('BookingInfo', {
                serviceId: service.id,
                serviceName: service.name,
                price: service.price,
                slots: service.availabilities ?? [], // [{id,date,start_time,end_time}]
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
  container: { flex: 1, paddingBottom: 10 },

  // GRADIENT CONTENT
  gradient: { height: height * 0.29, width: '100%' },
  backInline: { flexDirection: 'row', alignItems: 'center' },
  backButton: { position: 'absolute', top: '20%', left: '3.6%' },

  textDetails: { position: 'absolute', top: '28.7%', left: '5%' },
  serviceImage: { position: 'absolute', width: 160, height: 160, borderRadius: 10, top: '28.7%', right: '5%' },

  type: { fontSize: 35, fontWeight: 'bold', marginBottom: 1, marginTop: 25, color: '#3C1E10' },
  provider: { fontSize: 15, color: '#3C1E10', marginBottom: 10 },
  cost: { fontSize: 25, fontWeight: 'bold', color: '#3C1E10' },
  favButton: { position: 'absolute', right: -60, top: 10 },

  // MORE DETAILS BUTTON CONTENT
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

  // ABOUT & REVIEWS CONTENT
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
  aboutScrollContainer: { height: height * 0.20 },
  tabContentScroll: { width: 347, paddingHorizontal: 5, paddingVertical: 10 },
  tabContentText: { fontSize: 20, color: '#3C1E10', fontFamily: 'Poppins', lineHeight: 30 },

  // BOOK BUTTON
  appointmentButton: {
    position: 'absolute',
    bottom: '3%',
    left: '5%',
    width: '90%',
    height: 50,
    backgroundColor: '#ED7678',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins' },
});
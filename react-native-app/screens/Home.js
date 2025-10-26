import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from '../src/api';
import { API_BASE } from '../src/config';

const { height } = Dimensions.get('window'); 

// TOP_CATEGORIES now includes icon metadata (library + name)
const TOP_CATEGORIES = [
  { id: 'Haircuts', name: 'Haircuts', iconLib: 'Feather', iconName: 'scissors' },
  { id: 'Nails', name: 'Nails', iconLib: 'FontAwesome5', iconName: 'paint-brush' },
  { id: 'Cooking', name: 'Cooking', iconLib: 'MaterialCommunityIcons', iconName: 'chef-hat' },
  { id: 'Tutoring', name: 'Tutoring', iconLib: 'MaterialCommunityIcons', iconName: 'school' },
  { id: 'Makeup', name: 'Makeup', iconLib: 'FontAwesome5', iconName: 'palette' },
];

const DEMO_HEADERS = {};

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const host = API_BASE.replace(/\/api\/?$/, '');
  return `${host}${url}`;
};

const Home = ({navigation}) => { 
    const [profileLoading, setProfileLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [profileImageUri, setProfileImageUri] = useState(null);

    const [services, setServices] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // debounce search input -> updates 'search' after 350ms pause
    const debounceTimer = useRef(null);
    const [search, setSearch] = useState('');
    const onChangeSearch = useCallback((txt) => {
        setSearchText(txt);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => setSearch(txt), 350);
    }, []);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (search.trim()) params.append('name', search.trim());
        if (selectedTag.trim()) params.append('tag', selectedTag.trim());
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }, [search, selectedTag]);

    const fetchServices = useCallback(async (showSpinner = true) => {
        try {
        setError('');
        if (showSpinner) setLoading(true);
        const data = await api(`/services/${queryString}`, { headers: { ...DEMO_HEADERS } });
        const normalized = (Array.isArray(data) ? data : []).map((svc) => {
            // pick first image if present
            const firstImage = Array.isArray(svc.images) && svc.images.length ? svc.images[0] : null;
            const imageUrl = firstImage ? (typeof firstImage === 'string' ? buildAbsolute(firstImage) : buildAbsolute(firstImage.url)) : null;
            return {
                id: svc.id,
                name: svc.name,
                price: svc.price,
                type: svc.type,
                providerName: svc.provider_name || 'Unknown',
                imageUrl,
                availability: svc.availability || [],
                ownerId: svc.user_id|| null,
            };
        });

        const filtered = currentUserId
            ? normalized.filter(service => String(service.ownerId).trim() !== String(currentUserId).trim())
            : normalized;

        setServices(filtered);


        } catch (e) {
        setError(e.message?.toString() || 'Failed to load services');
        } finally {
        if (showSpinner) setLoading(false);
        }
    }, [queryString, currentUserId]);

    // fetch profile (used on mount and on focus when returning to screen)
    const fetchProfile = useCallback(async () => {
      setProfileLoading(true);
      try {
        const profile = await api('/profile/me/');
        setCurrentUserId(profile.id);
        const raw = profile.profile_picture || profile.avatar || profile.image || profile.profile_image || profile.photo || null;
        const rawUrl = typeof raw === 'string' ? raw : (raw && (raw.url || raw.uri));
        setProfileImageUri(buildAbsolute(rawUrl || '') || null);
      } catch (e) {
        console.warn('Failed to load user profile for filtering', e);
      } finally {
        setProfileLoading(false);
      }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        if (!profileLoading && currentUserId !== null) {
          fetchServices(true);
        }
        return () => debounceTimer.current && clearTimeout(debounceTimer.current);
    }, [fetchServices, currentUserId, profileLoading]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
          // refresh profile image and services on returning to Home
          fetchProfile();
          if (currentUserId !== null) {
            fetchServices(true);
          }
        });
        return unsubscribe;
    }, [navigation, fetchServices, currentUserId, fetchProfile]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchServices(false);
        setRefreshing(false);
    }, [fetchServices]);

    const onPressCategory = useCallback((tagName) => {
        setSelectedTag((prev) => (prev === tagName ? '' : tagName));
    }, []);

    // helper to render icon based on the category's iconLib
    const renderCategoryIcon = (cat, size = 36, color = "#222") => {
      const { iconLib, iconName } = cat;
      const iconProps = { name: iconName, size, color };
      switch (iconLib) {
        case 'Feather':
          return <Feather {...iconProps} />;
        case 'FontAwesome5':
          return <FontAwesome5 {...iconProps} solid={false} />;
        case 'MaterialCommunityIcons':
          return <MaterialCommunityIcons {...iconProps} />;
        case 'Ionicons':
          return <Ionicons {...iconProps} />;
        default:
          return <Feather name="circle" size={size} color={color} />;
      }
    };

    const renderCategory = ({ item }) => {
        const isActive = selectedTag === item.name;
        return (
        <View style={styles.serviceItem}>
            <TouchableOpacity
            style={[styles.serviceCircle, isActive && styles.serviceCircleActive]}
            onPress={() => onPressCategory(item.name)}
            activeOpacity={0.8}
            >
              <View style={styles.iconWrapper}>
                {renderCategoryIcon(item, 37, isActive ? '#ED7678' : '#333')}
              </View>
            </TouchableOpacity>
            <Text style={[styles.serviceTypeText, isActive && { color: '#ED7678', fontWeight: '700' }]}>{item.name}</Text>
        </View>
        );
    };

    const renderService = ({ item }) => {
        return(
        <View style={styles.serviceCard}>
        <View style={styles.cardContent}>
            {/* Show first image if available */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} />
            ) : (
              <View style={styles.serviceImage} />
            )}
            <View style={styles.serviceInfo}>
            <Text style={styles.serviceType}>{item.name}</Text>
            <Text style={styles.providerName}>by {item.providerName || 'Unknown'}</Text>
            <Text style={styles.serviceCost}>${Number(item.price).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
            style={styles.bookButton}
            onPress={() => navigation.navigate('ServiceDetails', { id: item.id })}
            >
            <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
        </View>
        </View>
    );
    };

    if(profileLoading) {
        return(
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return ( 
        <View style={styles.container}> 
        {/* LINEAR GRADIENT CONTENT */} 
            <LinearGradient 
                colors={['#F6C484A6', '#ED7678A6']} 
                style={styles.gradient} 
                start={{ x: 0, y: 1 }} 
                end={{ x: 1, y: 0 }} 
            > 
                <Text style= {styles.helloText}>Hello!</Text> 

                {/* Avatar with pink outer background and white inner circle (image or emoji) */}
                <TouchableOpacity style ={styles.profileFrame} onPress={() => navigation.navigate('Profile')}>
                  <View style={styles.avatarOuter}>
                    <View style={styles.avatarInner}>
                      {profileImageUri ? (
                        <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
                      ) : (
                        <Text style={styles.profileEmoji}>🙂</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity> 
                
                <View style ={styles.textInputBox}> 
                    <View style ={styles.searchIcon}> 
                        <EvilIcons name="search" size={24}/> 
                    </View> 
                    <TextInput
                        style={styles.input}
                        placeholder="Search for services"
                        placeholderTextColor="#646464"
                        value={searchText}
                        onChangeText={onChangeSearch}
                        returnKeyType="search"
                    /> 
                </View> 
            </LinearGradient> 

            {/* TOP CATEGORIES */}
            <View style={styles.categoryContent}>
                <Text style={styles.topServiceText}>TOP SERVICES</Text>
                <FlatList
                data={TOP_CATEGORIES}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
                renderItem={renderCategory}
                />
            </View>

            {/* SERVICES */}
            <View style={styles.serviceContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.servicesText}>SERVICES</Text>
                {!!selectedTag && (
                    <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => setSelectedTag('')}>
                    <Text style={{ color: '#ED7678' }}>Clear “{selectedTag}”</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.scrollArea}>
                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" />
                    </View>
                ) : error ? (
                    <View style={{ padding: 16 }}>
                    <Text style={{ color: 'crimson' }}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchServices(true)} style={{ marginTop: 8 }}>
                        <Text style={{ color: '#ED7678' }}>Retry</Text>
                    </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                    data={services}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderService}
                    contentContainerStyle={styles.servicesScroll}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={<View style={{ padding: 16 }}><Text>No services found.</Text></View>}
                    />
                )}
                </View>
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
                </TouchableOpacity > 
                <TouchableOpacity onPress={() => navigation.navigate('SavedServices')}> 
                    <Feather name="heart" size={28} color="#333" /> 
                </TouchableOpacity> 
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}> 
                    <Ionicons name="person-outline" size={28} color="#333" /> 
                </TouchableOpacity> 
            </View> 
        </View> 
      ); 
    }; 

const styles = StyleSheet.create({
  container: { flex: 1 },

  // LINEAR GRADIENT CONTENT
  gradient: { height: height * 0.245, width: '100%', position: 'relative', top: 0, left: 0, zIndex: 1 },
  helloText: { position: 'absolute', left: '4.6%', top: '42.8%', fontSize: 20, fontWeight: 'bold', fontFamily: 'Poppins' },

  // avatar/frame
  profileFrame: { position: 'absolute', right: '4.6%', top: '35%', height: 56, width: 56, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  avatarOuter: { width: 56, height: 56, borderRadius: 56, backgroundColor: 'rgba(237,118,120,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: 48, height: 48, borderRadius: 48, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  profileEmoji: { fontSize: 26, lineHeight: 48, includeFontPadding: false, textAlign: 'center' },

  filterFrame: { position: 'absolute', right: '5.2%', top: '63.2%', height: 47, width: 47, borderRadius: 10, backgroundColor: '#F6C484' },
  filterIcon: { position: 'absolute', left: '23.5%', top: '23.5%', height: 25, width: 25 },
  textInputBox: { position: 'absolute', left: '4.6%', top: '63.6%', height: 47, width: 375, borderRadius: 10, backgroundColor: '#FFFFFF' },
  searchIcon: { position: 'relative', left: '5.4%', top: '25%', height: 24, width: 24 },
  input: { position: 'absolute', left: '18.3%', top: '29.8%', height: 18, width: 227, fontFamily: 'Poppins', fontSize: 13, color: '#000', padding: 0 },

  // TOP SERVICES CONTENT
  categoryContent: { height: height * 0.20, width: '100%', position: 'relative', zIndex: 1 },
  topServiceText: { position: 'absolute', left: '4.4%', top: '8%', fontSize: 24, fontWeight: 'bold', fontFamily: 'Poppins' },
  carouselContainer: { paddingLeft: 20, paddingRight: 20, marginTop: 60, gap: 20, flexDirection: 'row' },
  serviceItem: { alignItems: 'center', width: 92 },
  serviceCircle: { height: 85, width: 85, borderRadius: 1000, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  serviceCircleActive: { borderWidth: 2, borderColor: '#ED7678' },
  iconWrapper: { justifyContent: 'center', alignItems: 'center' },
  serviceTypeText: { marginTop: 8, textAlign: 'center', fontSize: 13, fontFamily: 'Poppins', color: '#594C46' },

  // SERVICES LIST
  serviceContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  servicesText: { fontSize: 24, fontWeight: 'bold', fontFamily: 'Poppins', color: '#000', marginBottom: 10 },
  scrollArea: { flex: 1 },
  servicesScroll: { paddingBottom: 90, gap: 10 },

  // SERVICE CARD CONTENT
  serviceCard: { height: 150, width: 350, borderRadius: 15, backgroundColor: '#fff', alignSelf: 'center', justifyContent: 'center', borderBottomColor: '#ccc', borderBottomWidth: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 15, position: 'relative' },
  serviceImage: { width: 120, height: 120, borderRadius: 10, marginRight: 15, backgroundColor: '#EEE' },
  serviceInfo: { flex: 1 },
  serviceType: { fontSize: 16, fontWeight: '600', fontFamily: 'Poppins', color: '#1E1E1E', marginBottom: 5 },
  providerName: { fontSize: 13, fontWeight: '500', fontFamily: 'Poppins', color: '#555', marginBottom: 5 },
  serviceCost: { fontSize: 18, fontFamily: 'Poppins', fontWeight: 'bold', color: '#000000', marginBottom: 10 },
  bookButton: { alignSelf: 'flex-start', position: 'absolute', right: '5.8%', top: '60%', backgroundColor: '#ED7678', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10 },
  bookButtonText: { fontFamily: 'Poppins', fontSize: 12, color: '#FFFFFF' },

  // NAV BAR
  navBarContainer: { height: '9%', width: '100%', position: 'absolute', bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ccc', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', zIndex: 10 },
});

export default Home;
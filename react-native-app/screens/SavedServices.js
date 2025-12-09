import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator } from 'react-native'; 
import { LinearGradient } from 'expo-linear-gradient'; 
import EvilIcons from 'react-native-vector-icons/EvilIcons'; 
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import Feather from 'react-native-vector-icons/Feather'; 
import ServiceList from '../components/ServiceList'; 
import { api } from '../src/api';
import { API_BASE } from '../src/config';

const { height } = Dimensions.get('window'); 

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const host = API_BASE.replace(/\/api\/?$/, "");
  return `${host}${url}`;
};

const SavedServices = ({navigation}) => { 
    const [profileLoading, setProfileLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [services, setServices] = useState([]);
    const [profileImageUri, setProfileImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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

    const fetchSavedServices = useCallback(async () => {
    try {
        setLoading(true);
        setError('');

        const data = await api(`/profile/me/`);

        const normalized = (Array.isArray(data.saved_services) ? data.saved_services : []).map((svc) => {
            let imageUrl = null;
            if (Array.isArray(svc.images) && svc.images.length > 0) {
                const firstImage = svc.images[0];
                imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;
            }
            return {
                id: svc.id,
                service: svc.name,
                provider: svc.provider_name || 'Unknown',
                price: svc.price,
                imageUri: imageUrl ? { uri: buildAbsolute(imageUrl) } : null,
                };
        });

        setServices(normalized);
    } catch (e) {
        console.error('Failed to fetch saved services:', e);
        setError(e.message?.toString() || 'Failed to load saved services');
    } finally {
        setLoading(false);
    }
    }, []);


    useFocusEffect(
      useCallback(() => {
          if (!profileLoading && currentUserId) {
          fetchSavedServices();
          }
      }, [profileLoading, currentUserId, fetchSavedServices])
    );

    return ( 
        <View style={styles.container}> 
        {/* LINEAR GRADIENT CONTENT */} 
            <LinearGradient 
                colors={['#F6C484A6', '#ED7678A6']} 
                style={styles.gradient} 
                start={{ x: 0, y: 1 }} 
                end={{ x: 1, y: 0 }} 
            > 
                 <Image source ={require('../assets/logo.png')} style={styles.logo} /> 

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
                
                {/* SEARCH BOX */} 
                <View style ={styles.textInputBox}> 
                    <View style ={styles.searchIcon}> 
                        <EvilIcons name="search" size={24}/> 
                    </View> 
                    <TextInput 
                        style={styles.input} 
                        placeholder="Search for services" 
                        placeholderTextColor="#646464" 
                    /> 
                </View> 
            </LinearGradient> 

            {/* SCROLL SERVICES */} 
            <View style={styles.serviceContainer}> 
                <Text style={styles.servicesText}>
                  Saved Services ({services.length})
                </Text> 
                <View style= {styles.scrollArea}> 
                    {services.length > 0 ? (
                        <ServiceList services={services} navigation={navigation} />
                    ) : (
                        <Text style={styles.emptyText}>You haven't saved any services yet.</Text>
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

    container: { 
        flex: 1, 
    }, 
    gradient: { 
        height: height * 0.245,  
        width: '100%', 
        position: 'relative', 
        top: 0, 
        left: 0, 
        zIndex: 1, 
    }, 
    logo: { position: 'absolute', left: '-5%', top: '30%', height: 60, width: 150, resizeMode: 'contain' },

    // helloText: { 
    //     position: 'absolute', 
    //     left: '4.6%', 
    //     top: '42.8%', 
    //     fontSize: 20, 
    //     fontWeight: 'bold', 
    //     fontFamily: 'Poppins', 
    // }, 
    profileFrame: { 
        position: 'absolute', 
        right:'4.6%', 
        top: '30.9%', 
        height: 56, 
        width: 56, 
        borderRadius: 56, 
        alignItems: 'center', 
        justifyContent: 'center' 
    }, 
    avatarOuter: { width: 56, height: 56, borderRadius: 56, backgroundColor: 'rgba(237,118,120,0.12)', alignItems: 'center', justifyContent: 'center' },
    avatarInner: { width: 48, height: 48, borderRadius: 48, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    profileEmoji: { fontSize: 26, lineHeight: 48, includeFontPadding: false, textAlign: 'center' },
    filterFrame: { 
        position: 'absolute', 
        right:'5.2%', 
        top: '63.2%', 
        height: 47, 
        width: 47, 
        borderRadius: 10, 
        backgroundColor: '#F6C484', 
    }, 
    filterIcon:{ 
        position:'absolute', 
        left:'23.5%', 
        top: '23.5%', 
        height: 25, 
        width: 25, 
    }, 
    textInputBox: { 
        position: 'absolute', 
        left:'4.1%', 
        top: '63.6%', 
        height: 47, 
        width: '91.7%', 
        borderRadius: 10, 
        backgroundColor: '#FFFFFF', 
    }, 
    searchIcon:{ 
        position: 'relative', 
        left:'5.4%', 
        top: '25%', 
        height: 24, 
        width: 24, 
    }, 
    input: { 
        position: 'absolute', 
        left: '18.3%', 
        top: '29.8%', 
        height: 18, 
        width: 227, 
        fontFamily: 'Poppins', 
        fontSize: 13, 
        color: '#000', 
        padding: 0,  
    }, 
    categoryContent:{ 
        height: height * 0.20,  
        width: '100%', 
        position: 'relative', 
        zIndex: 1, 
    }, 
    topServiceText:{ 
        position: 'absolute', 
        left: '4.4%', 
        top: '8%', 
        fontSize: 24, 
        fontWeight: 'bold', 
        fontFamily: 'Poppins', 
    }, 
    carouselContainer: { 
        paddingLeft: 20, 
        paddingRight: 20, 
        marginTop: 60,  
        gap: 20, 
        flexDirection: 'row', 
    }, 
    serviceItem: { 
        alignItems: 'center', 
        width: 92, 
    }, 
    serviceCircle: { 
        height: 85, 
        width: 85, 
        borderRadius: 1000, 
        backgroundColor: '#fff', 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 6, 
        shadowColor: '#000', 
        shadowOpacity: 0.08, 
        shadowOffset: { width: 0, height: 4 }, 
        shadowRadius: 8, 
    }, 
    iconWrapper: { justifyContent: 'center', alignItems: 'center' },
    serviceTypeText: { marginTop: 8, textAlign: 'center', fontSize: 13, fontFamily: 'Poppins', color: '#594C46' },
    serviceContainer:{ 
        flex: 1, 
        paddingHorizontal: 20, 
        paddingTop: 20, 
    }, 
    servicesText: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        fontFamily: 'Poppins', 
        color: '#000', 
        marginBottom: 10, 
    }, 
    scrollArea: { 
        flex: 1,  
    }, 
    servicesScroll: { 
        paddingBottom: 90, 
        gap: 10, 
    }, 
    navBarContainer: { height: '10%', width: '100%', position: 'absolute', bottom: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ccc', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', zIndex: 10 },
}); 

export default SavedServices;
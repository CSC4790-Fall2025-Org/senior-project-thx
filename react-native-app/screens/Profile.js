import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';
import AppStyles, { colors } from '../styles/AppStyles';
import ServiceCard from '../styles/ServiceCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { api } from "../src/api";
import { API_BASE } from "../src/config";

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.10;

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const host = API_BASE.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${host}${url}` : `${host}/${url}`;
};

export default function Profile() {
  const [user, setUser] = useState({ services: [], location: '' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  const [originalEmail, setOriginalEmail] = useState('');
  const [originalLocation, setOriginalLocation] = useState('');

  const navigation = useNavigation();

  const normalizeService = (s) => {
    // normalize images: prefer s.images array, fallback s.image
    const srvImages = Array.isArray(s.images) ? s.images : s.image ? [s.image] : [];
    const first = srvImages[0] || null;

    const imageObj = first
      ? (typeof first === 'string'
          ? { uri: buildAbsolute(first) }
          : { id: first.id, uri: buildAbsolute(first.url || first.uri) })
      : null;

    return {
      ...s,
      service_id: s.id,
      tag: s.type,
      price: Number(s.price),
      image: imageObj,
    };
  };

  // If the profile response doesn't include image data for services,
  // fetch each service detail and merge images. This is a safe client-side fallback.
  const enrichServicesWithDetailsIfNeeded = async (rawServices = []) => {
    if (!Array.isArray(rawServices) || rawServices.length === 0) return [];
    // limit parallelism if you expect many services; for now fetch all
    const enriched = await Promise.all(
      rawServices.map(async (s) => {
        try {
          const hasImages =
            (Array.isArray(s.images) && s.images.length > 0) || s.image;
          if (hasImages) {
            // already has images, just return normalized
            return normalizeService(s);
          }
          // fetch detail to get images
          const id = s.id ?? s.service_id;
          if (!id) return normalizeService(s);
          const detail = await api(`/services/${id}/`);
          // merge images from detail if present
          const merged = { ...s, images: detail.images ?? detail.image ?? s.images };
          return normalizeService(merged);
        } catch (err) {
          console.log(`enrichServices: failed to fetch detail for service ${s.id || s.service_id}`, err);
          return normalizeService(s);
        }
      })
    );
    return enriched;
  };

  // LOAD PROFILE (initial)
  useEffect(() => {
    (async () => {
      console.log("PROFILE EFFECT START");
      try {
        const myInfo = await api('/profile/me/');
        console.log("PROFILE /me (raw):", myInfo);

        // attempt to enrich services with images if the profile response omitted them
        const enrichedServices = await enrichServicesWithDetailsIfNeeded(myInfo.services || []);
        console.log("PROFILE normalized services (count):", enrichedServices.length);
        enrichedServices.forEach((svc, i) => {
          console.log(` service[${i}] id=${svc.id || svc.service_id} image=`, svc.image);
        });

        setUser({ ...myInfo, services: enrichedServices });
        setName(myInfo.name || '');
        setEmail(myInfo.email || '');
        setLocation(myInfo.location || '');
        setOriginalEmail(myInfo.email || '');
        setOriginalLocation(myInfo.location || '');
      } catch (e) {
        console.log("PROFILE LOAD ERROR", e);
        alert('Failed to load user info');
      }
    })();
  }, []);

  // reload on focus (so after edits the profile refreshes)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      (async () => {
        try {
          const myInfo = await api("/profile/me/");
          // enrich again to ensure images are present
          const enriched = await enrichServicesWithDetailsIfNeeded(myInfo.services || []);
          console.log("PROFILE reload normalized services:", enriched.map(s => ({ id: s.id || s.service_id, image: s.image })));
          setUser({ ...myInfo, services: enriched });
          setName(myInfo.name || "");
          setEmail(myInfo.email || "");
          setOriginalEmail(myInfo.email || "");
          setOriginalLocation(myInfo.location || "");
          setLocation(myInfo.location || "");
        } catch (e) {
          console.log("PROFILE reload error", e);
          alert("Failed to reload profile info");
        }
      })();
    });
    return unsubscribe;
  }, [navigation]);

  const handleDeleteService = async (service_id) => {
    try {
      await api(`/services/${service_id}/`, { method: 'DELETE' });
      setUser(prevUser => ({
        ...prevUser,
        services: prevUser.services.filter(s => s.service_id !== service_id)
      }));
      alert('Service deleted!');
    } catch (e) {
      alert('Failed to delete service');
    }
  };

  const handleSave = async () => {
    try {
      const updatedInfo = await api('/profile/me/', {
        method: 'PATCH',
        body: JSON.stringify({ name, location }),
      });

      const services = (updatedInfo.services || []).map(s => ({
        ...s,
        service_id: s.id,
        tag: s.type,
        price: Number(s.price),
        providerName: updatedInfo||'',
      }));

      setUser({ ...updatedInfo, services });
      setOriginalEmail(updatedInfo.email);
      setOriginalLocation(updatedInfo.location);
      alert('Profile changes saved!');
    } catch (e) {
      alert('Failed to save profile changes');
    }
  };

  const isChanged = email !== originalEmail || location !== originalLocation;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={AppStyles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
          style={[AppStyles.headerBg, { zIndex: 20, elevation: 20 }]}
        />

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 16, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[AppStyles.profileRow, { marginTop: 0 }]}>
            <View style={AppStyles.avatarCircle}>
              <Text style={AppStyles.avatarIcon}>🙂</Text>
            </View>
            <TextInput
              style={AppStyles.nameText}
              value={name || ''}
              onChangeText={setName}
              editable={true}
              placeholder="Your Name"
              placeholderTextColor={colors.textPrimary}
            />
          </View>

          <View style={AppStyles.inputSection}>
            <Text style={AppStyles.label}>Email</Text>
            <TextInput
              style={AppStyles.input}
              value={email}
              // onChangeText={setEmail}
              editable={false}
              // autoCapitalize="none"
            />
            <Text style={AppStyles.label}>Location</Text>
            <TextInput
              style={AppStyles.input}
              value={location || ''}
              onChangeText={setLocation}
              editable={true}
            />
          </View>

          <TouchableOpacity
            style={AppStyles.addServicesBtn}
            onPress={() => navigation.navigate('AddServices')}
          >
            <Text style={AppStyles.addServicesText}>Add Services</Text>
          </TouchableOpacity>

          {user.services && Array.isArray(user.services) && (
            <View style={AppStyles.servicesContainer}>
              {user.services.map(service => (
                <ServiceCard
                  key={service.service_id}
                  image={service.image}
                  title={service.name}
                  price={`$${(service.price || 0).toFixed(2)}`}
                  category={service.tag}
                  onEdit={() => navigation.navigate('EditServices', {
                    service_id: service.service_id || service.id,
                  })}
                  onDelete={() => handleDeleteService(service.service_id)}
                />
              ))}
            </View>
          )}

          {email !== originalEmail || location !== originalLocation ? (
            <TouchableOpacity
              style={[AppStyles.addServicesBtn, { marginBottom: 24, marginTop: 10 }]}
              onPress={handleSave}
            >
              <Text style={AppStyles.addServicesText}>Save</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

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
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
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
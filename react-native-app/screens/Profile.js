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
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AppStyles, { colors } from '../styles/AppStyles';
import ServiceCard from '../styles/ServiceCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { api } from "../src/api";
import { API_BASE } from "../src/config";
import ImageGalleryPicker from '../components/ImageGalleryPicker'; // adjust path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.13;
const AVATAR_SIZE = 96; // adjust avatar size here

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const host = API_BASE.replace(/\/api\/?$/, '');
  return url.startsWith('/') ? `${host}${url}` : `${host}/${url}`;
};

const availableLocations = [
  "Alumni Hall",
  "Austin Hall",
  "Canon Hall",
  "Caughlin Hall",
  "Connelly Center",
  "Corr Hall",
  "Delurey Hall",
  "Dobbin Hall",
  "Farley Hall",
  "Fedigan Hall",
  "Friar Hall",
  "Gallen Hall",
  "Good Counsel Hall",
  "Hovnanian Hall",
  "Jackson Hall",
  "Klekotka Hall",
  "McGuinn Hall",
  "McGuire Hall",
  "Moriarty Hall",
  "Moulden Hall",
  "O'Dwyer Hall",
  "Rudolph Hall",
  "St. Clare Hall",
  "St. Katharine Hall",
  "St. Mary Hall",
  "St. Rita Hall",
  "Sheehan Hall",
  "Stanford Hall",
  "Sullivan Hall",
  "Trinity Hall",
  "Welsh Hall",
];

export default function Profile() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    availableLocations.map((loc) => ({ label: loc, value: loc }))
  );

  const [user, setUser] = useState({ services: [], location: '' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  // Track originals so we know when to show "Save"
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalLocation, setOriginalLocation] = useState('');

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarSelection, setAvatarSelection] = useState([]); // array of { uri }
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      // keep price as received; format when rendering
      price: s.price,
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
      try {
        const myInfo = await api('/profile/me/');
        const enrichedServices = await enrichServicesWithDetailsIfNeeded(myInfo.services || []);
        setUser({ ...myInfo, services: enrichedServices });
        setName(myInfo.name || '');
        setEmail(myInfo.email || '');
        setLocation(myInfo.location || '');
        // set originals so Save appears when any of these change
        setOriginalName(myInfo.name || '');
        setOriginalEmail(myInfo.email || '');
        setOriginalLocation(myInfo.location || '');
      } catch (e) {
        console.log("PROFILE LOAD ERROR", e);
        Alert.alert('Failed to load user info');
      }
    })();
  }, []);

  // reload on focus (so after edits the profile refreshes)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      (async () => {
        try {
          const myInfo = await api("/profile/me/");
          const enriched = await enrichServicesWithDetailsIfNeeded(myInfo.services || []);
          setUser({ ...myInfo, services: enriched });
          setName(myInfo.name || "");
          setEmail(myInfo.email || "");
          setOriginalName(myInfo.name || "");
          setOriginalEmail(myInfo.email || "");
          setOriginalLocation(myInfo.location || "");
          setLocation(myInfo.location || "");
        } catch (e) {
          console.log("PROFILE reload error", e);
          Alert.alert("Failed to reload profile info");
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
        services: prevUser.services.filter(s => (s.service_id ?? s.id) !== service_id)
      }));
      Alert.alert('Service deleted!');
    } catch (e) {
      Alert.alert('Failed to delete service');
    }
  };

  // --- SAVE PROFILE: now enrich services so images are preserved after save ---
  const handleSave = async () => {
    try {
      const updatedInfo = await api('/profile/me/', {
        method: 'PATCH',
        body: JSON.stringify({ name, location }),
      });

      // Enrich services so images are present (server sometimes omits images in profile response)
      const enrichedServices = await enrichServicesWithDetailsIfNeeded(updatedInfo.services || []);

      // Normalize to expected shape
      const services = (enrichedServices || []).map(s => ({
        ...s,
        service_id: s.id ?? s.service_id,
        tag: s.type ?? s.tag,
        price: s.price ?? s.price,
      }));

      setUser({ ...updatedInfo, services });
      setOriginalName(updatedInfo.name || '');
      setOriginalEmail(updatedInfo.email || '');
      setOriginalLocation(updatedInfo.location || '');
      Alert.alert('Profile changes saved!');
    } catch (e) {
      console.log('SAVE ERROR', e);
      Alert.alert('Failed to save profile changes');
    }
  };
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear auth token or user data
              await AsyncStorage.removeItem("authToken"); // or whatever key you store
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }], // navigate to login screen
              });
            } catch (err) {
              console.log("Logout failed", err);
            }
          },
        },
      ]
    );
  };

  // --- Avatar / profile pic handling ---

  const currentAvatarUri = () => {
    // check common keys: profile_picture, avatar, image, profile_image, photo (adjust if backend uses different field)
    const v = user.profile_picture || user.avatar || user.image || user.profile_image || user.photo || null;
    return buildAbsolute(typeof v === 'string' ? v : (v && (v.url || v.uri)) || null);
  };

  const openAvatarPicker = () => {
    // initialize selection with current avatar if available
    const cur = currentAvatarUri();
    setAvatarSelection(cur ? [{ uri: cur }] : []);
    setAvatarModalVisible(true);
  };

  const clearAvatarSelection = () => setAvatarSelection([]);

  const handleClearAvatarOnServer = async () => {
    setUploadingAvatar(true);
    try {
      const accessToken =
        (await AsyncStorage.getItem('access_token')) ||
        (await AsyncStorage.getItem('access')) ||
        (await AsyncStorage.getItem('token')) ||
        (await AsyncStorage.getItem('authToken'));

      const form = new FormData();
      form.append('profile_picture', '');

      const headers = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const resp = await fetch(`${API_BASE}/profile/me/`, {
        method: 'PATCH',
        headers,
        body: form,
      });

      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(text || `HTTP ${resp.status}`);
      }

      let updated = null;
      try { updated = JSON.parse(text); } catch (e) { /* ignore */ }

      if (updated) {
        const enrichedServices = await enrichServicesWithDetailsIfNeeded(updated.services || []);
        setUser({ ...updated, services: enrichedServices });
        setName(updated.name || '');
        setEmail(updated.email || '');
        setLocation(updated.location || '');
        setOriginalName(updated.name || '');
        setOriginalEmail(updated.email || '');
        setOriginalLocation(updated.location || '');
      } else {
        setUser(prev => ({ ...prev, profile_picture: null, avatar: null, image: null }));
      }

      setAvatarSelection([]);
      setAvatarModalVisible(false);
      Alert.alert('Profile picture removed.');
    } catch (err) {
      console.log('Failed to clear avatar on server', err);
      Alert.alert('Failed to remove profile picture.', String(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadAvatar = async (selectionArray) => {
    if (!selectionArray || selectionArray.length === 0) {
      await handleClearAvatarOnServer();
      return;
    }

    const img = selectionArray[0];
    const uri = img.uri;
    setUploadingAvatar(true);

    try {
      const accessToken =
        (await AsyncStorage.getItem('access_token')) ||
        (await AsyncStorage.getItem('access')) ||
        (await AsyncStorage.getItem('token')) ||
        (await AsyncStorage.getItem('authToken'));

      if (!accessToken) {
        Alert.alert('Authentication missing', 'No access token found. Please sign in again.');
        setUploadingAvatar(false);
        return;
      }

      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const mime = ext === 'png' ? 'image/png' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      formData.append('profile_picture', {
        uri,
        name: filename || `profile.${ext}`,
        type: mime,
      });

      const headers = { Authorization: `Bearer ${accessToken}` };

      const resp = await fetch(`${API_BASE}/profile/me/`, {
        method: 'PATCH',
        headers,
        body: formData,
      });

      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(text || `HTTP ${resp.status}`);
      }

      let updated = null;
      try { updated = JSON.parse(text); } catch (e) { /* ignore */ }

      if (updated) {
        const enrichedServices = await enrichServicesWithDetailsIfNeeded(updated.services || []);
        setUser({ ...updated, services: enrichedServices });
        setName(updated.name || '');
        setEmail(updated.email || '');
        setLocation(updated.location || '');
        setOriginalName(updated.name || '');
        setOriginalEmail(updated.email || '');
        setOriginalLocation(updated.location || '');
      }

      setAvatarModalVisible(false);
      Alert.alert('Profile picture updated.');
    } catch (e) {
      console.log('[Avatar Upload] error', e);
      Alert.alert('Failed to upload avatar', String(e));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Helper to determine whether the Save button should be visible
  const isDirty = () => {
    return (
      name !== originalName ||
      email !== originalEmail ||
      location !== originalLocation
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={AppStyles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
          style={[AppStyles.headerBg, { zIndex: 20, elevation: 20 }]}
        >
          <Image source ={require('../assets/logo.png')} style={{ width: 100, height: 60, resizeMode: 'contain' }} />
        </LinearGradient>

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 16, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[AppStyles.profileRow, { marginTop: 0 }]}>
            <View style={AppStyles.avatarWrapper}>
              {/* Avatar (image fills the circle; emoji fallback centered and not clipped) */}
              <View
                style={[
                  AppStyles.avatarCircle,
                  {
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: AVATAR_SIZE / 2,
                    overflow: 'hidden',
                    padding: 0,
                    left: '18%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                  },
                ]}
              >
                {currentAvatarUri() ? (
                  <Image
                    source={{ uri: currentAvatarUri() }}
                    style={{
                      width: '100%',
                      height: '100%',
                      resizeMode: 'cover',
                    }}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: AVATAR_SIZE * 0.58,
                      lineHeight: AVATAR_SIZE,
                      textAlign: 'center',
                      includeFontPadding: false,
                    }}
                  >
                    🙂
                  </Text>
                )}
              </View>

              {/* Edit label/button under avatar */}
              <TouchableOpacity
                onPress={openAvatarPicker}
                style={{ marginTop: 8, alignItems: 'center', padding: 6 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Edit picture or avatar
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[AppStyles.nameText]}
              value={name || ''}
              onChangeText={setName}
              editable={true}
              placeholder="Your Name"
              placeholderTextColor={colors.textPrimary}
              numberOfLines={1}
              maxLength={10}
              // Save when pressing Return if there are changes
              onSubmitEditing={() => {
                Keyboard.dismiss();
                if (isDirty()) handleSave();
              }}
            />
          </View>

          <View style={AppStyles.inputSection}>
            <Text style={AppStyles.label}>Email</Text>
            <TextInput
              style={AppStyles.input}
              value={email}
              editable={false}
            />
            <Text style={AppStyles.label}>Location</Text>
            <View style={{ zIndex: 1000 }}>
              <DropDownPicker
                open={open}
                value={location}
                items={items}
                setOpen={setOpen}
                setValue={setLocation}
                setItems={setItems}
                placeholder="Select your location..."
                style={[AppStyles.input, { justifyContent: 'center' }]} // matches your input box
                dropDownContainerStyle={{
                  borderColor: colors.border,
                  borderWidth: 1,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  marginTop: 2,
                }}
                textStyle={{
                  color: colors.textPrimary,
                  fontSize: 16,
                }}
                placeholderStyle={{
                  color: '#999',
                }}
                listMode="SCROLLVIEW"
                searchable={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={AppStyles.addServicesBtn}
            onPress={() => navigation.navigate('AddServices')}
          >
            <Text style={AppStyles.addServicesText}>Add Services</Text>
          </TouchableOpacity>

          {user.services && Array.isArray(user.services) && (
            <View style={AppStyles.servicesContainer}>
              {user.services.map((service, i) => {
                // robust stable key: prefer service_id -> id -> fallback to composed string or index
                const keyId = String(service.service_id ?? service.id ?? (`svc-${service.user_id ?? 'u'}-${service.name ?? i}`) ?? i);

                // derive image object already normalized by enrichServicesWithDetailsIfNeeded
                const img = service.image ?? null;

                // ensure price formatting consistent
                const priceStr = `$${(Number(service.price) || 0).toFixed(2)}`;

                return (
                  <ServiceCard
                    key={keyId}
                    image={img}
                    title={service.name}
                    price={priceStr}
                    category={service.tag}
                    onEdit={() => navigation.navigate('EditServices', {
                      service_id: service.service_id || service.id,
                    })}
                    onDelete={() => handleDeleteService(service.service_id || service.id)}
                  />
                );
              })}
            </View>
          )}

          {isDirty() ? (
            <TouchableOpacity
              style={[AppStyles.addServicesBtn, { marginBottom: 24, marginTop: 10 }]}
              onPress={handleSave}
            >
              <Text style={AppStyles.addServicesText}>Save</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[AppStyles.addServicesBtn, { backgroundColor: '#ff4d4d', marginBottom: 24, marginTop: 10 }]}
            onPress={handleLogout}
          >
            <Text style={AppStyles.addServicesText}>Logout</Text>
          </TouchableOpacity>
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

        {/* Avatar selection modal */}
        <Modal
          visible={avatarModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <View style={modalStyles.overlay}>
            <View style={modalStyles.sheet}>
              <Text style={modalStyles.title}>Choose profile picture</Text>

              <ImageGalleryPicker
                images={avatarSelection}
                onChange={(newImgs) => setAvatarSelection(newImgs)}
                maxImages={1}
                thumbnailSize={120}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity
                  style={[AppStyles.addServicesBtn, { flex: 1, marginRight: 8 }]}
                  onPress={() => {
                    setAvatarSelection([]);
                  }}
                >
                  <Text style={AppStyles.addServicesText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[AppStyles.addServicesBtn, { flex: 1, marginLeft: 8 }]}
                  onPress={() => handleUploadAvatar(avatarSelection)}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={AppStyles.addServicesText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{ alignSelf: 'center', marginTop: 8 }}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Text style={{ color: '#999' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: 260,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});

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
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

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.10;

export default function Profile() {
  // const user = dummyData[0]; UPDATE
  const [user, setUser] = useState({ services: [], location: '' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');

  const [originalEmail, setOriginalEmail] = useState('');
  const [originalLocation, setOriginalLocation] = useState('');

  const navigation = useNavigation();

  // LOAD PROFILE
  useEffect(() => {
    (async () => {
      console.log("PROFILE EFFECT START");
      try {
        const myInfo = await api('/profile/me/');
        console.log("PROFILE /me", myInfo);
        const services = (myInfo.services || []).map(s => ({
          ...s,
          service_id: s.id,
          tag: s.type,
          price: Number(s.price),
      }));

        setUser({ ...myInfo, services });
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

  useEffect(() => {
  const unsubscribe = navigation.addListener("focus", () => {
    (async () => {
      try {
        const myInfo = await api("/profile/me/");
        const services = (myInfo.services || []).map((s) => ({
          ...s,
          service_id: s.id,
          tag: s.type,
          price: Number(s.price),
        }));
        setUser({ ...myInfo, services });
        setName(myInfo.name || "");
        setEmail(myInfo.email || "");
        setOriginalEmail(myInfo.email || "");
        setOriginalLocation(myInfo.location || "");
        setLocation(myInfo.location || "");
      } catch (e) {
        alert("Failed to reload profile info");
      }
    })();
  });

  return unsubscribe;
}, [navigation]);

  // const handleDeleteService = (service_id) => {
  //   alert(`Service ${service_id} deleted!`);
  // };

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

  // const handleSave = () => {
  //   setOriginalEmail(email);
  //   setOriginalLocation(location);
  //   alert('Profile changes saved!');
  //   // Optionally, do API call here
  // };

  const handleSave = async () => {
    try {
      const updatedInfo = await api('/profile/me/', {
        method: 'PUT',
        body: JSON.stringify({ email, location }),
      });

      const services = (updatedInfo.services || []).map(s => ({
        ...s,
        service_id: s.id,
        tag: s.type,
        price: Number(s.price),
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
        {/* Gradient as original, not absolute */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none" // let touches go to inputs below
          style={[
            AppStyles.headerBg,
            { zIndex: 20, elevation: 20 } // keep header above scrolled content
          ]}
        />

        {/* Main scrollable content */}
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
              value={name}
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
              onChangeText={setEmail}
              editable={true}
              autoCapitalize="none"
            />
            <Text style={AppStyles.label}>Location</Text>
            <TextInput
              style={AppStyles.input}
              value={location}
              onChangeText={setLocation}
              editable={true}
            />
          </View>

          {/* Add Services Button - links directly to AddServices.js */}
          <TouchableOpacity
            style={AppStyles.addServicesBtn}
            onPress={() => navigation.navigate('AddServices')}
          >
            <Text style={AppStyles.addServicesText}>Add Services</Text>
          </TouchableOpacity>

          {/* Services List is always visible (no toggle button) */}
          {user.services && Array.isArray(user.services) && (
            <View style={AppStyles.servicesContainer}>
              {user.services.map(service => (
                <ServiceCard
                  key={service.service_id}
                  image={service.image}
                  title={service.name}
                  price={`$${service.price.toFixed(2)}`}
                  category={service.tag}
                  onEdit={() => navigation.navigate('EditServices', {
                    service_id: service.service_id || service.id,
                  })}
                  onDelete={() => handleDeleteService(service.service_id)}
                />
              ))}
            </View>
          )}

          {/* Save button ALWAYS at the bottom of scroll content */}
          {isChanged && (
            <TouchableOpacity
              style={[AppStyles.addServicesBtn, { marginBottom: 24, marginTop: 10 }]}
              onPress={handleSave}
            >
              <Text style={AppStyles.addServicesText}>Save</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

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
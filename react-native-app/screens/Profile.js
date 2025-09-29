import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions
} from 'react-native';
import AppStyles, { colors } from '../styles/AppStyles';
import { dummyData } from '../data/Dummy';
import ServiceCard from '../styles/ServiceCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function Profile() {
  const user = dummyData[0];
  const [name, setName] = useState('MyAllRaAby');
  const [originalEmail, setOriginalEmail] = useState('student@villanova.edu');
  const [originalLocation, setOriginalLocation] = useState(user.location);

  const [email, setEmail] = useState(originalEmail);
  const [location, setLocation] = useState(originalLocation);

  const navigation = useNavigation();

  const handleDeleteService = (service_id) => {
    alert(`Service ${service_id} deleted!`);
  };

  const handleSave = () => {
    setOriginalEmail(email);
    setOriginalLocation(location);
    alert('Profile changes saved!');
    // Optionally, do API call here
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
          style={AppStyles.headerBg}
        />

        {/* Main scrollable content */}
        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={AppStyles.profileRow}>
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
                  onEdit={() => navigation.navigate('EditServices')}
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
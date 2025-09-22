import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import AppStyles, { colors } from '../styles/AppStyles';
import { dummyData } from '../data/Dummy';
import ServiceCard from '../styles/ServiceCard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
  const user = dummyData[0];
  const [name, setName] = useState('MyAllRaAby');
  const [email, setEmail] = useState('student@villanova.edu');
  const [location, setLocation] = useState(user.location);
  const [showServices, setShowServices] = useState(false);
  const navigation = useNavigation();

  // Dummy delete handler for demo
  const handleDeleteService = (service_id) => {
    // Add your delete logic here (API call, update state, etc.)
    alert(`Service ${service_id} deleted!`);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={AppStyles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={AppStyles.headerBg}
        />

        <View style={AppStyles.profileRow}>
          <View style={AppStyles.avatarCircle}>
            <Text style={AppStyles.avatarIcon}>🙂</Text>
          </View>
          {/* Editable Name */}
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

        <TouchableOpacity
          style={AppStyles.addServicesBtn}
          onPress={() => setShowServices(!showServices)}
        >
          <Text style={AppStyles.addServicesText}>Add Services</Text>
        </TouchableOpacity>

        {showServices && (
          <ScrollView style={AppStyles.servicesContainer}>
            {user.services.map(service => (
              <ServiceCard
                key={service.service_id}
                image={service.image}
                title={service.name}
                price={`$${service.price.toFixed(2)}`}
                category={service.tag}
                // Navigate to EditServices page when Edit icon is pressed
                onEdit={() => navigation.navigate('EditServices')}
                onDelete={() => handleDeleteService(service.service_id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import AppStyles, { colors } from '../styles/AppStyles';
import { dummyData } from '../data/Dummy';
import ServiceCard from '../components/ServiceCard';
// Import LinearGradient for the gradient background
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const user = dummyData[0];
  const email = 'student@villanova.edu';
  const [showServices, setShowServices] = useState(false);

  return (
    <View style={AppStyles.container}>
      {/* Gradient header background */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={AppStyles.headerBg}
      />

      {/* Profile Centered Row */}
      <View style={AppStyles.profileRow}>
        <View style={AppStyles.avatarCircle}>
          <Text style={AppStyles.avatarIcon}>🙂</Text>
        </View>
        <Text style={AppStyles.nameText}>MyAllRaAby</Text>
      </View>

      {/* Email and Location */}
      <View style={AppStyles.inputSection}>
        <Text style={AppStyles.label}>Email</Text>
        <TextInput
          style={AppStyles.input}
          value={email}
          editable={false}
        />
        <Text style={AppStyles.label}>Location</Text>
        <TextInput
          style={AppStyles.input}
          value={user.location}
          editable={false}
        />
      </View>

      {/* Add Services button */}
      <TouchableOpacity
        style={AppStyles.addServicesBtn}
        onPress={() => setShowServices(!showServices)}
      >
        <Text style={AppStyles.addServicesText}>Add Services</Text>
      </TouchableOpacity>

      {/* Service cards, shown after Add Services is clicked */}
      {showServices && (
        <ScrollView style={AppStyles.servicesContainer}>
          {user.services.map(service => (
            <ServiceCard
              key={service.service_id}
              image={service.image}
              title={service.name}
              price={`$${service.price.toFixed(2)}`}
              category={service.tag}
              onEdit={() => {}}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
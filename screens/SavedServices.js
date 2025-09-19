import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from '../components/AppStyles';

const categories = [
  { name: 'Haircut' },
  { name: 'Nails' },
  { name: 'Cooking' },
  { name: 'Tutor' },
];

const savedServices = [
  {
    id: 1,
    title: 'Haircuts',
    provider: "Hairstylists' Name",
    price: '$25.00/hr',
  },
  {
    id: 2,
    title: 'Cooking Lessons',
    provider: "Student Chef",
    price: '$20.00/hr',
  },
  // Add more services as needed
];

export default function SavedServices() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.back}>{'< Back'}</Text>
        </TouchableOpacity>
        <View style={styles.avatarCircle} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for saved services"
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
      >
        {categories.map((cat) => (
          <View key={cat.name} style={styles.categoryItem}>
            <View style={styles.categoryIconPlaceholder} />
            <Text style={styles.categoryLabel}>{cat.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Saved Services */}
      <Text style={styles.sectionTitle}>
        Saved Services ({savedServices.length})
      </Text>
      <ScrollView style={styles.servicesList}>
        {savedServices.map((service) => (
          <View key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceImagePlaceholder} />
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceProvider}>{service.provider}</Text>
              <Text style={styles.servicePrice}>{service.price}</Text>
              <TouchableOpacity style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
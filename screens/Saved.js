import React from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

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
    // image: will be added later
  },
  // Add more sample services here
];

export default function Saved() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.back}>{'< Back'}</Text>
        <View style={styles.avatarCircle} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for saved services"
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={{fontSize: 20}}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {categories.map((cat, idx) => (
          <View key={cat.name} style={styles.categoryItem}>
            <View style={styles.categoryIconPlaceholder} />
            <Text style={styles.categoryLabel}>{cat.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Saved Services */}
      <Text style={styles.sectionTitle}>Saved Services ({savedServices.length})</Text>
      <ScrollView style={styles.servicesList}>
        {savedServices.map(service => (
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF8F7', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 8 },
  back: { fontSize: 18 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  searchBar: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 16, height: 40 },
  filterBtn: { marginLeft: 8, backgroundColor: '#fff', padding: 10, borderRadius: 10 },

  sectionTitle: { fontSize: 18, fontWeight: '600', marginVertical: 8 },
  categoryRow: { flexDirection: 'row', marginBottom: 8 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryIconPlaceholder: { width: 40, height: 40, marginBottom: 4, borderRadius: 20, backgroundColor: '#E0E0E0' },
  categoryLabel: { fontSize: 13 },

  servicesList: { marginBottom: 60 },
  serviceCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginVertical: 8, padding: 10 },
  serviceImagePlaceholder: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#E0E0E0' },
  serviceDetails: { flex: 1, marginLeft: 10, justifyContent: 'space-between' },
  serviceTitle: { fontSize: 16, fontWeight: 'bold' },
  serviceProvider: { fontSize: 14, color: '#333' },
  servicePrice: { fontSize: 14, color: '#AB6DA9', marginBottom: 6 },
  bookBtn: { backgroundColor: '#F9B6B6', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 18, alignSelf: 'flex-end' },
  bookBtnText: { color: '#fff', fontWeight: 'bold' },
});
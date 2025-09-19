import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../styles/AppStyles';

export default function ServiceCard({ image, title, price, category, onEdit }) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>
      {onEdit && (
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: colors.placeholder,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.heading,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginVertical: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.placeholder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  editBtn: {
    marginLeft: 8,
    padding: 4,
  },
  editIcon: {
    fontSize: 20,
    color: colors.heading,
  },
});
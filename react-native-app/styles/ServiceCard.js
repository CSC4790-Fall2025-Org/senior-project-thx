import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './AppStyles';

const { width } = Dimensions.get('window');

export default function ServiceCard({ image, title, price, category, onEdit, onDelete }) {
  // Show a confirmation alert before delete
  const handleDelete = () => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service?",
      [
        { text: "No", onPress: () => {}, style: "cancel" },
        { text: "Yes", onPress: () => { if (onDelete) onDelete(); } }
      ],
      { cancelable: true }
    );
  };

  // resolve the Image source from a variety of shapes:
  // - null/undefined -> no image (render placeholder view)
  // - string -> treat as uri
  // - object { uri } or { url } -> use uri/url
  let imgSource = null;
  try {
    if (image) {
      if (typeof image === 'string') {
        imgSource = { uri: image };
      } else if (typeof image === 'object') {
        if (image.uri) imgSource = { uri: image.uri };
        else if (image.url) imgSource = { uri: image.url };
      }
    }
  } catch (err) {
    console.log('ServiceCard: error resolving image source', err);
  }

  // debug log to help identify issues in Profile render
  // (remove or lower in production)
  // NOTE: this prints many lines if you have many cards; it's deliberate for debugging.
  console.log('ServiceCard image source:', imgSource);

  return (
    <View style={styles.card}>
      {imgSource ? (
        <Image
          source={imgSource}
          style={styles.image}
          resizeMode="cover"
          onError={(e) => {
            console.log('ServiceCard image load error:', e.nativeEvent?.error);
          }}
        />
      ) : (
        <View style={styles.image} />
      )}

      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
        <View style={styles.tagRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{category}</Text>
          </View>
        </View>
      </View>
      <View style={styles.iconColumn}>
        {/* Clicking edit calls onEdit, which navigates to EditServices */}
        <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={width * 0.07} color={colors.heading} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={width * 0.07} color={colors.gradientEnd} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: width * 0.045,
    padding: width * 0.03,
    marginBottom: width * 0.03,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 7,
    alignItems: 'center',
    position: 'relative',
    minHeight: width * 0.30,
  },
  image: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.02,
    marginRight: width * 0.05,
    backgroundColor: colors.placeholder,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: width * 0.055,
    fontWeight: '800',
    color: colors.heading,
    marginBottom: 2,
  },
  price: {
    fontSize: width * 0.042,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  categoryTag: {
    backgroundColor: '#ececec',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  categoryTagText: {
    fontSize: width * 0.032,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  iconBtn: {
    marginBottom: 4,
    padding: 13,
  },
});
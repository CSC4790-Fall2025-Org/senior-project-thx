import React from "react";
import { View, TouchableOpacity, Image, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

/**
 * Props:
 * - images: array of { uri } or uri strings
 * - onChange: (newImages: array) => void
 * - maxImages: number (default 6)
 * - thumbnailSize: number (default 88)
 */
export default function ImageGalleryPicker({ images = [], onChange = () => {}, maxImages = 6, thumbnailSize = 88 }) {
  const normalize = (list) => list.map((i) => (typeof i === "string" ? { uri: i } : i));

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please allow access to your photos to choose images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled) return;

      let picked = [];
      if (Array.isArray(result.assets) && result.assets.length) {
        picked = result.assets.map((a) => ({ uri: a.uri, type: a.type || "image" }));
      } else if (result.uri) {
        picked = [{ uri: result.uri, type: "image" }];
      }

      const current = normalize(images);
      const combined = [...current, ...picked].slice(0, maxImages);
      onChange(combined);
    } catch (e) {
      console.warn("Image pick error", e);
      Alert.alert("Error", "Could not pick image. Try again.");
    }
  };

  const removeImage = (index) => {
    const list = normalize(images);
    const copy = list.slice();
    copy.splice(index, 1);
    onChange(copy);
  };

  const renderPlaceholder = () => (
    <View style={[styles.placeholderBox, { width: thumbnailSize, height: thumbnailSize }]}>
      <Text style={styles.placeholderText}>No images</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {images && images.length > 0 ? (
          normalize(images).map((img, idx) => (
            <View key={idx} style={{ marginRight: 12 }}>
              <Image source={{ uri: img.uri }} style={[styles.thumb, { width: thumbnailSize, height: thumbnailSize }]} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(idx)}>
                <Ionicons name="close-circle" size={22} color="#ff6b8a" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={{ marginRight: 12 }}>{renderPlaceholder()}</View>
        )}

        {((images && images.length) || 0) < maxImages && (
          <TouchableOpacity style={[styles.addBtn, { width: thumbnailSize, height: thumbnailSize }]} onPress={pickImage}>
            <Ionicons name="add" size={34} color="#9CA3AF" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  scroll: { paddingLeft: 2, paddingRight: 12, alignItems: "center" },
  thumb: { borderRadius: 10, backgroundColor: "#EEE", resizeMode: "cover" },
  addBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  addText: { color: "#9CA3AF", marginTop: 4 },
  removeBtn: { position: "absolute", top: -6, right: -6, backgroundColor: "transparent" },
  placeholderBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  placeholderText: { color: "#9CA3AF" },
});
// AddServices.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

const TAG_OPTIONS = ["Haircuts", "Nails", "Makeup", "Tutoring", "Cooking", "Cleaning"];
const todayISO = () => new Date().toISOString().slice(0, 10);
const toTimeLabel = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// --- helper: serialize availability to ISO ---
const serializeAvailabilityISO = (slotsByDate) =>
  Object.fromEntries(
    Object.entries(slotsByDate).map(([date, slots]) => [
      date,
      slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      })),
    ])
  );

export default function AddServices({ navigation }) {
  // Editable fields (About -> Description)
  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("");
  const [imageUri, setImageUri] = useState(null);

  // Tag picker modal
  const [tagPickerVisible, setTagPickerVisible] = useState(false);

  // Calendar + slots
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [slotsByDate, setSlotsByDate] = useState({});

  // Time picker modal (always closable)
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeEditing, setTimeEditing] = useState(null); // { dateKey, id, field }
  const [tempTime, setTempTime] = useState(new Date());

  const markedDates = useMemo(() => {
    const marks = { [selectedDate]: { selected: true, selectedColor: "#FFD9E1" } };
    Object.keys(slotsByDate).forEach((d) => {
      if (!marks[d]) marks[d] = { marked: true, dotColor: "#ff6b8a" };
      else marks[d] = { ...marks[d], marked: true, dotColor: "#ff6b8a" };
    });
    return marks;
  }, [selectedDate, slotsByDate]);

  const daySlots = slotsByDate[selectedDate] || [];

  const addSlot = () => {
    const start = new Date(); start.setHours(10, 0, 0, 0);
    const end = new Date();   end.setHours(11, 0, 0, 0);
    const newSlot = { id: Math.random().toString(36).slice(2), start, end };
    setSlotsByDate((prev) => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newSlot],
    }));
    openTimePicker(newSlot, "start");
  };

  const removeSlot = (id) => {
    setSlotsByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter((s) => s.id !== id),
    }));
  };

  const openTimePicker = (slot, field) => {
    setTimeEditing({ dateKey: selectedDate, id: slot.id, field });
    setTempTime(slot[field]);
    setTimeModalVisible(true);
  };

  const closeTimeModal = () => {
    setTimeModalVisible(false);
    setTimeEditing(null);
  };

  const commitTimeChange = () => {
    const { dateKey, id, field } = timeEditing || {};
    if (!dateKey || !id) return closeTimeModal();

    setSlotsByDate((prev) => {
      const list = [...(prev[dateKey] || [])];
      const idx = list.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const updated = { ...list[idx], [field]: tempTime };
      if (updated.start > updated.end) {
        if (field === "start") updated.end = new Date(updated.start.getTime() + 60 * 60 * 1000);
        else updated.start = new Date(updated.end.getTime() - 60 * 60 * 1000);
      }
      list[idx] = updated;
      return { ...prev, [dateKey]: list };
    });
    closeTimeModal();
  };

  // Expo image picker (unchanged styles; only this function uses Expo)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onSave = () => {
    // 🔐 Save appointment times as ISO timestamps
    const availability = serializeAvailabilityISO(slotsByDate);
    const payload = { service, description, price, tag, imageUri, availability };

    console.log("Saving:\n", JSON.stringify(payload, null, 2));
    Alert.alert("Saved", "Service details saved!");
    // TODO: POST `payload` to your backend
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={8}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Services</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Service */}
          <Text style={styles.label}>Service</Text>
          <TextInput
            style={styles.input}
            value={service}
            onChangeText={setService}
            placeholder="Enter service name"
            autoCapitalize="sentences"
            returnKeyType="done"
          />

          {/* Description (renamed from About) */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your service"
            multiline
            scrollEnabled
            textAlignVertical="top"
          />

          {/* Price */}
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          {/* Service Tag - single select */}
          <Text style={styles.label}>Service Tag</Text>
          <TouchableOpacity style={styles.select} onPress={() => setTagPickerVisible(true)}>
            <Text style={[styles.selectText, !tag && { color: "#9CA3AF" }]}>
              {tag || "Choose a tag"}
            </Text>
            <Icon name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>

          {/* Availability */}
          <Text style={styles.label}>Availability</Text>
          <View style={styles.calendarWrap}>
            <Calendar
              current={selectedDate}
              onDayPress={(d) => setSelectedDate(d.dateString)}
              markedDates={markedDates}
              theme={{
                textSectionTitleColor: "#9CA3AF",
                selectedDayBackgroundColor: "#FFD9E1",
                selectedDayTextColor: "#111827",
                todayTextColor: "#ff6b8a",
                arrowColor: "#ff6b8a",
              }}
              style={styles.calendar}
            />
          </View>

          {/* Time slots */}
          {daySlots.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <TouchableOpacity style={[styles.timeBtn, styles.timeBtnLeft]} onPress={() => openTimePicker(slot, "start")}>
                <Text style={styles.timeText}>{toTimeLabel(slot.start)}</Text>
              </TouchableOpacity>
              <Text style={styles.toDash}>—</Text>
              <TouchableOpacity style={[styles.timeBtn, styles.timeBtnRight]} onPress={() => openTimePicker(slot, "end")}>
                <Text style={styles.timeText}>{toTimeLabel(slot.end)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeSlot(slot.id)} style={styles.iconBtn} accessibilityLabel="Remove slot">
                <Icon name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={addSlot} style={styles.iconBtn} accessibilityLabel="Add slot">
                <Icon name="add" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
          {daySlots.length === 0 && (
            <TouchableOpacity onPress={addSlot} style={styles.addFirstSlot}>
              <Icon name="add-circle-outline" size={22} />
              <Text style={styles.addFirstSlotText}>Add a time slot</Text>
            </TouchableOpacity>
          )}

          {/* Service Image */}
          <Text style={styles.label}>Service Image</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="image-outline" size={36} color="#9CA3AF" />
                <Text style={{ color: "#9CA3AF", marginTop: 6 }}>Tap to choose photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Save */}
          <View style={{ height: 16 }} />
          <TouchableOpacity onPress={onSave} style={styles.saveBtn} activeOpacity={0.9}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Time Picker Modal */}
        <Modal visible={timeModalVisible} animationType="slide" transparent onRequestClose={closeTimeModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.timeSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeTimeModal}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select time</Text>
                <TouchableOpacity onPress={commitTimeChange}>
                  <Text style={styles.doneBtn}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={(_, d) => d && setTempTime(d)}
                style={{ alignSelf: "stretch" }}
              />
            </View>
          </View>
        </Modal>

        {/* Tag Picker Modal */}
        <Modal
          visible={tagPickerVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setTagPickerVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a tag</Text>
                <TouchableOpacity onPress={() => setTagPickerVisible(false)}>
                  <Icon name="close" size={22} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={TAG_OPTIONS}
                keyExtractor={(item) => item}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => {
                  const selected = item === tag;
                  return (
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() => {
                        setTag(item);
                        setTagPickerVisible(false);
                      }}
                    >
                      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.optionText}>{item}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },

  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backText: { color: "#6B7280", fontSize: 16 },
  title: {
    position: "absolute",
    left: 0, right: 0,
    textAlign: "center",
    fontSize: 20, fontWeight: "700", color: "#ff6b8a",
  },

  content: { padding: 16, paddingBottom: 24, flexGrow: 1 },

  label: { marginTop: 12, marginBottom: 6, color: "#6B7280", fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 15, color: "#111827",
  },
  textarea: { minHeight: 100, textAlignVertical: "top" },

  select: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  selectText: { fontSize: 15, color: "#111827" },

  calendarWrap: {
    borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  calendar: { borderRadius: 14 },

  slotRow: { marginTop: 12, flexDirection: "row", alignItems: "center" },
  timeBtn: {
    flex: 1, borderWidth: 1, borderColor: "#E5E7EB",
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#fff",
  },
  timeBtnLeft: { marginRight: 8 },
  timeBtnRight: { marginLeft: 8 },
  timeText: { fontSize: 15, color: "#111827", textAlign: "center" },
  toDash: { marginHorizontal: 6, color: "#6B7280", fontSize: 18 },

  iconBtn: {
    marginLeft: 8, width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },

  addFirstSlot: {
    marginTop: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center",
    gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  addFirstSlotText: { color: "#6B7280", marginLeft: 6 },

  imagePicker: {
    marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB",
    height: 170, alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  imagePlaceholder: {
    width: "92%", height: "78%", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },

  saveBtn: {
    backgroundColor: "#ff8ea5", paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 12, alignItems: "center", shadowColor: "#ff6b8a",
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 2,
  },
  saveText: { fontWeight: "700", color: "white", fontSize: 16 },

  // Modal backdrop
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },

  // Time picker sheet
  timeSheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24, paddingHorizontal: 12 },
  modalHeader: {
    paddingHorizontal: 8, paddingTop: 12, paddingBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  modalTitle: { fontWeight: "700", fontSize: 16 },
  cancelBtn: { color: "#6B7280", fontSize: 16 },
  doneBtn: { color: "#ff6b8a", fontSize: 16, fontWeight: "700" },

  // Tag sheet
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 20, maxHeight: "60%" },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB", marginLeft: 56 },
  optionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  optionText: { fontSize: 16, color: "#111827", marginLeft: 12 },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D1D5DB",
    alignItems: "center", justifyContent: "center",
  },
  radioOuterActive: { borderColor: "#ff6b8a" },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#ff6b8a" },
});

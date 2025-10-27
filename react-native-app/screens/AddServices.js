import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useWindowDimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Ionicons";

import ImageGalleryPicker from "../components/ImageGalleryPicker";
import { api } from "../src/api";

const TAG_OPTIONS = [
  "Haircuts",
  "Nails",
  "Makeup",
  "Tutoring",
  "Cooking",
  "Cleaning",
];

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Format a Date object (or HH:MM:SS string) as a local wall-clock label without timezone shifting
 */
const toTimeLabel = (val) => {
  try {
    if (val instanceof Date) {
      return val.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const s = String(val || "");
    const [h, m] = s.split(":").map((x) => parseInt(x || "0", 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return s;

    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(val || "");
  }
};

/** Format Date -> "HH:MM:00" (wall clock, no timezone info) */
const fmtHHMMSS = (d) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}:00`;
};

/** Serialize availability as a flat list of {date, start_time, end_time} */
const serializeAvailabilityForAPI = (slotsByDate) =>
  Object.entries(slotsByDate).flatMap(([date, slots]) =>
    (slots || []).map((s) => ({
      date, // "YYYY-MM-DD"
      start_time: fmtHHMMSS(s.start),
      end_time: fmtHHMMSS(s.end),
    }))
  );

export default function AddServices({ navigation }) {
  const { height: winH } = useWindowDimensions();
  const sheetHeight = Math.max(320, Math.round(winH * 0.5));

  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("");
  const [images, setImages] = useState([]); // array of {uri}

  const [tagPickerVisible, setTagPickerVisible] = useState(false);

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [slotsByDate, setSlotsByDate] = useState({}); // { "YYYY-MM-DD": [{id,start:Date,end:Date}] }

  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeEditing, setTimeEditing] = useState(null); // { dateKey, id, field }
  const [tempTime, setTempTime] = useState(new Date());

  const markedDates = useMemo(() => {
    const marks = {
      [selectedDate]: { selected: true, selectedColor: "#FFD9E1" },
    };
    Object.keys(slotsByDate).forEach((d) => {
      if (!marks[d]) marks[d] = { marked: true, dotColor: "#ff6b8a" };
      else marks[d] = { ...marks[d], marked: true, dotColor: "#ff6b8a" };
    });
    return marks;
  }, [selectedDate, slotsByDate]);

  const daySlots = useMemo(() => {
    const list = slotsByDate[selectedDate] || [];
    return [...list].sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [slotsByDate, selectedDate]);

  const addSlot = () => {
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    const end = new Date();
    end.setHours(11, 0, 0, 0);

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
    setTempTime(slot[field] instanceof Date ? new Date(slot[field]) : new Date());
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

      // Ensure start < end; auto-adjust by 60m if needed
      if (updated.start > updated.end) {
        if (field === "start") {
          updated.end = new Date(updated.start.getTime() + 60 * 60 * 1000);
        } else {
          updated.start = new Date(updated.end.getTime() - 60 * 60 * 1000);
        }
      }

      list[idx] = updated;
      return { ...prev, [dateKey]: list };
    });

    closeTimeModal();
  };

  const onSave = async () => {
    try {
      const availability = serializeAvailabilityForAPI(slotsByDate);

      if (availability.length === 0) {
        return Alert.alert("Add availability", "Please add at least one time slot.");
      }
      if (!service.trim()) return Alert.alert("Missing info", "Please enter a service name.");
      if (!price || Number.isNaN(Number(price)))
        return Alert.alert("Missing/invalid price", "Enter a valid price.");
      if (!tag.trim()) return Alert.alert("Missing info", "Please choose a service tag.");

      const fd = new FormData();
      fd.append("name", service);
      fd.append("description", description);
      fd.append("price", String(Number(price)));
      fd.append("type", tag);
      fd.append("availability", JSON.stringify(availability));

      if (images && images.length > 0) {
        images.forEach((img, idx) => {
          const uri = img.uri || img;
          const filename = (uri && uri.split("/").pop()) || `image-${idx}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";
          fd.append("images", { uri, name: filename, type });
        });
      }

      await api("/services/", {
        method: "POST",
        body: fd, // Don't set Content-Type manually; let fetch set the boundary
      });

      Alert.alert("Saved", "Service created!");
      navigation?.goBack?.();
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", e?.message || "Something went wrong");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={8}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Profile", params: { refresh: true } }],
                });
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ zIndex: 2 }}
          >
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

          {/* Description */}
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

          {/* Tag */}
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
              <TouchableOpacity
                style={[styles.timeBtn, styles.timeBtnLeft]}
                onPress={() => openTimePicker(slot, "start")}
              >
                <Text style={styles.timeText}>{toTimeLabel(slot.start)}</Text>
              </TouchableOpacity>

              <Text style={styles.toDash}>—</Text>

              <TouchableOpacity
                style={[styles.timeBtn, styles.timeBtnRight]}
                onPress={() => openTimePicker(slot, "end")}
              >
                <Text style={styles.timeText}>{toTimeLabel(slot.end)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => removeSlot(slot.id)}
                style={styles.iconBtn}
                accessibilityLabel="Remove slot"
              >
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

          {/* Image gallery (multiple) */}
          <Text style={styles.label}>Service Image(s)</Text>
          <ImageGalleryPicker images={images} onChange={setImages} maxImages={6} />

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
            <View style={[styles.timeSheet, { height: sheetHeight }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeTimeModal}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select time</Text>
                <TouchableOpacity onPress={commitTimeChange}>
                  <Text style={styles.doneBtn}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, alignSelf: "stretch" }}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setTempTime(d);
                  }}
                  style={{ flex: 1, alignSelf: "stretch" }}
                />
              </View>
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
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#ff6b8a",
  },

  content: { padding: 16, paddingBottom: 24, flexGrow: 1 },

  label: { marginTop: 12, marginBottom: 6, color: "#6B7280", fontSize: 13 },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  textarea: { minHeight: 100, textAlignVertical: "top" },

  select: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: { fontSize: 15, color: "#111827" },

  calendarWrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  calendar: { borderRadius: 14 },

  slotRow: { marginTop: 12, flexDirection: "row", alignItems: "center" },

  timeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  timeBtnLeft: { marginRight: 8 },
  timeBtnRight: { marginLeft: 8 },

  timeText: { fontSize: 15, color: "#111827", textAlign: "center" },

  toDash: { marginHorizontal: 6, color: "#6B7280", fontSize: 18 },

  iconBtn: {
    marginLeft: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  addFirstSlot: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  addFirstSlotText: { color: "#6B7280", marginLeft: 6 },

  saveBtn: {
    backgroundColor: "#ff8ea5",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#ff6b8a",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },

  saveText: { fontWeight: "700", color: "white", fontSize: 16 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },

  timeSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },

  modalHeader: {
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: { fontWeight: "700", fontSize: 16 },

  cancelBtn: { color: "#6B7280", fontSize: 16 },

  doneBtn: { color: "#ff6b8a", fontSize: 16, fontWeight: "700" },

  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: "60%",
  },

  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB", marginLeft: 56 },

  optionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },

  optionText: { fontSize: 16, color: "#111827", marginLeft: 12 },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterActive: { borderColor: "#ff6b8a" },

  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#ff6b8a" },
});
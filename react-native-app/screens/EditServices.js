import React, { useMemo, useState, useEffect } from "react";
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
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useWindowDimensions, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Ionicons";
import ImageGalleryPicker from "../components/ImageGalleryPicker";
import { api } from "../src/api";
import { API_BASE } from "../src/config";

const { width, height } = Dimensions.get("window");
const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Helpers
 */

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  // ensure API_BASE doesn't end with /api before prefixing
  const host = API_BASE.replace(/\/api\/?$/, "");
  // support server returning urls that already start with "/"
  return url.startsWith("/") ? `${host}${url}` : `${host}/${url}`;
};

// Defensive: convert backend availabilities list into slotsByDate map used by the UI.
// Accepts array of objects OR (in some responses) numeric ids (which will be ignored).
const listAvailToSlotsMap = (list) => {
  if (!Array.isArray(list)) return {};
  const out = {};

  list.forEach((a) => {
    // a must be an object containing date and time strings
    if (!a || typeof a !== "object") return;

    // support multiple possible key names from backend
    const date = a.date;
    const startStr = a.start_time ?? a.start;
    const endStr = a.end_time ?? a.end;

    if (!date || !startStr || !endStr) return;

    // create Dates and validate them
    const start = new Date(`${date}T${startStr}`);
    const end = new Date(`${date}T${endStr}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    (out[date] = out[date] || []).push({
      id: String(a.id ?? Math.random().toString(36).slice(2)),
      start,
      end,
    });
  });

  return out;
};

// Serialize the slotsByDate into the backend expected shape { "YYYY-MM-DD": [{start,end}, ...] }
// Skip invalid dates and empty lists.
const serializeAvailabilityISO = (slotsByDate) =>
  Object.fromEntries(
    Object.entries(slotsByDate || {})
      .map(([date, slots]) => [
        date,
        (Array.isArray(slots) ? slots : [])
          .map((s) => {
            const start = s?.start instanceof Date ? s.start : new Date(s?.start);
            const end = s?.end instanceof Date ? s.end : new Date(s?.end);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
            if (start > end) return null;
            return { start: start.toISOString(), end: end.toISOString() };
          })
          .filter(Boolean),
      ])
      .filter(([_, slots]) => Array.isArray(slots) && slots.length > 0)
  );

// Human readable time label used in the UI
const toTimeLabel = (d) => {
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

export default function EditServices({ navigation, route }) {
  const { height: winH } = useWindowDimensions();
  // Half the screen height, but never less than 320
  const sheetHeight = Math.max(320, Math.round(winH * 0.5));
  const params = route?.params || {};
  const serviceId = params.serviceId ?? params.service_id; // supports either
  console.log("EditServices route params:", params, "→ serviceId:", serviceId);

  const [loading, setLoading] = useState(false);

  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("");

  // images are normalized objects: { id?, uri }
  const [images, setImages] = useState([]);
  // keep original image ids so we can detect deletions
  const [originalImageIds, setOriginalImageIds] = useState([]);

  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [slotsByDate, setSlotsByDate] = useState({});

  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeEditing, setTimeEditing] = useState(null); // { dateKey, id, field }
  const [tempTime, setTempTime] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      try {
        console.log("Starting API call for service", serviceId);
        setLoading(true);

        const s = await api(`/services/${serviceId}/`);
        console.log("SERVICES /id:", s);

        setService(s.name || "");
        setDescription(s.description || "");
        setPrice(String(s.price ?? ""));
        setTag(s.type || "");

        // Normalize server images into objects of { id?, uri }
        const srvImages = Array.isArray(s.images) ? s.images : s.image ? [s.image] : [];
        const normalized = srvImages
          .map((u) => {
            if (!u) return null;
            if (typeof u === "string") {
              return { uri: buildAbsolute(u) };
            }
            // object case: { id, url, ... }
            if (u.url) return { id: u.id, uri: buildAbsolute(u.url) };
            // fallback if object has uri already
            if (u.uri) return { id: u.id, uri: u.uri };
            return null;
          })
          .filter(Boolean);
        setImages(normalized);
        setOriginalImageIds(normalized.map((i) => i.id).filter(Boolean));

        // Defensive conversion of availabilities -> UI slots
        const rawAvail = s.availabilities ?? s.availabilities_map ?? [];
        console.log("raw availabilities:", rawAvail);
        setSlotsByDate(listAvailToSlotsMap(rawAvail));
      } catch (e) {
        Alert.alert("Error", String(e.message || e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [serviceId]);

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

  const daySlots = slotsByDate[selectedDate] || [];

  const addSlot = () => {
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    const end = new Date();
    end.setHours(11, 0, 0, 0);
    const newSlot = {
      id: Math.random().toString(36).slice(2),
      start,
      end,
    };
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
        if (field === "start")
          updated.end = new Date(updated.start.getTime() + 60 * 60 * 1000);
        else updated.start = new Date(updated.end.getTime() - 60 * 60 * 1000);
      }
      list[idx] = updated;
      return { ...prev, [dateKey]: list };
    });
    closeTimeModal();
  };

  // ===========
  // SAVE HANDLER
  // ===========

  const onSave = async () => {
    try {
      const availability = serializeAvailabilityISO(slotsByDate);
      console.log("[DEBUG] availability payload:", availability);

      // Determine which images are local and need uploading
      const localImages = (images || []).filter((i) => i?.uri && !i.uri.startsWith("http"));
      // Determine which original server images were removed by user
      const currentRemoteIds = (images || []).map((i) => i.id).filter(Boolean);
      const removedIds = originalImageIds.filter((id) => !currentRemoteIds.includes(id));
      console.log("[DEBUG] localImages:", localImages, "removedIds:", removedIds);

      // If there are any removed remote images, call DELETE for each before PATCH.
      // (Alternate: backend could accept a "remove" list in the PATCH; if so adapt accordingly.)
      if (removedIds.length > 0) {
        // Fire deletes in parallel and wait
        await Promise.all(
          removedIds.map((id) =>
            api(`/service-images/${id}/`, { method: "DELETE" }).catch((err) => {
              console.log(`Failed to delete service-image ${id}`, err);
              // continue — we don't throw here so user can still save other changes
            })
          )
        );
      }

      // Build FormData always (server expects multipart for PATCH). Using FormData even when no files
      // avoids "Unsupported media type 'application/json'".
      const fd = new FormData();
      fd.append("name", service);
      fd.append("description", description);
      fd.append("price", String(price || 0));
      fd.append("type", tag);
      fd.append("availability", JSON.stringify(availability));

      // Append any local images (newly added)
      localImages.forEach((img) => {
        const uri = img.uri;
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        fd.append("images", { uri, name: filename, type });
      });

      if (fd && fd._parts) console.log("[DEBUG] fd parts:", fd._parts);

      // Send PATCH with FormData (do NOT set Content-Type header manually; let fetch set the multipart boundary)
      await api(`/services/${serviceId}/`, { method: "PATCH", body: fd });

      Alert.alert("Saved", "Service updated successfully!");

      // Update originalImageIds to reflect current server state (we expect the server now has removed ids)
      // Best practice: reload service from API to refresh ids — do that:
      const refreshed = await api(`/services/${serviceId}/`);
      const srvImages = Array.isArray(refreshed.images) ? refreshed.images : refreshed.image ? [refreshed.image] : [];
      const normalized = srvImages
        .map((u) => {
          if (!u) return null;
          if (typeof u === "string") return { uri: buildAbsolute(u) };
          if (u.url) return { id: u.id, uri: buildAbsolute(u.url) };
          if (u.uri) return { id: u.id, uri: u.uri };
          return null;
        })
        .filter(Boolean);
      setImages(normalized);
      setOriginalImageIds(normalized.map((i) => i.id).filter(Boolean));

      // Navigate back (Profile's focus listener will refresh)
      navigation?.goBack?.();
    } catch (e) {
      // Show a helpful error (API helper probably returns thrown Error with message)
      console.log("onSave error:", e);
      Alert.alert("Error", String(e.message || e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={height * 0.01}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.reset({ index: 0, routes: [{ name: "Profile", params: { refresh: true } }] });
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ zIndex: 2 }}  // keep it above anything else
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Services</Text>
          <View style={{ width: width * 0.12 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Service</Text>
          <TextInput
            style={styles.input}
            value={service}
            onChangeText={setService}
            placeholder="Enter service name"
            autoCapitalize="sentences"
            returnKeyType="done"
          />

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

          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <Text style={styles.label}>Service Tag</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setTagPickerVisible(true)}
          >
            <Text style={[styles.selectText, !tag && { color: "#9CA3AF" }]}>
              {tag || "Choose a tag"}
            </Text>
            <Icon name="chevron-down" size={width * 0.045} color="#6B7280" />
          </TouchableOpacity>

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
                <Icon name="close" size={width * 0.045} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addSlot}
                style={styles.iconBtn}
                accessibilityLabel="Add slot"
              >
                <Icon name="add" size={width * 0.05} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
          {daySlots.length === 0 && (
            <TouchableOpacity onPress={addSlot} style={styles.addFirstSlot}>
              <Icon name="add-circle-outline" size={width * 0.05} />
              <Text style={styles.addFirstSlotText}>Add a time slot</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Service Image(s)</Text>
          <ImageGalleryPicker images={images} onChange={setImages} maxImages={6} />

          <View style={{ height: "2%" }} />
          <TouchableOpacity onPress={onSave} style={styles.saveBtn} activeOpacity={0.9}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
          <View style={{ height: "5%" }} />
        </ScrollView>

        <Modal
          visible={timeModalVisible}
          animationType="slide"
          transparent
          onRequestClose={closeTimeModal}
        >
          <View style={styles.modalBackdrop}>
            <View
              style={[
                styles.timeSheet,
                { height: Math.max(320, Math.round(height * 0.5)) }, // ~50% of screen, min 320
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeTimeModal}>
                  <Text style={styles.cancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select time</Text>
                <TouchableOpacity onPress={commitTimeChange}>
                  <Text style={styles.doneBtn}>Done</Text>
                </TouchableOpacity>
              </View>

              {/* Picker container fills available space */}
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
                  <Icon name="close" size={width * 0.055} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={["Haircuts","Nails","Makeup","Tutoring","Cooking","Cleaning","Beauty"]}
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
  header: { paddingTop: height * 0.01, paddingHorizontal: width * 0.04, paddingBottom: height * 0.012, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F3F4F6", alignItems: "center", flexDirection: "row", justifyContent: "space-between", },
  backText: { color: "#6B7280", fontSize: width * 0.04 },
  title: { position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: width * 0.05, fontWeight: "700", color: "#ff6b8a", },
  content: { padding: width * 0.04, paddingBottom: height * 0.03, flexGrow: 1 },
  label: { marginTop: height * 0.015, marginBottom: height * 0.007, color: "#6B7280", fontSize: width * 0.033, },
  input: { borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", borderRadius: width * 0.025, paddingHorizontal: width * 0.03, paddingVertical: height * 0.016, fontSize: width * 0.038, color: "#111827", },
  textarea: { minHeight: height * 0.13, textAlignVertical: "top" },
  select: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: width * 0.025, paddingHorizontal: width * 0.03, paddingVertical: height * 0.016, flexDirection: "row", alignItems: "center", justifyContent: "space-between", },
  selectText: { fontSize: width * 0.038, color: "#111827" },
  calendarWrap: { borderRadius: width * 0.035, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB", marginVertical: height * 0.01, },
  calendar: { borderRadius: width * 0.035 },
  slotRow: { marginTop: height * 0.015, flexDirection: "row", alignItems: "center", },
  timeBtn: { flex: 1, borderWidth: 1, borderColor: "#E5E7EB", paddingVertical: height * 0.014, paddingHorizontal: width * 0.03, borderRadius: width * 0.025, backgroundColor: "#fff", },
  timeBtnLeft: { marginRight: width * 0.02 },
  timeBtnRight: { marginLeft: width * 0.02 },
  timeText: { fontSize: width * 0.038, color: "#111827", textAlign: "center" },
  toDash: { marginHorizontal: width * 0.015, color: "#6B7280", fontSize: width * 0.045 },
  iconBtn: { marginLeft: width * 0.02, width: width * 0.09, height: width * 0.09, borderRadius: width * 0.045, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", },
  addFirstSlot: { marginTop: height * 0.014, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: width * 0.02, paddingVertical: height * 0.008, paddingHorizontal: width * 0.02, borderRadius: width * 0.022, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", },
  addFirstSlotText: { color: "#6B7280", marginLeft: width * 0.015 },
  imagePicker: { marginTop: height * 0.012, borderRadius: width * 0.03, borderWidth: 1, borderColor: "#E5E7EB", height: height * 0.22, alignItems: "center", justifyContent: "center", overflow: "hidden", },
  imagePlaceholder: { width: "92%", height: "78%", borderRadius: width * 0.025, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", },
  image: { width: "100%", height: "100%" },
  saveBtn: { backgroundColor: "#ff8ea5", paddingHorizontal: width * 0.07, paddingVertical: height * 0.017, borderRadius: width * 0.03, alignItems: "center", shadowColor: "#ff6b8a", shadowOpacity: 0.2, shadowRadius: width * 0.02, elevation: 2, },
  saveText: { fontWeight: "700", color: "white", fontSize: width * 0.04 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", },
  timeSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: width * 0.04,
    borderTopRightRadius: width * 0.04,
    paddingBottom: height * 0.03,
    paddingHorizontal: width * 0.03,
  },
  modalHeader: { paddingHorizontal: width * 0.02, paddingTop: height * 0.015, paddingBottom: height * 0.01, flexDirection: "row", alignItems: "center", justifyContent: "space-between", },
  modalTitle: { fontWeight: "700", fontSize: width * 0.04 },
  cancelBtn: { color: "#6B7280", fontSize: width * 0.04 },
  doneBtn: { color: "#ff6b8a", fontSize: width * 0.04, fontWeight: "700" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: width * 0.04, borderTopRightRadius: width * 0.04, paddingBottom: height * 0.025, maxHeight: "60%", },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB", marginLeft: width * 0.15, },
  optionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: width * 0.04, paddingVertical: height * 0.017, },
  optionText: { fontSize: width * 0.042, color: "#111827", marginLeft: width * 0.03 },
  radioOuter: { width: width * 0.055, height: width * 0.055, borderRadius: width * 0.0275, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center", },
  radioOuterActive: { borderColor: "#ff6b8a" },
  radioInner: { width: width * 0.03, height: width * 0.03, borderRadius: width * 0.015, backgroundColor: "#ff6b8a", },
});
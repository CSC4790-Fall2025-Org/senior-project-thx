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
import { useWindowDimensions } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Ionicons";
import ImageGalleryPicker from "../components/ImageGalleryPicker";
import { api } from "../src/api";
import { API_BASE } from "../src/config";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get("window");

// Helpers
const todayISO = () => new Date().toISOString().slice(0, 10);
const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
const isTodayOrPast = (dateStr) => (dateStr || "") <= todayISO();

const buildAbsolute = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const host = API_BASE.replace(/\/api\/?$/, "");
  return url.startsWith("/") ? `${host}${url}` : `${host}/${url}`;
};

// Defensive: convert backend availabilities list into slotsByDate map used by the UI.
const listAvailToSlotsMap = (list) => {
  if (!Array.isArray(list)) return {};
  const out = {};

  list.forEach((a) => {
    if (!a || typeof a !== "object") return;

    const date = a.date;
    const startStr = a.start_time ?? a.start;
    const endStr = a.end_time ?? a.end;

    if (!date || !startStr || !endStr) return;

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

const fmtHHMMSS = (d) => {
  if (!(d instanceof Date)) d = new Date(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}:00`;
};

// Serialize availability as a flat list of {date, start_time, end_time}
const serializeAvailabilityForAPI = (slotsByDate) =>
  Object.entries(slotsByDate || {}).flatMap(([date, slots]) =>
    (slots || []).map((s) => {
      if (!(s.start instanceof Date) || !(s.end instanceof Date)) return null;
      return { date, start_time: fmtHHMMSS(s.start), end_time: fmtHHMMSS(s.end) };
    }).filter(Boolean)
  );

// Human readable time label
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
  const sheetHeight = Math.max(320, Math.round(winH * 0.5));
  const params = route?.params || {};
  const serviceId = params.serviceId ?? params.service_id;

  const [loading, setLoading] = useState(false);

  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("");

  // images are normalized objects: { id?, uri }
  const [images, setImages] = useState([]);
  const [originalImageIds, setOriginalImageIds] = useState([]);

  const [tagPickerVisible, setTagPickerVisible] = useState(false);

  // Default to tomorrow; today is not allowed
  const [selectedDate, setSelectedDate] = useState(tomorrowISO());
  const [slotsByDate, setSlotsByDate] = useState({});

  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeEditing, setTimeEditing] = useState(null); // { dateKey, id, field }
  const [tempTime, setTempTime] = useState(new Date());

  const readAccessToken = async () => {
    const keys = ['access_token', 'access', 'token', 'authToken'];
    for (const k of keys) {
      const v = await AsyncStorage.getItem(k);
      if (v) return v;
    }
    return null;
  };

  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      try {
        setLoading(true);
        const s = await api(`/services/${serviceId}/`);

        setService(s.name || "");
        setDescription(s.description || "");
        setPrice(String(s.price ?? ""));
        setTag(s.type || "");

        const srvImages = Array.isArray(s.images) ? s.images : s.image ? [s.image] : [];
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

        const rawAvail = s.availabilities ?? s.availabilities_map ?? [];
        setSlotsByDate(listAvailToSlotsMap(rawAvail));
      } catch (e) {
        Alert.alert("Error", String(e.message || e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [serviceId]);

  const dateIsLocked = isTodayOrPast(selectedDate);

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
    if (dateIsLocked) {
      Alert.alert("Date locked", "You can’t add time slots for today or past dates.");
      return;
    }
    const start = new Date(); start.setHours(10, 0, 0, 0);
    const end = new Date();   end.setHours(11, 0, 0, 0);
    const newSlot = { id: Math.random().toString(36).slice(2), start, end };
    setSlotsByDate((prev) => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), newSlot] }));
    openTimePicker(newSlot, "start");
  };

  const removeSlot = (id) => {
    setSlotsByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter((s) => s.id !== id),
    }));
  };

  const openTimePicker = (slot, field) => {
    if (dateIsLocked) {
      Alert.alert("Date locked", "Pick a date after today to edit its time.");
      return;
    }
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

  // SAVE
  const onSave = async () => {
    try {
      const availability = serializeAvailabilityForAPI(slotsByDate);

      const localImages = (images || []).filter((i) => i?.uri && !i.uri.startsWith("http"));
      const currentRemoteIds = (images || []).map((i) => i.id).filter(Boolean);
      const removedIds = originalImageIds.filter((id) => !currentRemoteIds.includes(id));

      const fd = new FormData();
      fd.append("name", service);
      fd.append("description", description);
      fd.append("price", String(price || 0));
      fd.append("type", tag);
      fd.append("availability", JSON.stringify(availability));

      if (removedIds.length > 0) {
        // tell server to delete those existing images
        fd.append("remove_image_ids", JSON.stringify(removedIds));
      }

      localImages.forEach((img, idx) => {
        const uri = img.uri;
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
        // ensure unique name if multiple files
        fd.append("images", { uri, name: filename || `photo_${idx}.jpg`, type });
      });

      // Use fetch so we control headers (do NOT set Content-Type)
      const accessToken = await readAccessToken();
      const headers = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const resp = await fetch(`${API_BASE}/services/${serviceId}/`, {
        method: "PATCH",
        headers,
        body: fd,
      });

      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(text || `HTTP ${resp.status}`);
      }

      let updated = null;
      try { updated = JSON.parse(text); } catch (e) { /* ignore */ }

      if (updated) {
        // normalize returned images and update state so UI reflects server canonical response
        const srvImages = Array.isArray(updated.images) ? updated.images : updated.image ? [updated.image] : [];
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
        // optionally update other fields in UI from returned object
        setService(updated.name || service);
        setDescription(updated.description || description);
        setPrice(String(updated.price ?? price));
        setTag(updated.type || tag);
      }

      Alert.alert("Saved", "Service updated successfully!");
      navigation?.goBack?.();
    } catch (e) {
      console.log('[EditServices onSave] error:', e);
      Alert.alert("Error", String(e.message || e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={height * 0.01}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.reset({ index: 0, routes: [{ name: "Profile", params: { refresh: true } }] }); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ zIndex: 2 }}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Services</Text>
          <View style={{ width: width * 0.12 }} />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Service</Text>
          <TextInput style={styles.input} value={service} onChangeText={setService} placeholder="Enter service name" autoCapitalize="sentences" returnKeyType="done" maxLength={15}/>

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} placeholder="Describe your service" multiline scrollEnabled textAlignVertical="top" />

          <Text style={styles.label}>Price</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" />

          <Text style={styles.label}>Service Tag</Text>
          <TouchableOpacity style={styles.select} onPress={() => setTagPickerVisible(true)}>
            <Text style={[styles.selectText, !tag && { color: "#9CA3AF" }]}>{tag || "Choose a tag"}</Text>
            <Icon name="chevron-down" size={width * 0.045} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.label}>Availability</Text>
          <View style={styles.calendarWrap}>
            <Calendar current={selectedDate} onDayPress={(d) => setSelectedDate(d.dateString)} markedDates={markedDates} minDate={tomorrowISO()} theme={{ textSectionTitleColor: "#9CA3AF", selectedDayBackgroundColor: "#FFD9E1", selectedDayTextColor: "#111827", todayTextColor: "#9CA3AF", arrowColor: "#ff6b8a", }} style={styles.calendar} />
          </View>

          {dateIsLocked && (<View style={styles.lockBanner}><Icon name="lock-closed-outline" size={16} color="#6B7280" /><Text style={styles.lockText}>Today and past dates are disabled. Pick a future date.</Text></View>)}

          {daySlots.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <TouchableOpacity style={[styles.timeBtn, styles.timeBtnLeft, dateIsLocked && styles.timeBtnDisabled]} onPress={() => openTimePicker(slot, "start")} disabled={dateIsLocked}>
                <Text style={[styles.timeText, dateIsLocked && styles.timeTextDisabled]}>{toTimeLabel(slot.start)}</Text>
              </TouchableOpacity>
              <Text style={styles.toDash}>—</Text>
              <TouchableOpacity style={[styles.timeBtn, styles.timeBtnRight, dateIsLocked && styles.timeBtnDisabled]} onPress={() => openTimePicker(slot, "end")} disabled={dateIsLocked}>
                <Text style={[styles.timeText, dateIsLocked && styles.timeTextDisabled]}>{toTimeLabel(slot.end)}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => (dateIsLocked ? null : removeSlot(slot.id))} style={[styles.iconBtn, dateIsLocked && styles.iconBtnDisabled]} accessibilityLabel="Remove slot" disabled={dateIsLocked}>
                <Icon name="close" size={width * 0.045} color={dateIsLocked ? "#C7CAD1" : "#6B7280"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={addSlot} style={[styles.iconBtn, dateIsLocked && styles.iconBtnDisabled]} accessibilityLabel="Add slot" disabled={dateIsLocked}>
                <Icon name="add" size={width * 0.05} color={dateIsLocked ? "#C7CAD1" : "#6B7280"} />
              </TouchableOpacity>
            </View>
          ))}

          {daySlots.length === 0 && (
            <TouchableOpacity onPress={addSlot} style={[styles.addFirstSlot, dateIsLocked && styles.addFirstSlotDisabled]} disabled={dateIsLocked}>
              <Icon name="add-circle-outline" size={width * 0.05} color={dateIsLocked ? "#C7CAD1" : undefined} />
              <Text style={[styles.addFirstSlotText, dateIsLocked && styles.timeTextDisabled]}>Add a time slot</Text>
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

        <Modal visible={timeModalVisible && !dateIsLocked} animationType="slide" transparent onRequestClose={closeTimeModal}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.timeSheet, { height: Math.max(320, Math.round(height * 0.5)) }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeTimeModal}><Text style={styles.cancelBtn}>Cancel</Text></TouchableOpacity>
                <Text style={styles.modalTitle}>Select time</Text>
                <TouchableOpacity onPress={commitTimeChange}><Text style={styles.doneBtn}>Done</Text></TouchableOpacity>
              </View>
              <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
                <Text style={{ color: "#6B7280" }}>{selectedDate}</Text>
              </View>
              <View style={{ flex: 1, alignSelf: "stretch" }}>
                <DateTimePicker
                  value={tempTime}
                  textColor="#000"
                  mode="time"
                  display="spinner"
                  onChange={(_, d) => { if (d) setTempTime(d); }}
                  style={{ flex: 1, alignSelf: "stretch" }}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={tagPickerVisible} animationType="slide" transparent onRequestClose={() => setTagPickerVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a tag</Text>
                <TouchableOpacity onPress={() => setTagPickerVisible(false)}><Icon name="close" size={width * 0.055} /></TouchableOpacity>
              </View>
              <FlatList data={["Haircuts","Nails","Makeup","Tutoring","Cooking","Cleaning","Beauty"]} keyExtractor={(item) => item} ItemSeparatorComponent={() => <View style={styles.sep} />} renderItem={({ item }) => {
                const selected = item === tag;
                return (
                  <TouchableOpacity style={styles.optionRow} onPress={() => { setTag(item); setTagPickerVisible(false); }}>
                    <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>{selected && <View style={styles.radioInner} />}</View>
                    <Text style={styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                );
              }} />
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
  header: { paddingTop: height * 0.01, paddingHorizontal: width * 0.04, paddingBottom: height * 0.012, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#F3F4F6", alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  backText: { color: "#6B7280", fontSize: width * 0.04 },
  title: { position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: width * 0.05, fontWeight: "700", color: "#ff6b8a" },
  content: { padding: width * 0.04, paddingBottom: height * 0.03, flexGrow: 1 },
  label: { marginTop: height * 0.015, marginBottom: height * 0.007, color: "#6B7280", fontSize: width * 0.033 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#fff", borderRadius: width * 0.025, paddingHorizontal: width * 0.03, paddingVertical: height * 0.016, fontSize: width * 0.038, color: "#111827" },
  textarea: { minHeight: height * 0.13, textAlignVertical: "top" },
  select: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: width * 0.025, paddingHorizontal: width * 0.03, paddingVertical: height * 0.016, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectText: { fontSize: width * 0.038, color: "#111827" },
  calendarWrap: { borderRadius: width * 0.035, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB", marginVertical: height * 0.01 },
  calendar: { borderRadius: width * 0.035 },
  lockBanner: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", marginTop: 8, marginBottom: 2 },
  lockText: { color: "#6B7280", fontSize: 12 },
  slotRow: { marginTop: height * 0.015, flexDirection: "row", alignItems: "center" },
  timeBtn: { flex: 1, borderWidth: 1, borderColor: "#E5E7EB", paddingVertical: height * 0.014, paddingHorizontal: width * 0.03, borderRadius: width * 0.025, backgroundColor: "#fff" },
  timeBtnDisabled: { opacity: 0.5 },
  timeBtnLeft: { marginRight: width * 0.02 },
  timeBtnRight: { marginLeft: width * 0.02 },
  timeText: { fontSize: width * 0.038, color: "#111827", textAlign: "center" },
  timeTextDisabled: { color: "#9CA3AF" },
  toDash: { marginHorizontal: width * 0.015, color: "#6B7280", fontSize: width * 0.045 },
  iconBtn: { marginLeft: width * 0.02, width: width * 0.09, height: width * 0.09, borderRadius: width * 0.045, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  iconBtnDisabled: { opacity: 0.5 },
  addFirstSlot: { marginTop: height * 0.014, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: width * 0.02, paddingVertical: height * 0.008, paddingHorizontal: width * 0.02, borderRadius: width * 0.022, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB" },
  addFirstSlotDisabled: { opacity: 0.6 },
  addFirstSlotText: { color: "#6B7280", marginLeft: width * 0.015 },
  imagePicker: { marginTop: height * 0.012, borderRadius: width * 0.03, borderWidth: 1, borderColor: "#E5E7EB", height: height * 0.22, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  imagePlaceholder: { width: "92%", height: "78%", borderRadius: width * 0.025, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  saveBtn: { backgroundColor: "#ff8ea5", paddingHorizontal: width * 0.07, paddingVertical: height * 0.017, borderRadius: width * 0.03, alignItems: "center", shadowColor: "#ff6b8a", shadowOpacity: 0.2, shadowRadius: width * 0.02, elevation: 2 },
  saveText: { fontWeight: "700", color: "white", fontSize: width * 0.04 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  timeSheet: { backgroundColor: "#fff", borderTopLeftRadius: width * 0.04, borderTopRightRadius: width * 0.04, paddingBottom: height * 0.03, paddingHorizontal: width * 0.03 },
  modalHeader: { paddingHorizontal: width * 0.02, paddingTop: height * 0.015, paddingBottom: height * 0.01, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontWeight: "700", fontSize: width * 0.04 },
  cancelBtn: { color: "#6B7280", fontSize: width * 0.04 },
  doneBtn: { color: "#ff6b8a", fontSize: width * 0.04, fontWeight: "700" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: width * 0.04, borderTopRightRadius: width * 0.04, paddingBottom: height * 0.025, maxHeight: "60%" },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB", marginLeft: width * 0.15 },
  optionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: width * 0.04, paddingVertical: height * 0.017 },
  optionText: { fontSize: width * 0.042, color: "#111827", marginLeft: width * 0.03 },
  radioOuter: { width: width * 0.055, height: width * 0.055, borderRadius: width * 0.0275, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  radioOuterActive: { borderColor: "#ff6b8a" },
  radioInner: { width: width * 0.03, height: width * 0.03, borderRadius: width * 0.015, backgroundColor: "#ff6b8a" },
});
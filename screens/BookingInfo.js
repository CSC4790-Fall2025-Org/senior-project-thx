import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";

// ---- Example fallback ----
const EXAMPLE_SERVICE = {
  service_id: "1",
  name: "Nails",
  providerName: "Allyssa Panganiban",
  suggestedLocation: "Klekotka Hall",
  availability: {
    "2025-10-01": [
      { start: "2025-10-01T10:00:00.000Z", end: "2025-10-01T11:00:00.000Z" },
      { start: "2025-10-01T11:00:00.000Z", end: "2025-10-01T12:00:00.000Z" },
    ],
    "2025-10-02": [
      { start: "2025-10-02T14:00:00.000Z", end: "2025-10-02T15:00:00.000Z" },
    ],
  },
};

const toTimeLabel = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const firstDateKey = (obj) => Object.keys(obj || {})[0];

export default function BookingInfo({ navigation, route }) {
  const service = route?.params?.service ?? EXAMPLE_SERVICE;

  // Client fields
  const [name, setName] = useState(route?.params?.prefill?.name ?? "");
  const [location, setLocation] = useState(route?.params?.prefill?.location ?? "");
  const [email, setEmail] = useState(route?.params?.prefill?.email ?? "");

  // Calendar + time selection
  const initialDate = firstDateKey(service.availability) || new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  const markedDates = useMemo(() => {
    const marks = { [selectedDate]: { selected: true, selectedColor: "#FFD9E1" } };
    Object.keys(service.availability || {}).forEach((d) => {
      if (!marks[d]) marks[d] = { marked: true, dotColor: "#ff6b8a" };
      else marks[d] = { ...marks[d], marked: true, dotColor: "#ff6b8a" };
    });
    return marks;
  }, [selectedDate, service.availability]);

  const daySlots = service.availability?.[selectedDate] ?? [];

  const onPickDate = (d) => {
    setSelectedDate(d.dateString);
    setSelectedSlotIndex(null);
  };

  const onSave = () => {
    if (!name.trim()) return Alert.alert("Missing info", "Please enter your name.");
    if (!email.trim()) return Alert.alert("Missing info", "Please enter your email.");
    if (selectedSlotIndex == null || !daySlots[selectedSlotIndex]) {
      return Alert.alert("Select a time", "Please choose an appointment time.");
    }
    const { start, end } = daySlots[selectedSlotIndex];

    const payload = {
      service_id: service.service_id,
      service_name: service.name,
      client: { name, email },
      location,
      appointment: {
        date: selectedDate,
        start_iso: start,
        end_iso: end,
      },
    };

    console.log("Booking payload:\n", JSON.stringify(payload, null, 2));
    Alert.alert("Booked", "Your appointment request has been submitted.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={8}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Book Appointment</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            autoCapitalize="words"
          />

          {/* Suggested Location */}
          <Text style={styles.label}>Suggested Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Where to meet"
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Appointment Slot */}
          <Text style={styles.label}>Appointment Slot</Text>
          <View style={styles.calendarWrap}>
            <Calendar
              current={selectedDate}
              onDayPress={onPickDate}
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

          {/* Time chips */}
          {daySlots.length > 0 ? (
            <View style={styles.timeListCard}>
              <View style={styles.chipsRow}>
                {daySlots.map((slot, idx) => {
                  const selected = idx === selectedSlotIndex;
                  return (
                    <TouchableOpacity
                      key={`${slot.start}-${idx}`}
                      style={[styles.timeChip, selected && styles.timeChipSelected]}
                      onPress={() => setSelectedSlotIndex(idx)}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>
                        {toTimeLabel(slot.start)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <Text style={styles.noTimes}>No times available for this date.</Text>
          )}

          {/* Save */}
          <View style={{ height: 16 }} />
          <TouchableOpacity onPress={onSave} style={styles.saveBtn} activeOpacity={0.9}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---- Styles ---- */
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

  calendarWrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  calendar: { borderRadius: 14 },

  timeListCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  timeChip: {
    minWidth: 110,
    borderWidth: 1,
    borderColor: "#60A5FA",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  timeChipSelected: {
    backgroundColor: "#60A5FA",
  },
  timeChipText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  timeChipTextSelected: {
    color: "#fff",
  },

  noTimes: { marginTop: 10, color: "#6B7280" },

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
});
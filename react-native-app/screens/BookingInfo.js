import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { api } from "../src/api";

const DEMO_HEADERS = {};

const toTimeLabel = (hhmmss) => {
  try {
    const [h, m] = (hhmmss || "").split(":").map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return hhmmss || "";
  }
};
const firstDateKey = (obj) => Object.keys(obj || {})[0];

export default function BookingInfo({ navigation, route }) {
  // Expect: { serviceId, serviceName, price } — slots will be fetched fresh
  const { serviceId } = route?.params || {};
  const routeName = route?.params?.serviceName;
  const routePrice = route?.params?.price;

  // Live data from API
  const [serviceName, setServiceName] = useState(routeName || "");
  const [price, setPrice] = useState(routePrice);
  const [slots, setSlots] = useState([]); // [{id,date,start_time,end_time}]
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState("");

  // Form state (blank by default)
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Build date -> [{id,start_time,end_time}]
  const availabilityMap = useMemo(() => {
    const map = {};
    (Array.isArray(slots) ? slots : []).forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push({ id: s.id, start_time: s.start_time, end_time: s.end_time });
    });
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => (a.start_time > b.start_time ? 1 : -1));
    });
    return map;
  }, [slots]);

  // Calendar & chip state
  const [selectedDate, setSelectedDate] = useState(firstDateKey(availabilityMap) || new Date().toISOString().slice(0, 10));
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // If slots change and current date is no longer present, reset selection to first available
  useEffect(() => {
    const firstDate = firstDateKey(availabilityMap);
    if (!availabilityMap[selectedDate]) {
      setSelectedDate(firstDate || new Date().toISOString().slice(0, 10));
      setSelectedSlotId(null);
    } else {
      // also clear slot if that specific slot no longer exists
      if (selectedSlotId) {
        const stillThere = (availabilityMap[selectedDate] || []).some((s) => s.id === selectedSlotId);
        if (!stillThere) setSelectedSlotId(null);
      }
    }
  }, [availabilityMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const markedDates = useMemo(() => {
    const marks = { [selectedDate]: { selected: true, selectedColor: "#FFD9E1" } };
    Object.keys(availabilityMap).forEach((d) => {
      if (!marks[d]) marks[d] = { marked: true, dotColor: "#ff6b8a" };
      else marks[d] = { ...marks[d], marked: true, dotColor: "#ff6b8a" };
    });
    return marks;
  }, [selectedDate, availabilityMap]);

  const daySlots = availabilityMap[selectedDate] || [];

  // Fetch latest service details (incl. filtered availabilities) from API
  const fetchSlots = useCallback(async () => {
    if (!serviceId) return;
    try {
      setSlotsError("");
      setLoadingSlots(true);
      const data = await api(`/services/${serviceId}/`, { headers: { ...DEMO_HEADERS } });
      // Expect data.availabilities already excludes booked slots per backend
      setSlots(Array.isArray(data?.availabilities) ? data.availabilities : []);
      if (!routeName && data?.name) setServiceName(data.name);
      if (routePrice == null && data?.price != null) setPrice(data.price);
    } catch (e) {
      setSlotsError(e?.message?.toString() || "Failed to load slots.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, routeName, routePrice]);

  // Refresh on screen focus and on first mount
  useFocusEffect(
    useCallback(() => {
      fetchSlots();
    }, [fetchSlots])
  );

  const onPickDate = (d) => {
    setSelectedDate(d.dateString);
    setSelectedSlotId(null);
  };

  const onSave = async () => {
    if (!serviceId) return Alert.alert("Missing service", "Service is not specified.");
    if (!name.trim()) return Alert.alert("Missing info", "Please enter your name.");
    if (!email.trim()) return Alert.alert("Missing info", "Please enter your email.");
    if (!selectedSlotId) return Alert.alert("Select a time", "Please choose an appointment time.");

    const payload = {
      service: serviceId,
      time: selectedSlotId, // Availability.id
      location,
      customer_name: name,
      customer_email: email,
    };

    try {
      setSubmitting(true);
      const res = await api("/bookings/", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { ...DEMO_HEADERS },
      });
      // After booking, refetch in case user stays here
      await fetchSlots();
      Alert.alert("Booked!", "Your appointment has been created.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
      // console.log("Booking created:", res);
    } catch (e) {
      Alert.alert("Booking failed", e?.message?.toString() || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Guard if route missing id
  if (!serviceId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={[styles.flex, { alignItems: "center", justifyContent: "center", padding: 16 }]}>
          <Text>Missing service details. Please go back and try again.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            <Text style={{ color: "#ED7678" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={8}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation?.goBack?.()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ zIndex: 2, elevation: 2 }}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title} pointerEvents="none">Book Appointment</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Service summary */}
          <Text style={styles.serviceName}>{serviceName || "Service"}</Text>
          {Number.isFinite(Number(price)) && (
            <Text style={styles.price}>${Number(price).toFixed(2)}</Text>
          )}

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

          {loadingSlots ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" />
              <Text style={{ marginTop: 8, color: "#6B7280" }}>Loading available times…</Text>
            </View>
          ) : slotsError ? (
            <View style={{ paddingVertical: 12 }}>
              <Text style={{ color: "crimson" }}>{slotsError}</Text>
              <TouchableOpacity onPress={fetchSlots} style={{ marginTop: 8 }}>
                <Text style={{ color: "#ED7678" }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
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
                    {daySlots.map((slot) => {
                      const selected = selectedSlotId === slot.id;
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          style={[styles.timeChip, selected && styles.timeChipSelected]}
                          onPress={() => setSelectedSlotId(slot.id)}
                          activeOpacity={0.9}
                        >
                          <Text style={[styles.timeChipText, selected && styles.timeChipTextSelected]}>
                            {toTimeLabel(slot.start_time)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <Text style={styles.noTimes}>No times available for this date.</Text>
              )}
            </>
          )}

          {/* Save */}
          <View style={{ height: 16 }} />
          <TouchableOpacity
            onPress={onSave}
            style={[styles.saveBtn, (submitting || loadingSlots) && { opacity: 0.7 }]}
            activeOpacity={0.9}
            disabled={submitting || loadingSlots}
          >
            <Text style={styles.saveText}>{submitting ? "Saving..." : "Save"}</Text>
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

  serviceName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  price: { marginTop: 2, marginBottom: 8, color: "#6B7280" },

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
  timeChipSelected: { backgroundColor: "#60A5FA" },
  timeChipText: { color: "#2563EB", fontWeight: "600" },
  timeChipTextSelected: { color: "#fff" },

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
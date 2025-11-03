import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../src/api";

const { height } = Dimensions.get("window");
const DEMO_HEADERS = {};

/** Turn "HH:MM[:SS]" into a friendly label as a wall-clock time. */
const toTimeLabel = (hhmmss) => {
  try {
    const [hStr, mStr] = String(hhmmss || "").split(":");
    const h = parseInt(hStr || "0", 10);
    const m = parseInt(mStr || "0", 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return hhmmss || "";
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return hhmmss || "";
  }
};

export default function ViewBooking({ navigation, route }) {
  const {
    serviceId,
    serviceName: routeServiceName,
    price: routePrice,
    prefill,
    preselect, // { date, timeId?, start_time?, end_time? }
  } = route?.params || {};

  // Header info (we keep it from params; optionally refresh if serviceId is present)
  const [serviceName, setServiceName] = useState(routeServiceName || "");
  const [price, setPrice] = useState(
    typeof routePrice === "number" || typeof routePrice === "string"
      ? routePrice
      : undefined
  );

  // Read-only form values
  const [name] = useState(prefill?.name || "");
  const [location] = useState(prefill?.location || "");
  const [email] = useState(prefill?.email || "");

  // Selected (locked) date/time
  const selectedDate = preselect?.date || new Date().toISOString().slice(0, 10);
  const startTimeLabel = useMemo(
    () => (preselect?.start_time ? toTimeLabel(preselect.start_time) : ""),
    [preselect?.start_time]
  );
  const endTimeLabel = useMemo(
    () => (preselect?.end_time ? toTimeLabel(preselect.end_time) : ""),
    [preselect?.end_time]
  );

  // Only to refresh name/price if you want fresher values; UI stays read-only
  const refreshHeader = useCallback(async () => {
    if (!serviceId) return;
    try {
      const data = await api(`/services/${serviceId}/`, { headers: { ...DEMO_HEADERS } });
      if (!serviceName && data?.name) setServiceName(data.name);
      if (price == null && data?.price != null) setPrice(data.price);
    } catch {
      // ignore refresh errors; we still show the params
    }
  }, [serviceId, serviceName, price]);

  useFocusEffect(
    useCallback(() => {
      refreshHeader();
    }, [refreshHeader])
  );

  // Calendar marks & lock
  const markedDates = useMemo(
    () => ({ [selectedDate]: { selected: true, selectedColor: "#FFD9E1" } }),
    [selectedDate]
  );

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
          <Text style={styles.title} pointerEvents="none">Booking Details</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Service summary */}
          <Text style={styles.serviceName}>{serviceName || "Service"}</Text>
          {price != null && price !== "" && !Number.isNaN(Number(price)) && (
            <Text style={styles.price}>${Number(price).toFixed(2)}</Text>
          )}

          {/* Read-only fields */}
          <Text style={styles.label}>Client Name</Text>
          <TextInput
            style={[styles.input, styles.readonly]}
            value={name}
            editable={false}
            selectTextOnFocus={false}
            placeholder="Client full name"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={[styles.input, styles.readonly]}
            value={location}
            editable={false}
            selectTextOnFocus={false}
            placeholder="Where to meet"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readonly]}
            value={email}
            editable={false}
            selectTextOnFocus={false}
            placeholder="client@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Appointment Slot */}
          <Text style={styles.label}>Appointment Slot</Text>

          {/* Calendar locked to selectedDate */}
          <View style={styles.calendarWrap}>
            <Calendar
              current={selectedDate}
              markedDates={markedDates}
              hideArrows
              minDate={selectedDate}
              maxDate={selectedDate}
              disableAllTouchEventsForDisabledDays
              // no onDayPress—read-only
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

          {/* Read-only time pill */}
          <View style={styles.timeListCard}>
            <View style={styles.chipsRow}>
              <View style={[styles.timeChip, styles.timeChipSelected]}>
                <Text style={styles.timeChipTextSelected}>
                  {startTimeLabel && endTimeLabel
                    ? `${startTimeLabel} – ${endTimeLabel}`
                    : startTimeLabel || "Time"}
                </Text>
              </View>
            </View>
          </View>

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
  readonly: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280",
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
  timeChipTextSelected: { color: "#fff", fontWeight: "700" },
});
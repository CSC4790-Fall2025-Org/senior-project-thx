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
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { api } from "../src/api";

const TAG_OPTIONS = [
  "Haircuts",
  "Nails",
  "Makeup",
  "Tutoring",
  "Cooking",
  "Cleaning",
  "Beauty",
];

const { width, height } = Dimensions.get("window");
const todayISO = () => new Date().toISOString().slice(0, 10);
const toTimeLabel = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const parseAvailability = (availabilityObj) => {
  if (!availabilityObj) return {};
  const out = {};
  Object.entries(availabilityObj).forEach(([date, slots]) => {
    out[date] = (slots || []).map((s) => ({
      id: Math.random().toString(36).slice(2),
      start: new Date(s.start),
      end: new Date(s.end),
    }));
  });
  return out;
};

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

export default function EditServices({ navigation, route }) {
  const params = route?.params || {};
  const serviceId = params.serviceId ?? params.service_id; // supports either
  console.log("EditServices route params:", params, "→ serviceId:", serviceId);

  const [loading, setLoading] = useState(false);

  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState("");

  const [imageUri, setImageUri] = useState(null);   // picked locally
  const [serverImage, setServerImage] = useState(null); // URL from backend
  const [imageLocal, setImageLocal] = useState(null); // fixes your ReferenceError

  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [slotsByDate, setSlotsByDate] = useState({});

  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeEditing, setTimeEditing] = useState(null); // { dateKey, id, field }
  const [tempTime, setTempTime] = useState(new Date());

  // Put above the component
  const listAvailToSlotsMap = (list) => {
    if (!Array.isArray(list)) return {};
    const out = {};
    list.forEach((a) => {
      const date = a.date; // "YYYY-MM-DD"
      // combine date + time strings into JS Dates
      const start = new Date(`${a.date}T${a.start_time}`);
      const end   = new Date(`${a.date}T${a.end_time}`);
      (out[date] = out[date] || []).push({
        id: String(a.id ?? Math.random().toString(36).slice(2)),
        start,
        end,
      });
    });
    return out;
  };

  // Load the existing service from backend
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
        setServerImage(s.image || null);
        // setSlotsByDate(parseAvailability(s.availabilities_map || s.availabilities || s.availability)); 
        setSlotsByDate(listAvailToSlotsMap(s.availabilities));
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

  // const pickImage = async () => {
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     quality: 0.8,
  //   });
  //   if (!result.canceled) {
  //     setImageUri(result.assets[0].uri);
  //     // setImageLocal(null);
  //     setServerImage(null);
  //   }
  // };
  const pickImage = async () => {
  await pickImageAndPersist((uri) => {
    setImageUri(uri);
    setImageLocal(uri);
  }, `editServiceImage:${serviceId}`);
};


  // const onSave = () => {
  //   const availability = serializeAvailabilityISO(slotsByDate);

  //   const payload = {
  //     id: EXAMPLE.id,
  //     owner_name: EXAMPLE.name,
  //     location: EXAMPLE.location,
  //     service: {
  //       service_id: initial?.service_id ?? "1",
  //       name: service,
  //       description,
  //       price: Number(price),
  //       tag,
  //       image: imageUri || imageLocal,
  //       availability,
  //     },
  //   };

  //   console.log("Saving (Edit):\n", JSON.stringify(payload, null, 2));
  //   Alert.alert("Saved", "Service updated successfully!");
  //   // TODO: PUT/PATCH to your backend
  // };
  const onSave = async () => {
    try {
      const availability = serializeAvailabilityISO(slotsByDate);

      if (imageUri) {
        const fd = new FormData();
        fd.append("name", service);
        fd.append("description", description);
        fd.append("price", String(price || 0));
        fd.append("type", tag);
        fd.append("image", { uri: imageUri, name: "service.jpg", type: "image/jpeg" });
        fd.append("availability", JSON.stringify(availability));
        await api(`/services/${serviceId}/`, { method: "PATCH", body: fd });
      } else {
        await api(`/services/${serviceId}/`, {
          method: "PATCH",
          body: JSON.stringify({
            name: service,
            description,
            price,
            type: tag,
            availability,
          }),
        });
      }

      Alert.alert("Saved", "Service updated successfully!");
      navigation?.goBack?.();
    } catch (e) {
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

          <Text style={styles.label}>Service Image</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : imageLocal ? (
              <Image
                source={imageLocal}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="image-outline" size={width * 0.09} color="#9CA3AF" />
                <Text style={{ color: "#9CA3AF", marginTop: "4%" }}>
                  Tap to choose photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

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
                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterActive,
                        ]}
                      >
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
    paddingTop: height * 0.01,
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.012,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backText: { color: "#6B7280", fontSize: width * 0.04 },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: width * 0.05,
    fontWeight: "700",
    color: "#ff6b8a",
  },
  content: { padding: width * 0.04, paddingBottom: height * 0.03, flexGrow: 1 },
  label: {
    marginTop: height * 0.015,
    marginBottom: height * 0.007,
    color: "#6B7280",
    fontSize: width * 0.033,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    borderRadius: width * 0.025,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.016,
    fontSize: width * 0.038,
    color: "#111827",
  },
  textarea: { minHeight: height * 0.13, textAlignVertical: "top" },
  select: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: width * 0.025,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.016,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: width * 0.038, color: "#111827" },
  calendarWrap: {
    borderRadius: width * 0.035,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginVertical: height * 0.01,
  },
  calendar: { borderRadius: width * 0.035 },
  slotRow: {
    marginTop: height * 0.015,
    flexDirection: "row",
    alignItems: "center",
  },
  timeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: height * 0.014,
    paddingHorizontal: width * 0.03,
    borderRadius: width * 0.025,
    backgroundColor: "#fff",
  },
  timeBtnLeft: { marginRight: width * 0.02 },
  timeBtnRight: { marginLeft: width * 0.02 },
  timeText: { fontSize: width * 0.038, color: "#111827", textAlign: "center" },
  toDash: { marginHorizontal: width * 0.015, color: "#6B7280", fontSize: width * 0.045 },
  iconBtn: {
    marginLeft: width * 0.02,
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: width * 0.045,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  addFirstSlot: {
    marginTop: height * 0.014,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: width * 0.02,
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.02,
    borderRadius: width * 0.022,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addFirstSlotText: { color: "#6B7280", marginLeft: width * 0.015 },
  imagePicker: {
    marginTop: height * 0.012,
    borderRadius: width * 0.03,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: height * 0.22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "92%",
    height: "78%",
    borderRadius: width * 0.025,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  saveBtn: {
    backgroundColor: "#ff8ea5",
    paddingHorizontal: width * 0.07,
    paddingVertical: height * 0.017,
    borderRadius: width * 0.03,
    alignItems: "center",
    shadowColor: "#ff6b8a",
    shadowOpacity: 0.2,
    shadowRadius: width * 0.02,
    elevation: 2,
  },
  saveText: { fontWeight: "700", color: "white", fontSize: width * 0.04 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  timeSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: width * 0.04,
    borderTopRightRadius: width * 0.04,
    paddingBottom: height * 0.03,
    paddingHorizontal: width * 0.03,
  },
  modalHeader: {
    paddingHorizontal: width * 0.02,
    paddingTop: height * 0.015,
    paddingBottom: height * 0.01,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontWeight: "700", fontSize: width * 0.04 },
  cancelBtn: { color: "#6B7280", fontSize: width * 0.04 },
  doneBtn: { color: "#ff6b8a", fontSize: width * 0.04, fontWeight: "700" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: width * 0.04,
    borderTopRightRadius: width * 0.04,
    paddingBottom: height * 0.025,
    maxHeight: "60%",
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginLeft: width * 0.15,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.017,
  },
  optionText: { fontSize: width * 0.042, color: "#111827", marginLeft: width * 0.03 },
  radioOuter: {
    width: width * 0.055,
    height: width * 0.055,
    borderRadius: width * 0.0275,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: "#ff6b8a" },
  radioInner: {
    width: width * 0.03,
    height: width * 0.03,
    borderRadius: width * 0.015,
    backgroundColor: "#ff6b8a",
  },
});
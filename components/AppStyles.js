import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Common colors and gradient for the app
export const colors = {
  primary: '#ed9b9cff',          // main accent (right side of gradient)
  gradientStart: '#F6C484',    // gradient left side
  gradientEnd: '#ED7678',      // gradient right side
  secondary: '#AB6DA9',        // secondary accent
  background: '#FDF8F7',       // page background
  card: '#fff',                // card and input backgrounds
  placeholder: '#E0E0E0',      // placeholder backgrounds
  heading: '#4C3A32',          // headings (profile name, section titles)
  textPrimary: '#333',         // main text
  accent: '#fff',              // reversed text on colored backgrounds
  border: '#EEE',              // input borders
};

// Styles for the app (does not include the gradient component itself)
export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  // Use this style for the <LinearGradient> component in your screen file
  headerBg: {
    width: '100%',
    height: 80,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 88, // Increased to move avatar below gradient
    marginBottom: 8,
    paddingHorizontal: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginRight: 14,
  },
  avatarIcon: { fontSize: 40 },
  nameText: { fontSize: 22, fontWeight: 'bold', color: colors.heading },
  inputSection: { paddingHorizontal: 32, marginBottom: 12 },
  label: { fontSize: 14, color: colors.heading, marginBottom: 2, marginTop: 10 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: colors.heading,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addServicesBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  addServicesText: { color: colors.accent, fontWeight: 'bold', fontSize: 16 },
  servicesContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: '2%',
    color: colors.heading,
  },
});
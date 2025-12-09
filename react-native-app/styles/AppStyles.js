import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Common colors and gradient for the app
export const colors = {
  primary: '#ed9b9cff',
  gradientStart: '#F6C484',
  gradientEnd: '#ED7678',
  secondary: '#AB6DA9',
  background: '#FDF8F7',
  card: '#fff',
  placeholder: '#E0E0E0',
  heading: '#4C3A32',
  textPrimary: '#333',
  accent: '#fff',
  border: '#EEE',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  headerBg: {
    width: width,
    height: height * 0.13, // 10% of screen height
    position: 'absolute',
    paddingTop: height * 0.06,
    
    justifyContent: 'center',
    alignContents: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.11, // ~11% of screen height
    marginBottom: height * 0.01,
    paddingHorizontal: width * 0.08, // 8% of screen width
  },
  avatarCircle: {
    width: width * 0.20, // 20% of screen width
    height: width * 0.20,
    borderRadius: width * 0.10, // Half of width for perfect circle
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.01,
    marginRight: width * 0.04,
  },
  avatarIcon: { fontSize: width * 0.10 }, // 10% of screen width
  nameText: { fontSize: width * 0.055, fontWeight: 'bold', color: colors.heading },
  inputSection: { paddingHorizontal: width * 0.08, marginBottom: height * 0.015 },
  label: {
    fontSize: width * 0.037,
    color: colors.heading,
    marginBottom: height * 0.003,
    marginTop: height * 0.012,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: width * 0.02,
    padding: width * 0.025,
    fontSize: width * 0.04,
    color: colors.heading,
    marginBottom: height * 0.005,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addServicesBtn: {
    backgroundColor: colors.primary,
    borderRadius: width * 0.04,
    paddingVertical: height * 0.015, // About 1.8% of screen height
    paddingHorizontal: width * 0.05,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: width * 0.018,
    elevation: 2,
    marginBottom: height * 0.01,
  },
  addServicesText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: width * 0.042,
  },
  servicesContainer: {
    marginHorizontal: width * 0.05,
    marginTop: height * 0.01,
    marginBottom: height * 0.015,
  },
  sectionTitle: {
    fontSize: width * 0.048,
    fontWeight: '600',
    marginVertical: height * 0.02,
    color: colors.heading,
  },
});
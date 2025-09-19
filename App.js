import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppStack } from './navigation/Stack';
import { LinearGradient } from 'expo-linear-gradient';
console.log("App.js loaded");

export default function App() {
  return (
   <NavigationContainer>
      <AppStack />
   </NavigationContainer>
  );
}


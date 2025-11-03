import { createNativeStackNavigator } from "@react-navigation/native-stack";
import 'react-native-gesture-handler';

import Home from "../screens/Home";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import Profile from "../screens/Profile";
import MyBookings from "../screens/MyBookings";
import SavedServices from "../screens/SavedServices";
import ServiceDetails from "../screens/ServiceDetails";
import BookingInfo from "../screens/BookingInfo";
import AddServices from "../screens/AddServices";
import EditServices from "../screens/EditServices";
import MessageList from "../screens/MessageList";
import Messages from "../screens/Messages";
import Test from "../screens/Test";
import ViewBooking from '../screens/ViewBooking';

const Stack = createNativeStackNavigator();

export const AppStack = () => {
  return (
    
      <Stack.Navigator initialRouteName="Test" screenOptions={{ headerShown: false }}>
        {/* Test */}
        <Stack.Screen name= "Test" component={Test} />
        {/* Auth */}
        <Stack.Screen name= "Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />

        {/* Main App */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="MyBookings" component={MyBookings} />
        <Stack.Screen name="ViewBooking" component={ViewBooking} />
        <Stack.Screen name="SavedServices" component={SavedServices} />
        <Stack.Screen name="ServiceDetails" component={ServiceDetails} />
        <Stack.Screen name="BookingInfo" component={BookingInfo} />

        {/* Services Management */}
        <Stack.Screen name="AddServices" component={AddServices} />
        <Stack.Screen name="EditServices" component={EditServices} />

        {/* Messaging */}
        <Stack.Screen name="MessageList" component={MessageList} />
        <Stack.Screen name="Messages" component={Messages} />
      </Stack.Navigator>
      
  );
}

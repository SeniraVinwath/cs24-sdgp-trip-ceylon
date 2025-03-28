// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';

// // Import your screen components
// import HomeScreen from '../app/HomeScreen';
// import LoginScreen from '../app/LoginScreen';
// import RegisterLuggageScreen from '../app/RegisterLuggageScreen';
// import LuggageListScreen from '../app/LuggageListScreen';
// import LuggageDetailsScreen from '../app/LuggageDetailsScreen';
// import LuggageLocationScreen from '../app/LuggageLocationScreen';
// import UserIdEntryScreen from './screens/UserIdEntryScreen';

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();

// // Tab navigator for the main app (after login)
// function MainTabs() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;
          
//           if (route.name === 'LuggageList') {
//             iconName = focused ? 'ios-briefcase' : 'ios-briefcase-outline';
//           } else if (route.name === 'AddLuggage') {
//             iconName = focused ? 'ios-add-circle' : 'ios-add-circle-outline';
//           } else if (route.name === 'Profile') {
//             iconName = focused ? 'ios-person' : 'ios-person-outline';
//           }
          
//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: '#65C466',
//         tabBarInactiveTintColor: 'gray',
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen 
//         name="LuggageList" 
//         component={LuggageListStack} 
//         options={{ title: 'My Luggage' }}
//       />
//       <Tab.Screen 
//         name="AddLuggage" 
//         component={RegisterLuggageScreen} 
//         options={{ title: 'Add Luggage' }}
//       />
//       <Tab.Screen 
//         name="Profile" 
//         component={ProfileScreen} 
//         options={{ title: 'Profile' }}
//       />
//     </Tab.Navigator>
//   );
// }

// // Stack navigator for the luggage list and details screens
// function LuggageListStack() {
//   return (
//     <Stack.Navigator
//       screenOptions={{
//         headerStyle: {
//           backgroundColor: '#65C466',
//         },
//         headerTintColor: '#fff',
//       }}
//     >
//       <Stack.Screen 
//         name="LuggageList" 
//         component={LuggageListScreen} 
//         options={{ title: 'My Luggage' }}
//       />
//       <Stack.Screen 
//         name="LuggageDetails" 
//         component={LuggageDetailsScreen} 
//         options={({ route }) => ({ title: route.params?.name || 'Luggage Details' })}
//       />
//       <Stack.Screen 
//         name="LuggageLocation" 
//         component={LuggageLocationScreen} 
//         options={{ title: 'Track Luggage' }}
//       />
//     </Stack.Navigator>
//   );
// }

// // Profile placeholder screen
// function ProfileScreen() {
//   return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Profile Screen</Text></View>;
// }

// // Main navigation container
// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         initialRouteName="HomeScreen"
//         screenOptions={{
//           headerStyle: {
//             backgroundColor: '#65C466',
//           },
//           headerTintColor: '#fff',
//           headerShown: false,
//         }}
//       >
//         <Stack.Screen 
//           name="HomeScreen" 
//           component={HomeScreen} 
//         />
//         <Stack.Screen 
//           name="Login" 
//           component={LoginScreen} 
//         />
//         <Stack.Screen 
//           name="UserIdEntry" 
//           component={UserIdEntryScreen} 
//         />
//         <Stack.Screen 
//           name="MainApp" 
//           component={MainTabs} 
//         />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }
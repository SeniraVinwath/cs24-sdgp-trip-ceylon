import { View, Text } from 'react-native'
import React from 'react'
// import { Stack } from 'expo-router'

import { Stack } from "expo-router";

export default function Layout() {
  return <Stack />;
}




// export default function RootLayout(){
//   return (
//     <Stack>
//       <Stack.Screen name="Home" options={{title:'Home'}} />
//       <Stack.Screen name="Scanner" component={{title:'Home'}} />
//     </Stack>
//   )
// }

// const _layout = () => {
//   return (
//     <Stack 
//         screenOptions={{
//             headerShown: false
//         }}
//     />
//   )
// }

// export default _layout
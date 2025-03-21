import { View, Text, Button } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Loading from '../components/Loading'
import { theme } from '../constants/theme'

const index = () => {
    const router = useRouter();
  return (
    <View style={{flex:1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.themebg}}>
      <Loading />
    </View>
  )
}

export default index
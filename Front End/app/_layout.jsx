import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'

const _layout = () => {
  return (
  <AuthProvider>
    <MainLayout />
  </AuthProvider>
)
}

const MainLayout = () => {
    const {setAuth, setUserData} = useAuth();
    const router = useRouter();

    useEffect(()=>{
      supabase.auth.onAuthStateChange((_event, session) => {
        console.log('session user: ', session?.user?.id)

        if(session){
          setAuth(session?.user);
          updateUserData(session?.user)
          router.replace('/C-home')
        } else{
          setAuth(null);
          router.replace('/C-home')
        }
      })
    },[])

    const updateUserData = async (user) => {
      let res = await getUserData(user?.id);
      if(res.success) setUserData(res.data);
    }

  return (
    <Stack 
        screenOptions={{
            headerShown: false
        }}
    />
  )
}

export default _layout
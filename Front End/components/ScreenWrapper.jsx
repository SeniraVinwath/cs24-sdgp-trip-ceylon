import { View, StatusBar } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'

const ScreenWrapper = ({children, bg, statusBarStyle = "light-content"}) => {
    const {top} = useSafeAreaInsets();
    const {user} = useAuth();
    const [initialLoad, setInitialLoad] = useState(true);
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoad(false);
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);
    
    const shouldAdjustPadding = user && initialLoad;
    const paddingTop = shouldAdjustPadding ? 0 : top;
    
    return (
        <>
            <StatusBar backgroundColor={bg} barStyle={statusBarStyle} />
            <View style={{
                flex: 1, 
                backgroundColor: bg,
                paddingTop
            }}>
                {children}
            </View>
        </>
    )
}

export default ScreenWrapper
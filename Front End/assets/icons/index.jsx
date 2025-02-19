import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Home from './Home'
import { theme } from '../../constants/theme'
import ArrowLeft from './ArrowLeft'
import Mail from './Mail'
import Lock from './Lock'
import User from './User'
import ViewTrue from './Viewture'
import ViewFalse from './Viewfalse'
import Calendar from './Calendar'
import Contact from './Contact'
import Language from './Language'
import ArrowRight from './ArrowRight'
import GlobalSearch from './GlobalSearch'

const icons = {
    home: Home,
    arrowLeft: ArrowLeft,
    mail: Mail,
    lock: Lock,
    user: User,
    viewTrue: ViewTrue,
    viewFalse: ViewFalse,
    calendar: Calendar,
    contact: Contact,
    language: Language,
    arrowRight: ArrowRight,
    globalSearch: GlobalSearch,
    
}

const Icon = ({name, ...props}) => {
    const IconComponent = icons[name];
  return (
    <IconComponent
        height={props.size || 24}
        width={props.size || 24}
        strokeWidth={props.strokeWidth || 1.9}
        color={theme.colors.textWhite}
        {...props}
    />
  )
}

export default Icon

const styles = StyleSheet.create({})
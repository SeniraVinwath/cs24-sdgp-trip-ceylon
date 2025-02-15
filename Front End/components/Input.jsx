import { StyleSheet, TextInput, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'

const Input = (props) => {
  return (
    <View style={[styles.container, props.containerStyles]}>
      {props.icon && React.cloneElement(props.icon, { color: '#475569' })}
      <TextInput
        style={styles.textInput}
        placeholderTextColor="#94A3B8"
        secureTextEntry={props.secureTextEntry}
        ref={props.inputRef}
        {...props}
      />
      {props.rightIcon && (
        <TouchableOpacity onPress={props.onRightIconPress}>
          {props.rightIcon}
        </TouchableOpacity>
      )}
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(6.5),
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    borderRadius: theme.radius.xxl,
    paddingHorizontal: 18,
    gap: 12
  },
  textInput: {
    flex: 1,
    color: '#000'
  }
})

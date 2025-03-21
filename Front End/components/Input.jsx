import { StyleSheet, TextInput, View, TouchableOpacity, Text, Pressable } from 'react-native';
import React from 'react';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';

const Input = (props) => {
  return (
    <View style={[styles.container, props.containerStyle]}>
      {props.icon && React.cloneElement(props.icon, { color: '#475569' })}
      
      {props.picker && (
        <Pressable style={styles.pickerContainer}>
          <Text style={styles.selectedCode}>{props.selectedValue}</Text>
          {props.picker}
        </Pressable>
      )}
      
      <TextInput
        style={[
          styles.textInput,
          props.picker && styles.textInputWithPicker
        ]}
        placeholderTextColor="#94A3B8"
        secureTextEntry={props.secureTextEntry}
        {...props}
      />
      
      {props.rightIcon && (
        <TouchableOpacity onPress={props.onRightIconPress}>
          {props.rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default Input;

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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
    height: '100%',
    justifyContent: 'center',
  },
  selectedCode: {
    color: '#000',
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    color: '#000'
  },
  textInputWithPicker: {
    marginLeft: 0
  }
});
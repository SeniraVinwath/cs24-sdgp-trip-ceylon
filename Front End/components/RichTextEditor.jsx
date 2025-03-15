import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor'
import { theme } from '../constants/theme'

const RichTextEditor = ({
  editorRef,
  onChange
}) => {
  return (
    <View style={{minHeight: 285}}>
      <RichToolbar
        actions={[
          actions.setStrikethrough,
          actions.removeFormat,
          actions.setBold,
          actions.setItalic,
          actions.insertOrderedList,
          actions.blockquote,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignRight,
          actions.code,
          actions.line,
          actions.heading2,
          actions.heading4,
        ]}
        iconMap={{
          [actions.heading2]: ({tintColor}) => <Text style={{color: tintColor}}>H2</Text>,
          [actions.heading4]: ({tintColor}) => <Text style={{color: tintColor}}>H4</Text>
        }}
        style={styles.richBar}
        flatContainerStyle={styles.flatStyle}
        editor={editorRef}
        iconTint = {'#c3c2c2'}
        selectedIconTint = {'#9DD900'}
        disabled={false}
      />

      <RichEditor
        ref={editorRef}
        containerStyle={styles.rich}
        editorStyle={styles.contentStyle}
        placeholder={"What's on your mind?"}
        onChange={onChange}
      />
    </View>
  )
}

export default RichTextEditor

const styles = StyleSheet.create({
  richBar: {
    borderTopRightRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    backgroundColor: '#555555'
  },
  rich: {
    minHeight: 240,
    flex: 1,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    borderColor: '#555555',
    padding: 5,
  },
  contentStyle: {
    backgroundColor: theme.colors.themebg,
    color: theme.colors.textWhite,
    placeholderColor: '#b7b7b7',
  },
  flatStyle: {
    paddingHorizontal: 8,
    gap: 3,
  }
})
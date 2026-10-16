// src/components/ScreenHeader.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'
import HeaderMenu from './HeaderMenu'

// Centered title, the menu on the right is balanced by an empty slot on the left
export default function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.side} />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>
        <HeaderMenu />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
  },
  side: {
    width: 40,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.grey7,
  },
})

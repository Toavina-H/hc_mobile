// src/components/UnreadDot.tsx
import React from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { theme } from '../theme'

// Signals new messages / notifications without a count
export default function UnreadDot({ size = 8, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }, style]} />
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: theme.colors.red4,
  },
})

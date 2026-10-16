// src/components/SegmentedControl.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../theme'
import UnreadDot from './UnreadDot'

type Option<T extends string> = { key: T; label: string; dot?: boolean }

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[]
  value: T
  onChange: (key: T) => void
}) {
  return (
    <View style={styles.container}>
      {options.map(option => {
        const active = option.key === value
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            {option.dot && <UnreadDot />}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 20,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.grey6,
  },
  labelActive: {
    color: theme.colors.white,
  },
})

// src/components/Ripple.tsx
// This component is used once for the style when switching active tab on authForm
import React, { useRef, useState } from 'react'
import { Pressable, Animated, StyleSheet, View, GestureResponderEvent, ViewStyle, StyleProp } from 'react-native'

type RippleProps = {
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  rippleColor?: string
  children: React.ReactNode
}

type RippleInstance = {
  id: number
  x: number
  y: number
  scale: Animated.Value
  opacity: Animated.Value
}

export default function Ripple({ onPress, disabled, style, rippleColor = 'rgba(255,255,255,0.4)', children }: RippleProps) {
  const [ripples, setRipples] = useState<RippleInstance[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const nextId = useRef(0)

  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout
    setSize({ width, height })
  }

  const startRipple = (e: GestureResponderEvent) => {
    if (disabled) return
    const { locationX, locationY } = e.nativeEvent
    const id = nextId.current++
    const scale = new Animated.Value(0)
    const opacity = new Animated.Value(1)

    setRipples((prev) => [...prev, { id, x: locationX, y: locationY, scale, opacity }])

    const maxDist = Math.max(
      Math.hypot(locationX, locationY),
      Math.hypot(size.width - locationX, locationY),
      Math.hypot(locationX, size.height - locationY),
      Math.hypot(size.width - locationX, size.height - locationY),
    )
    const targetScale = (maxDist * 2) / 40

    Animated.parallel([
      Animated.timing(scale, { toValue: targetScale, duration: 400, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    })
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={startRipple}
      disabled={disabled}
      style={[styles.wrapper, style]}
      onLayout={onLayout}
    >
      {children}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {ripples.map((r) => (
          <Animated.View
            key={r.id}
            style={[
              styles.ripple,
              {
                left: r.x - 20,
                top: r.y - 20,
                backgroundColor: rippleColor,
                opacity: r.opacity,
                transform: [{ scale: r.scale }],
              },
            ]}
          />
        ))}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden' },
  ripple: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
})
import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { theme } from '../theme'

// Same animation as the web HCLoading (`rotateAndScale` keyframes in @hc/ui)
const DURATION = 2500
const easing = Easing.bezier(0.4, 0, 0.2, 1)
const SAMPLES = 16

// The native driver doesn't support `easing` in interpolate(), so bake the
// per-segment easing into extra linear keyframes instead
function easedRanges(inputRange: number[], outputRange: number[]) {
  const inputs = [inputRange[0]]
  const outputs = [outputRange[0]]
  for (let i = 1; i < inputRange.length; i++) {
    const [i0, i1, o0, o1] = [inputRange[i - 1], inputRange[i], outputRange[i - 1], outputRange[i]]
    const steps = o0 === o1 ? 1 : SAMPLES
    for (let k = 1; k <= steps; k++) {
      const t = k / steps
      inputs.push(i0 + (i1 - i0) * t)
      outputs.push(o0 + (o1 - o0) * easing(t))
    }
  }
  return { inputRange: inputs, outputRange: outputs }
}

const scaleRanges = easedRanges([0, 0.15, 0.25, 0.75, 0.85, 1], [1, 1, 0.9, 0.9, 1, 1])
const rotateRanges = easedRanges([0, 0.35, 0.65, 1], [0, 0, 360, 360])
const opacityRanges = easedRanges([0, 0.25, 0.75, 1], [0.8, 1, 1, 0.8])

export default function HcSpinner({ size = 48 }: { size?: number }) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver: true }),
    )
    loop.start()
    return () => loop.stop()
  }, [progress])

  const scale = progress.interpolate(scaleRanges)
  const rotate = progress.interpolate({
    inputRange: rotateRanges.inputRange,
    outputRange: rotateRanges.outputRange.map(deg => `${deg}deg`),
  })
  const opacity = progress.interpolate(opacityRanges)

  return (
    <Animated.Image
      source={require('../assets/spinner.png')}
      style={{ width: size, height: size, opacity, transform: [{ scale }, { rotate }] }}
      resizeMode="contain"
    />
  )
}

// Covers the whole app while the session and the user's data load
export function SplashScreen() {
  return (
    <View style={styles.splash}>
      <HcSpinner size={64} />
    </View>
  )
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.grey1,
  },
})

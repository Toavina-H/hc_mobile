// src/components/TabBar.tsx
import React, { useEffect, useState } from 'react'
import { View, TouchableOpacity, Keyboard, StyleSheet } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { theme } from '../theme'
import { useNotifications } from './Notifications'
import { useInbox } from './Inbox'
import UnreadDot from './UnreadDot'

const BAR_HEIGHT = 68
const GAP_ABOVE_BAR = 8

function bottomOffset(insetBottom: number) {
  return Math.max(insetBottom, 12)
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])
  return visible
}

// The bar floats over the screens: they pad their content with this so nothing ends up hidden behind it
export function useTabBarSpace() {
  const insets = useSafeAreaInsets()
  const keyboardVisible = useKeyboardVisible()
  return keyboardVisible ? 0 : BAR_HEIGHT + bottomOffset(insets.bottom) + GAP_ABOVE_BAR
}

// Floating pill bar: icons only, the active one in a filled circle, a red dot for anything unread
export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { unreadCount } = useNotifications()
  const { unreadCount: unreadConversations } = useInbox()
  // Keeps the bar from riding on top of the keyboard (Android adjustResize)
  const keyboardVisible = useKeyboardVisible()

  if (keyboardVisible) return null

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset(insets.bottom) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const focused = state.index === index
          // Unread counts come from the shared contexts, loaded at login
          const hasDot =
            route.name === 'Notifications'
              ? unreadCount > 0
              : route.name === 'Messages'
                ? unreadConversations > 0
                : !!options.tabBarBadge
          const color = focused ? theme.colors.white : theme.colors.grey5

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.title ?? route.name}
            >
              <View style={[styles.iconHalo, focused && styles.iconHaloActive]}>
                <View style={[styles.icon, focused && styles.iconActive]}>
                  {options.tabBarIcon?.({ focused, color, size: 22 })}
                </View>
                {hasDot && <UnreadDot size={11} style={styles.dot} />}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export const tabIcon =
  (name: string) =>
  ({ color, size }: { color: string; size: number }) =>
    <Icon name={name} size={size} color={color} />

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.white,
    borderRadius: 36,
    height: BAR_HEIGHT,
    paddingHorizontal: 8,
    shadowColor: theme.colors.grey7,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconHalo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHaloActive: {
    backgroundColor: theme.colors.purple2,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: theme.colors.primary,
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },
})

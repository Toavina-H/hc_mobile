// src/components/HeaderMenu.tsx
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Config from 'react-native-config'
import { theme } from '../theme'
import { useAuth } from './Authentification'

const OFFERS_URL = `${Config.HC_WEB_URL}/recherche/offres-emploi`

type MenuItem = {
  label: string
  icon: string
  onPress: () => void
  danger?: boolean
}

export default function HeaderMenu() {
  const [open, setOpen] = useState(false)
  const { logout } = useAuth()
  const insets = useSafeAreaInsets()

  const items: MenuItem[] = [
    {
      label: 'Les offres en ligne',
      icon: 'open-in-new',
      onPress: () => Linking.openURL(OFFERS_URL),
    },
    {
      label: 'Se déconnecter',
      icon: 'logout',
      // RootNavigation sends the user back to the Auth screen once currentUser is cleared
      onPress: () => logout(),
      danger: true,
    },
  ]

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Ouvrir le menu"
      >
        <Icon name="menu" size={26} color={theme.colors.grey7} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { top: insets.top + 52 }]}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.item, index > 0 && styles.itemDivider]}
                onPress={() => {
                  setOpen(false)
                  item.onPress()
                }}
              >
                <Icon
                  name={item.icon}
                  size={20}
                  color={item.danger ? theme.colors.red4 : theme.colors.grey6}
                />
                <Text style={[styles.itemLabel, item.danger && styles.itemLabelDanger]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    padding: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(38, 35, 56, 0.15)',
  },
  menu: {
    position: 'absolute',
    right: 20,
    minWidth: 220,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey2,
  },
  itemLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: theme.colors.grey7,
  },
  itemLabelDanger: {
    color: theme.colors.red4,
  },
})

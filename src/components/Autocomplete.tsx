// src/components/AutocompleteInput.tsx
// Ported from the web AutocompleteInput.vue's behavior — not its Quasar internals.
// Same contract: filters a locally-held `options` list once the query hits `minChars`,
// reports raw typing via onInputUpdate and confirmed picks via onOptionSelect,
// same as the Vue component's inputHandle/selectHandle split.

import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { theme } from '../theme'

export type AutocompleteOption = { label: string; value: string | null }

type Props = {
  label?: string
  placeholder?: string
  options: AutocompleteOption[]
  defaultValue?: AutocompleteOption | null
  minChars?: number
  onOptionSelect: (option: AutocompleteOption | null) => void
  onInputUpdate?: (text: string) => void
  clearOnSelect?: boolean
}

export default function AutocompleteInput({
  label,
  placeholder = 'Tapez pour rechercher...',
  options,
  defaultValue = null,
  minChars = 3,
  onOptionSelect,
  onInputUpdate,
  clearOnSelect = false,
}: Props) {
  const [inputValue, setInputValue] = useState(defaultValue?.label ?? '')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Mirrors the Vue watch(props.defaultValue) — re-syncs the display text when
  // the parent changes defaultValue from outside (e.g. loading an existing profile).
  useEffect(() => {
    setInputValue(defaultValue?.label ?? '')
  }, [defaultValue?.label])

  const filteredOptions =
    inputValue.trim().length >= minChars
      ? options.filter((o) => o.label.toLowerCase().includes(inputValue.trim().toLowerCase()))
      : []

  const handleChangeText = (text: string) => {
    setInputValue(text)
    setShowSuggestions(true)
    onInputUpdate?.(text)
  }

  const handleSelect = (option: AutocompleteOption) => {
    setInputValue(option.label)
    setShowSuggestions(false)
    onOptionSelect(option)
    if (clearOnSelect) setInputValue('')
  }

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput style={styles.input} value={inputValue} onChangeText={handleChangeText} placeholder={placeholder} />
      </View>
      {showSuggestions && filteredOptions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {filteredOptions.map((o) => (
            <TouchableOpacity key={`${o.value ?? 'null'}-${o.label}`} style={styles.suggestionRow} onPress={() => handleSelect(o)}>
              <Text>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.colors.grey7 },
  inputWrapper: {
    backgroundColor: theme.colors.grey3,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: { paddingVertical: 14 },
  suggestionsBox: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    marginTop: -12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.grey3,
  },
  suggestionRow: { paddingVertical: 10, paddingHorizontal: 12 },
})
// src/components/AutocompleteInput.tsx

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
        <TextInput style={styles.input} value={inputValue} onChangeText={handleChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.grey4} />
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
    backgroundColor: theme.colors.grey2,
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
// src/screens/ProfileSetupScreen.tsx
// UI/layout pass — backend wiring (asset read/create, jobs referential, Affinda) comes next.
// Resume upload is real (uses aws.files.uploadFileToS3), everything else is local state for now.

import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { pick, types } from '@react-native-documents/picker'
import { theme } from '../theme'
import HcButton from '../components/HcButton'
import aws from '../api/aws'
import stelace from '../api/stelace'
import { searchPlaces } from '../api/mapbox'
import AutocompleteInput, { AutocompleteOption } from '../components/Autocomplete'

function remapJobboardLabels(baseOptions: AutocompleteOption[]): AutocompleteOption[] {
  const result: AutocompleteOption[] = []
  for (const option of baseOptions as any[]) {
    if (Array.isArray(option.jobboardLabel)) {
      for (const jobboardLabel of option.jobboardLabel) {
        result.push({ ...option, label: jobboardLabel })
      }
    } else if (typeof option.jobboardLabel === 'string') {
      result.push({ ...option, label: option.jobboardLabel })
    } else {
      result.push(option)
    }
  }
  return result
}

export default function ProfileSetupScreen() {
  const navigation = useNavigation()

  const [locationQuery, setLocationQuery] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [location, setLocation] = useState<any | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedJob, setSelectedJob] = useState<{ label: string; value: string | null } | null>(null)
  const [jobsOptions, setJobsOptions] = useState<AutocompleteOption[]>([])

  useEffect(() => {
    stelace.data.getDataLabelOptions({ label: 'jobs' }).then((baseOptions) => {
      setJobsOptions(remapJobboardLabels(baseOptions))
    })
  }, [])
  const [accountantBackground, setAccountantBackground] = useState(false)

  const [resumeFileKey, setResumeFileKey] = useState<string | null>(null)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeError, setResumeError] = useState(false)

  const [loading, setLoading] = useState(false)
  const [parsingSuccess, setParsingSuccess] = useState(false)

  const isFormValid = !!location && !!selectedJob && !!resumeFileKey && !resumeError

  const onChangeLocationQuery = (text: string) => {
    setLocationQuery(text)
    setLocation(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(text)
      setLocationSuggestions(results)
    }, 650)
  }

  const onSelectLocation = (place: any) => {
    setLocation(place)
    setLocationQuery(place.name)
    setLocationSuggestions([])
  }

  const pickAndUploadResume = async () => {
    try {
      setResumeError(false)
      const [file] = await pick({ type: [types.pdf] })
      setResumeUploading(true)

      // TODO: swap Date.now() placeholder id for the real userId once this screen
      // is wired up right after signup (needs currentUser context/store).
      const fileKey = await aws.files.uploadFileToS3({
        file: { uri: file.uri, name: file.name, type: file.type },
        options: {
          uploadFolder: 'files/resume',
          uploadPrefix: 'resume',
          contentType: 'application/pdf',
          id: 'placeholder-user-id',
        },
      })

      if (!fileKey) {
        setResumeError(true)
      } else {
        setResumeFileKey(fileKey)
        setResumeFileName(file.name)
      }
    } catch (e: any) {
      // user cancelled the picker — not an error state
      if (e?.code !== 'DOCUMENTS_PICKER_CANCELED') setResumeError(true)
    } finally {
      setResumeUploading(false)
    }
  }

  const onSubmit = async () => {
    if (!isFormValid) return
    setLoading(true)
    // TODO: wire real submit flow —
    //  1. create/update the profile Asset (locations, customAttributes, metadata._resume)
    //  2. attach resumeFileKey to metadata._files.resume
    //  3. trigger Affinda parsing (later, per earlier decision to defer this)
    setTimeout(() => {
      setLoading(false)
      setParsingSuccess(true)
    }, 800)
  }

  if (parsingSuccess) {
    return (
      <ScrollView contentContainerStyle={styles.successContainer}>
        <Text style={styles.successText}>
          Nous avons bien reçu votre CV et construit votre profil après extraction des informations de celui-ci.
          Vous pouvez aller consulter votre tableau de bord.
        </Text>
        <HcButton title="Tableau de bord" onPress={() => navigation.navigate('Dashboard')} style={{ marginTop: 16 }} />
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Quelques informations sur votre recherche ...</Text>

      <Text style={styles.label}>Adresse</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={locationQuery}
          onChangeText={onChangeLocationQuery}
          placeholder="Adresse, ville ..."
        />
      </View>
      {locationSuggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {locationSuggestions.map((place) => (
            <TouchableOpacity key={place.id} style={styles.suggestionRow} onPress={() => onSelectLocation(place)}>
              <Text>{place.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <AutocompleteInput
        label="Métier recherché"
        placeholder="Ex: Comptable"
        options={jobsOptions}
        onOptionSelect={(option) => setSelectedJob(option)}
        onInputUpdate={(text) => {
          // mirrors ProfileForm.vue's onInputUpdate: free-typed text becomes
          // its own option (value: null) until a real suggestion is picked
          setSelectedJob(text.length > 0 ? { label: text, value: null } : null)
        }}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Profil avec expérience en comptabilité</Text>
        <Switch value={accountantBackground} onValueChange={setAccountantBackground} />
      </View>

      <Text style={styles.label}>CV (PDF)</Text>
      <TouchableOpacity
        style={[styles.uploadButton, resumeFileKey && styles.uploadButtonDone]}
        onPress={pickAndUploadResume}
        disabled={resumeUploading}
      >
        <Text style={styles.uploadButtonText}>
          {resumeUploading ? 'Envoi en cours...' : resumeFileName ? resumeFileName : 'Ajouter mon CV'}
        </Text>
      </TouchableOpacity>
      {resumeError && <Text style={styles.error}>Merci d'ajouter un CV au format PDF</Text>}

      <HcButton
        title="Envoyer"
        loading={loading}
        disabled={!isFormValid || loading}
        onPress={onSubmit}
        style={{ marginTop: 24 }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  heading: { textAlign: 'center', fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: theme.colors.grey7 },
  inputWrapper: {
    backgroundColor: theme.colors.grey3,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  placesWrapper: { marginBottom: 16, zIndex: 10 },
  input: {
    backgroundColor: theme.colors.grey3,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  suggestionsBox: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    marginTop: -12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.grey3,
  },
  suggestionRow: { paddingVertical: 10, paddingHorizontal: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  toggleLabel: { flex: 1, fontSize: 14, color: theme.colors.grey7, marginRight: 12 },
  uploadButton: {
    backgroundColor: theme.colors.grey3,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonDone: { backgroundColor: theme.colors.primary + '22' },
  uploadButtonText: { color: theme.colors.grey7, fontWeight: '500' },
  error: { color: 'red', marginBottom: 8, fontSize: 12 },
  successContainer: { padding: 24, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  successText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
})
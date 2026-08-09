// src/screens/signupApplicantComplete.tsx
// UI/layout pass — backend wiring (asset read/create, jobs referential, Affinda) comes next.
// Resume upload is real (uses aws.files.uploadFileToS3), everything else is local state for now.

import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { pick, types } from '@react-native-documents/picker'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Switch } from 'react-native-paper'
import LinearGradient from 'react-native-linear-gradient'
import { theme } from '../theme'
import HcButton from '../components/HcButton'
import aws from '../api/aws'
import stelace from '../api/stelace'
import { searchPlaces } from '../api/mapbox'
import AutocompleteInput, { AutocompleteOption } from '../components/Autocomplete'

// Remaps jobboardLabel the same way ProfileForm.vue's mounted() hook does:
// an array of jobboardLabel values becomes multiple separate options,
// a single string jobboardLabel just overrides the display label.
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
      // const fileKey = await aws.files.uploadFileToS3({
      //   file: { uri: file.uri, name: file.name, type: file.type },
      //   options: {
      //     uploadFolder: 'files/resume',
      //     uploadPrefix: 'resume',
      //     contentType: 'application/pdf',
      //     id: id: currentUser?.id,,
      //   },
      // })

      // if (!fileKey) {
      //   setResumeError(true)
      // } else {
      //   setResumeFileKey(fileKey)
      //   setResumeFileName(file.name)
      // }
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
    const [currentUser, setCurrentUser] = useState<any | null>(null)
    const [profileAsset, setProfileAsset] = useState<any | null>(null)

    useEffect(() => {
      stelace.users.getCurrent().then(async (user) => {
        setCurrentUser(user)
        if (!user) return

        const profileAssetId = user?.metadata?._resume?.profileAssetId
        if (profileAssetId) {
          const asset = await stelace.assets.read(profileAssetId)
          setProfileAsset(asset)
          if (asset?.metadata?._files?.resumeNbParsing) setParsingSuccess(true)
        }
      })
    }, [])
  }

  if (parsingSuccess) {
    return (
      <ScrollView contentContainerStyle={styles.successContainer}>
        <Text style={styles.successText}>
          Nous avons bien reçu votre CV et construit votre profil après extraction des informations de celui-ci.
          Vous pouvez aller consulter votre tableau de bord.
        </Text>
        <HcButton title="Tableau de bord" onPress={() => navigation.navigate('Notifications')} style={{ marginTop: 16 }} />
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{backgroundColor: theme.colors.grey3}} keyboardShouldPersistTaps="handled">
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.webp')} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.card}>
        <LinearGradient
          colors={theme.colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardHeader}
        >
          <View style={styles.cardHeaderIcon}>
            <Icon name="account-box-outline" size={20} color={theme.colors.white} />
          </View>
          <Text style={styles.cardHeaderText}>Votre recherche et votre profil</Text>
        </LinearGradient>

        <View style={styles.cardBody}>
          <Text style={styles.heading}>Quelques informations sur votre recherche ...</Text>

          <View style={styles.addressRow}>
            <View style={styles.countryBadge}>
              <Text style={styles.countryBadgeText}>FR</Text>
            </View>
            <TextInput
              style={styles.addressInput}
              value={locationQuery}
              onChangeText={onChangeLocationQuery}
              placeholder="Autour de quelle adresse souhaitez-vous trouver..."
              placeholderTextColor={theme.colors.grey4}
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

          <View style={styles.dropdownWrapper}>
            <AutocompleteInput
              placeholder="Intitulé du poste"
              options={jobsOptions}
              onOptionSelect={(option) => setSelectedJob(option)}
              onInputUpdate={(text) => {
                setSelectedJob(text.length > 0 ? { label: text, value: null } : null)
              }}
            />
            <Icon name="chevron-down" size={20} color={theme.colors.grey5} style={styles.dropdownChevron} />
          </View>

          <View style={styles.toggleRow}>
            <Switch
              value={accountantBackground}
              onValueChange={setAccountantBackground}
              color={theme.colors.primary}
            />
            <Text style={styles.toggleLabel}>
              J'ai déjà une expérience au sein d'un cabinet d'expertise comptable.
            </Text>
          </View>

          <TouchableOpacity style={styles.uploadCard} onPress={pickAndUploadResume} disabled={resumeUploading}>
            <View style={styles.uploadCardHeader}>
              <Text style={styles.uploadCardTitle}>
                {resumeFileName ? resumeFileName : 'Ajouter un CV - Obligatoire'}
              </Text>
              <Icon name="plus-circle-outline" size={22} color={theme.colors.secondary} />
            </View>
            <Text style={styles.uploadCardSubtitle}>
              {resumeUploading ? 'Envoi en cours...' : 'Déposez votre CV au format PDF ici'}
            </Text>
            {!resumeFileKey && !resumeUploading && (
              <Text style={styles.uploadCardHint}>Choisissez un fichier ou glissez-déposez votre CV (format PDF)</Text>
            )}
          </TouchableOpacity>
          {!resumeFileKey && !resumeUploading && (
            <Text style={styles.error}>Vous devez ajouter votre CV (.pdf) pour continuer.</Text>
          )}
          {resumeError && <Text style={styles.error}>L'envoi du CV a échoué, réessayez.</Text>}

          <HcButton
            title="Envoyer"
            loading={loading}
            disabled={!isFormValid || loading}
            onPress={onSubmit}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  logoContainer: { width: '100%', backgroundColor: theme.colors.purple1, alignItems: 'center', marginBottom: 16, borderRadius: 12 },
  logo: { width: 120, height: 80, alignSelf: 'center' },
  card: {
    margin: 16, paddingBottom: 48, flexGrow: 1,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
    shadowColor: theme.colors.grey6,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: { color: theme.colors.white, fontWeight: '700', fontSize: 15 },
  cardBody: { padding: 16 },
  heading: { textAlign: 'center', fontWeight: '700', marginBottom: 16, color: theme.colors.grey7 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.grey1,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryBadge: {
    backgroundColor: theme.colors.grey2,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  countryBadgeText: { color: theme.colors.grey6, fontWeight: '600', fontSize: 13 },
  addressInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: theme.colors.grey7 },
  dropdownWrapper: { justifyContent: 'center', marginBottom: 4 },
  dropdownChevron: { position: 'absolute', right: 14, top: 15 },
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
    marginBottom: 20,
    marginTop: 4,
  },
  toggleLabel: { flex: 1, fontSize: 14, color: theme.colors.grey7, marginLeft: 10 },
  uploadCard: {
    borderWidth: 1,
    borderColor: theme.colors.grey3,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadCardTitle: { color: theme.colors.secondary, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8 },
  uploadCardSubtitle: { color: theme.colors.grey5, fontStyle: 'italic', fontSize: 13, marginTop: 4 },
  uploadCardHint: { color: theme.colors.grey4, fontStyle: 'italic', fontSize: 12, marginTop: 8 },
  error: { color: theme.colors.error, marginBottom: 8, fontSize: 12 },
  successContainer: { padding: 24, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  successText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
})
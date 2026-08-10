// src/api/mapbox.js
import Config from 'react-native-config'

const MAPBOX_SEARCH_URL = Config.MAPBOX_SEARCH_URL
const MAPBOX_TOKEN = Config.MAPBOX_TOKEN

function mapboxPlaceMapping(hit) {
  const displayName = hit.place_name ?? '---'
  const ctx = hit.context ?? []
  const findCtx = (idFragment) => ctx.find((c) => c.id?.includes(idFragment))?.text

  return {
    id: hit.id,
    latitude: Number.parseFloat(hit.center[1]),
    longitude: Number.parseFloat(hit.center[0]),
    name: displayName,
    city: findCtx('place') ?? hit.text ?? '-',
    country: findCtx('country') ?? 'France',
    postcode: findCtx('postcode') ?? '-',
    street: hit.place_type?.includes('address')
      ? `${hit.address ?? ''} ${hit.text ?? ''}`.trim()
      : hit.text ?? '',
  }
}

export async function searchPlaces(query, { countryCode = 'FR' } = {}) {
  if (!query || query.trim().length <= 2) return []
  if (!MAPBOX_SEARCH_URL || !MAPBOX_TOKEN) {
    console.log('Mapbox config missing')
    return []
  }

  try {
    const encodedQuery = encodeURIComponent(query.trim())
    const params = new URLSearchParams({
      country: countryCode === 'FR' ? 'FR,RE' : countryCode,
      language: 'fr',
      types: 'region,place,address,postcode',
      access_token: MAPBOX_TOKEN,
    })

    const res = await fetch(`${MAPBOX_SEARCH_URL}/${encodedQuery}.json?${params.toString()}`)
    if (!res.ok) return []

    const data = await res.json()
    const features = data.features ?? []
    return features.map(mapboxPlaceMapping).filter((place) => place.city && place.postcode)
  } catch (e) {
    console.log('Mapbox search failed', e)
    return []
  }
}
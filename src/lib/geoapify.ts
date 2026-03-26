export type AddressSuggestion = {
  description: string
  placeId: string
  coordinates: {
    lat: number
    lng: number
  }
  components: {
    street?: string
    houseNumber?: string
    city?: string
    province?: string
    country?: string
    postalCode?: string
  }
}

class GeoapifyService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || ''
  }

  async autocomplete(query: string): Promise<AddressSuggestion[]> {
    if (!this.apiKey) {
      console.error('Geoapify API key is not set')
      return []
    }

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query,
        )}&apiKey=${this.apiKey}&filter=countrycode:ca&limit=5`,
      )

      if (!response.ok) {
        throw new Error(`Geoapify API error: ${response.statusText}`)
      }

      const data = await response.json()

      return data.features.map((feature: any) => ({
        description: feature.properties.formatted,
        placeId: feature.properties.place_id,
        coordinates: {
          lat: feature.properties.lat,
          lng: feature.properties.lon,
        },
        components: {
          street: feature.properties.street,
          houseNumber: feature.properties.housenumber,
          city: feature.properties.city,
          province: feature.properties.state,
          country: feature.properties.country,
          postalCode: feature.properties.postcode,
        },
      }))
    } catch (error) {
      console.error('Geoapify autocomplete error:', error)
      return []
    }
  }

  async getTimezone(lat: number, lng: number): Promise<string> {
    if (!this.apiKey) {
      console.error('Geoapify API key is not set')
      return 'America/Toronto'
    }

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&apiKey=${this.apiKey}`,
      )

      if (!response.ok) {
        throw new Error(`Geoapify API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.features[0]?.properties?.timezone?.name || 'America/Toronto'
    } catch (error) {
      console.error('Geoapify timezone error:', error)
      return 'America/Toronto'
    }
  }
}

export const geoapifyService = new GeoapifyService()

'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Property } from '@/lib/properties-data'

interface PropertyMapProps {
  properties: Property[]
  selectedPropertyId?: string
}

export function PropertyMap({ properties, selectedPropertyId }: PropertyMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  useEffect(() => {
    // Crear mapa
    if (!mapRef.current) {
      const center = properties.length > 0 ? [properties[0].lat, properties[0].lng] : [20, 0]

      mapRef.current = L.map('map').setView(center as L.LatLngExpression, 4)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current)
    }

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach((marker) => marker.remove())
    markersRef.current = {}

    // Agregar marcadores
    properties.forEach((property) => {
      const icon = L.divIcon({
        html: `<div class="bg-black text-white px-2 py-1 rounded-full text-xs font-bold">$${property.price}</div>`,
        className: 'price-marker',
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      })

      const marker = L.marker([property.lat, property.lng], { icon })
        .bindPopup(`<strong>${property.title}</strong><br/>${property.location}<br/>$${property.price}/noche`)
        .addTo(mapRef.current!)

      markersRef.current[property.id] = marker

      // Event listeners
      marker.on('mouseover', () => {
        marker.openPopup()
      })

      marker.on('mouseout', () => {
        marker.closePopup()
      })
    })

    // Highlight del marcador seleccionado
    if (selectedPropertyId && markersRef.current[selectedPropertyId]) {
      const selectedMarker = markersRef.current[selectedPropertyId]
      const popup = selectedMarker.getPopup()
      if (popup) {
        popup.openOn(mapRef.current!)
      }
    }
  }, [properties, selectedPropertyId])

  return <div id="map" style={{ width: '100%', height: '100vh' }} />
}

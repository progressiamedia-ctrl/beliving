'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Property } from '@/lib/properties-data'

interface PropertyMapProps {
  properties: Property[]
  selectedPropertyId?: string
  height?: string
  onMarkerClick?: (id: string) => void
}

export function PropertyMap({ properties, selectedPropertyId, height = '100%', onMarkerClick }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  useEffect(() => {
    // Crear mapa solo una vez
    if (!mapRef.current && containerRef.current) {
      const center = properties.length > 0 ? [properties[0].lat, properties[0].lng] : [20, 0]

      mapRef.current = L.map(containerRef.current).setView(center as L.LatLngExpression, 4)

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
      const isSelected = property.id === selectedPropertyId
      const bgColor = isSelected ? 'bg-yellow-400 text-black' : 'bg-black text-white'

      const icon = L.divIcon({
        html: `<div class="${bgColor} px-2 py-1 rounded-full text-xs font-bold transition-all">$${property.price}</div>`,
        className: 'price-marker',
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      })

      const marker = L.marker([property.lat, property.lng], { icon })
        .bindPopup(`<strong>${property.title}</strong><br/>${property.location}<br/>$${property.price}/noche`, {
          closeButton: true,
          closeOnClick: false,
        })
        .addTo(mapRef.current!)

      markersRef.current[property.id] = marker

      // Event listeners
      marker.on('mouseover', () => {
        marker.openPopup()
      })

      marker.on('mouseout', () => {
        if (!isSelected) {
          marker.closePopup()
        }
      })

      marker.on('click', () => {
        if (onMarkerClick) {
          onMarkerClick(property.id)
        }
        marker.openPopup()
      })
    })

    // Highlight del marcador seleccionado
    if (selectedPropertyId && markersRef.current[selectedPropertyId]) {
      const selectedMarker = markersRef.current[selectedPropertyId]
      selectedMarker.openPopup()
    }
  }, [properties, selectedPropertyId, onMarkerClick])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}

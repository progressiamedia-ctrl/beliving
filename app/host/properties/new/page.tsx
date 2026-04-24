'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PropertyForm } from '@/components/PropertyForm'

export default function NewProperty() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/host/dashboard" className="text-black underline text-sm mb-8 inline-block">
          ← Volver
        </Link>

        <h1 className="text-4xl font-light text-black mb-2">Nueva propiedad</h1>
        <p className="text-gray-600 mb-8">Crea una lista para tu propiedad</p>

        <PropertyForm onSuccess={() => router.push('/host/dashboard')} />
      </div>
    </div>
  )
}

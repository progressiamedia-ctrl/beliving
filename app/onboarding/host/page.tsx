'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'propertyType' | 'location' | 'price' | 'occupancy' | 'goals' | 'done'

export default function HostOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('propertyType')
  const [responses, setResponses] = useState({
    propertyType: '',
    location: '',
    price: '',
    occupancy: '',
    goals: [] as string[],
  })

  const handleNext = () => {
    const steps: Step[] = ['propertyType', 'location', 'price', 'occupancy', 'goals', 'done']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    } else {
      localStorage.setItem('hostOnboardingData', JSON.stringify(responses))
      router.push('/host/dashboard')
    }
  }

  const handleBack = () => {
    const steps: Step[] = ['propertyType', 'location', 'price', 'occupancy', 'goals', 'done']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const stepNumber = ['propertyType', 'location', 'price', 'occupancy', 'goals'].indexOf(step) + 1

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Barra de progreso */}
        <div className="mb-12">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${(stepNumber / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">Paso {stepNumber} de 5</p>
        </div>

        {/* Pregunta 1: Tipo de propiedad */}
        {step === 'propertyType' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Qué tipo de propiedad tienes?
              </h1>
              <p className="text-gray-600">Selecciona la categoría que mejor describe tu propiedad</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['Villa', 'Apartment', 'House', 'Condo', 'Resort', 'Boutique Hotel'].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setResponses({ ...responses, propertyType: type })}
                    className={`p-4 border-2 rounded-lg transition ${
                      responses.propertyType === type
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 text-black hover:border-black'
                    }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Pregunta 2: Ubicación */}
        {step === 'location' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Dónde está ubicada tu propiedad?
              </h1>
              <p className="text-gray-600">Elige la ciudad o región</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['Dubai', 'Barcelona', 'Madrid', 'Viña del Mar', 'Bali', 'Cancun', 'Other'].map(
                (location) => (
                  <button
                    key={location}
                    onClick={() => setResponses({ ...responses, location })}
                    className={`p-4 border-2 rounded-lg transition ${
                      responses.location === location
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 text-black hover:border-black'
                    }`}
                  >
                    {location}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Pregunta 3: Precio promedio */}
        {step === 'price' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Cuál es tu precio promedio por noche?
              </h1>
              <p className="text-gray-600">En dólares USD</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['< $200', '$200-$400', '$400-$700', '> $700'].map((price) => (
                <button
                  key={price}
                  onClick={() => setResponses({ ...responses, price })}
                  className={`p-4 border-2 rounded-lg transition ${
                    responses.price === price
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-black hover:border-black'
                  }`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pregunta 4: Ocupación */}
        {step === 'occupancy' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Cuál es tu nivel de ocupación promedio?
              </h1>
              <p className="text-gray-600">Porcentaje de reservas al año</p>
            </div>

            <div className="space-y-3">
              {['< 30%', '30-50%', '50-70%', '> 70%'].map((occupancy) => (
                <button
                  key={occupancy}
                  onClick={() => setResponses({ ...responses, occupancy })}
                  className={`w-full p-4 border-2 rounded-lg text-left transition ${
                    responses.occupancy === occupancy
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-black hover:border-black'
                  }`}
                >
                  {occupancy}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pregunta 5: Objetivos */}
        {step === 'goals' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Cuáles son tus objetivos?
              </h1>
              <p className="text-gray-600">Selecciona uno o más</p>
            </div>

            <div className="space-y-3">
              {['More Bookings', 'Higher Pricing', 'International Exposure', 'Brand Building'].map(
                (goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      const isSelected = responses.goals.includes(goal)
                      setResponses({
                        ...responses,
                        goals: isSelected
                          ? responses.goals.filter((g) => g !== goal)
                          : [...responses.goals, goal],
                      })
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left transition ${
                      responses.goals.includes(goal)
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 text-black hover:border-black'
                    }`}
                  >
                    {goal}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 mt-12">
          <button
            onClick={handleBack}
            className="flex-1 px-6 py-3 border-2 border-black text-black rounded-lg hover:bg-gray-100 transition"
          >
            Atrás
          </button>
          <button
            onClick={handleNext}
            className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            {step === 'goals' ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'destination' | 'type' | 'budget' | 'purpose' | 'experiences' | 'done'

export default function GuestOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('destination')
  const [responses, setResponses] = useState({
    destination: '',
    type: '',
    budget: '',
    purpose: '',
    experiences: [] as string[],
  })

  const handleNext = () => {
    const steps: Step[] = ['destination', 'type', 'budget', 'purpose', 'experiences', 'done']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    } else {
      localStorage.setItem('onboardingData', JSON.stringify(responses))
      router.push('/properties')
    }
  }

  const handleBack = () => {
    const steps: Step[] = ['destination', 'type', 'budget', 'purpose', 'experiences', 'done']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const stepNumber = ['destination', 'type', 'budget', 'purpose', 'experiences'].indexOf(step) + 1

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

        {/* Pregunta 1: Destino */}
        {step === 'destination' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Dónde quieres viajar?
              </h1>
              <p className="text-gray-600">Selecciona tu destino favorito</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['Dubai', 'Barcelona', 'Madrid', 'Viña del Mar', 'Bali', 'Cancun'].map(
                (city) => (
                  <button
                    key={city}
                    onClick={() => setResponses({ ...responses, destination: city })}
                    className={`p-4 border-2 rounded-lg transition ${
                      responses.destination === city
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 text-black hover:border-black'
                    }`}
                  >
                    {city}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Pregunta 2: Tipo de propiedad */}
        {step === 'type' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Qué tipo de alojamiento prefieres?
              </h1>
              <p className="text-gray-600">Elige tu estilo de estancia</p>
            </div>

            <div className="space-y-3">
              {['Luxury Villa', 'Modern Apartment', 'Beachfront', 'Mountain Retreat', 'Urban Loft'].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setResponses({ ...responses, type })}
                    className={`w-full p-4 border-2 rounded-lg text-left transition ${
                      responses.type === type
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

        {/* Pregunta 3: Presupuesto */}
        {step === 'budget' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Cuál es tu presupuesto por noche?
              </h1>
              <p className="text-gray-600">En dólares USD</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['< $300', '$300-$500', '$500-$1000', '> $1000'].map((budget) => (
                <button
                  key={budget}
                  onClick={() => setResponses({ ...responses, budget })}
                  className={`p-4 border-2 rounded-lg transition ${
                    responses.budget === budget
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-black hover:border-black'
                  }`}
                >
                  {budget}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pregunta 4: Propósito */}
        {step === 'purpose' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Cuál es el propósito de tu viaje?
              </h1>
              <p className="text-gray-600">Elige una o más opciones</p>
            </div>

            <div className="space-y-3">
              {['Vacation', 'Work', 'Investment Exploration', 'Family Time'].map(
                (purpose) => (
                  <button
                    key={purpose}
                    onClick={() => setResponses({ ...responses, purpose })}
                    className={`w-full p-4 border-2 rounded-lg text-left transition ${
                      responses.purpose === purpose
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 text-black hover:border-black'
                    }`}
                  >
                    {purpose}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Pregunta 5: Experiencias */}
        {step === 'experiences' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-light text-black mb-4">
                ¿Qué experiencias te atraen?
              </h1>
              <p className="text-gray-600">Selecciona las que te interesan</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['Relax', 'Party', 'Explore', 'Luxury'].map((exp) => (
                <button
                  key={exp}
                  onClick={() => {
                    const isSelected = responses.experiences.includes(exp)
                    setResponses({
                      ...responses,
                      experiences: isSelected
                        ? responses.experiences.filter((e) => e !== exp)
                        : [...responses.experiences, exp],
                    })
                  }}
                  className={`p-4 border-2 rounded-lg transition ${
                    responses.experiences.includes(exp)
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-black hover:border-black'
                  }`}
                >
                  {exp}
                </button>
              ))}
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
            {step === 'experiences' ? 'Continuar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}

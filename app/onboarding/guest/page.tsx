'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'destination' | 'type' | 'budget' | 'purpose' | 'experiences' | 'done'

const CITY_IMAGES = [
  'https://images.unsplash.com/photo-1512453575128-d2f4b0e961c3?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1562883714-47a98a3c3872?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1543936552-5150209c26d6?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&q=85',
]

export default function GuestOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('destination')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [responses, setResponses] = useState({
    destination: '',
    type: '',
    budget: '',
    purpose: '',
    experiences: [] as string[],
  })

  useEffect(() => {
    setMounted(true)
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/')
    }
    setCurrentImageIndex(0)
  }, [router])

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CITY_IMAGES.length)
    }, 4000)
    return () => clearInterval(imageInterval)
  }, [])

  const handleNext = () => {
    const steps: Step[] = ['destination', 'type', 'budget', 'purpose', 'experiences', 'done']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    } else {
      localStorage.setItem('guestOnboarding', JSON.stringify(responses))
      setStep('done')
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

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-white">Cargando...</div>
  }

  if (step === 'done') {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white">
        {/* Fuegos artificiales */}
        <div className="absolute inset-0 pointer-events-none">
          <style>{`
            @keyframes firework {
              0% {
                opacity: 1;
                transform: translate(0, 0) scale(1);
              }
              100% {
                opacity: 0;
                transform: translate(var(--tx), var(--ty)) scale(0);
              }
            }
            .firework-particle {
              animation: firework 1.5s ease-out forwards;
            }
          `}</style>
          {[...Array(80)].map((_, i) => {
            const angle = (i / 80) * Math.PI * 2;
            const distance = 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1', '#32CD32'];
            const color = colors[i % colors.length];

            return (
              <div
                key={i}
                className="firework-particle absolute w-2 h-2 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 10px ${color}`,
                } as any}
              />
            );
          })}
        </div>

        {/* Card de bienvenida */}
        <div className="relative z-10 w-full px-6 flex items-center justify-center">
          <div className="w-full max-w-md backdrop-blur-[80px] rounded-[32px] p-8 shadow-2xl border transition-all duration-300 bg-white/90 border-gray-200">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 animate-pulse">
                <span className="text-3xl">✨</span>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido a Be Living!</h1>
                <p className="text-lg text-gray-700 mb-6">Tu perfil está completo. Ahora explora increíbles propiedades alrededor del mundo.</p>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  onClick={() => router.push('/properties')}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-3 rounded-2xl transition duration-300 shadow-lg"
                >
                  Comenzar a explorar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Fondo con imagen */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${CITY_IMAGES[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-black/30 to-black/40"></div>
      </div>

      <div className="relative z-10 w-full px-6 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-md backdrop-blur-[80px] rounded-[32px] p-8 shadow-2xl border transition-all duration-300 bg-white/20 border-white/40">
          {/* Progress bar */}
          <div className="mb-8" role="group" aria-label="Progreso del cuestionario">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-white/70">
                Pregunta {stepNumber} de 5
              </p>
              <p className="text-sm font-medium text-white" aria-live="polite">{Math.round((stepNumber / 5) * 100)}%</p>
            </div>
            <div className="w-full backdrop-blur-[20px] bg-white/20 border border-white/30 rounded-full h-2" role="progressbar" aria-valuenow={stepNumber} aria-valuemin={1} aria-valuemax={5}>
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stepNumber / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Pregunta 1: Destino */}
          {step === 'destination' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ¿Dónde quieres viajar?
                </h2>
                <p className="text-white/70 text-sm">Selecciona tu destino favorito</p>
              </div>

              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Opciones de destino">
                {['Dubai', 'Barcelona', 'Madrid', 'Viña del Mar', 'Bali', 'Cancun'].map(
                  (city) => (
                    <button
                      key={city}
                      onClick={() => setResponses({ ...responses, destination: city })}
                      className={`p-3 rounded-xl text-sm transition backdrop-blur-[20px] border ${
                        responses.destination === city
                          ? 'bg-yellow-400/80 border-yellow-500/50 text-gray-900 font-semibold'
                          : 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                      }`}
                      aria-pressed={responses.destination === city}
                      aria-label={`Seleccionar ${city} como destino`}
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ¿Qué tipo de alojamiento prefieres?
                </h2>
                <p className="text-white/70 text-sm">Elige tu estilo de estancia</p>
              </div>

              <div className="space-y-2" role="group" aria-label="Opciones de tipo de alojamiento">
                {['Luxury Villa', 'Modern Apartment', 'Beachfront', 'Mountain Retreat', 'Urban Loft'].map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setResponses({ ...responses, type })}
                      className={`w-full p-3 rounded-xl text-left text-sm transition backdrop-blur-[20px] border ${
                        responses.type === type
                          ? 'bg-yellow-400/80 border-yellow-500/50 text-gray-900 font-semibold'
                          : 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                      }`}
                      aria-pressed={responses.type === type}
                      aria-label={`Seleccionar ${type} como tipo de alojamiento`}
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ¿Cuál es tu presupuesto por noche?
                </h2>
                <p className="text-white/70 text-sm">En dólares USD</p>
              </div>

              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Opciones de presupuesto">
                {['< $300', '$300-$500', '$500-$1000', '> $1000'].map((budget) => (
                  <button
                    key={budget}
                    onClick={() => setResponses({ ...responses, budget })}
                    className={`p-3 rounded-xl text-sm transition backdrop-blur-[20px] border ${
                      responses.budget === budget
                        ? 'bg-yellow-400/80 border-yellow-500/50 text-gray-900 font-semibold'
                        : 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                    }`}
                    aria-pressed={responses.budget === budget}
                    aria-label={`Seleccionar presupuesto ${budget}`}
                  >
                    {budget}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pregunta 4: Propósito */}
          {step === 'purpose' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ¿Cuál es el propósito de tu viaje?
                </h2>
                <p className="text-white/70 text-sm">Elige una opción</p>
              </div>

              <div className="space-y-2" role="group" aria-label="Opciones de propósito del viaje">
                {['Vacation', 'Work', 'Investment Exploration', 'Family Time'].map(
                  (purpose) => (
                    <button
                      key={purpose}
                      onClick={() => setResponses({ ...responses, purpose })}
                      className={`w-full p-3 rounded-xl text-left text-sm transition backdrop-blur-[20px] border ${
                        responses.purpose === purpose
                          ? 'bg-yellow-400/80 border-yellow-500/50 text-gray-900 font-semibold'
                          : 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                      }`}
                      aria-pressed={responses.purpose === purpose}
                      aria-label={`Seleccionar ${purpose} como propósito del viaje`}
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  ¿Qué experiencias te atraen?
                </h2>
                <p className="text-white/70 text-sm">Selecciona las que te interesan</p>
              </div>

              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Opciones de experiencias">
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
                    className={`p-3 rounded-xl text-sm transition backdrop-blur-[20px] border ${
                      responses.experiences.includes(exp)
                        ? 'bg-yellow-400/80 border-yellow-500/50 text-gray-900 font-semibold'
                        : 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                    }`}
                    aria-pressed={responses.experiences.includes(exp)}
                    aria-label={`${responses.experiences.includes(exp) ? 'Deseleccionar' : 'Seleccionar'} ${exp} como experiencia`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            {stepNumber > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-3 backdrop-blur-[20px] border border-white/40 bg-white/20 text-white rounded-xl hover:bg-white/30 transition font-medium text-sm"
                aria-label="Ir a la pregunta anterior"
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-xl transition font-bold text-sm"
              aria-label={step === 'experiences' ? 'Completar cuestionario y comenzar' : 'Ir a la siguiente pregunta'}
            >
              {step === 'experiences' ? '¡Comenzar!' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

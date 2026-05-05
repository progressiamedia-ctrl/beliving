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
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${CITY_IMAGES[currentImageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/35 via-black/30 to-black/40"></div>

        {/* Fuegos artificiales */}
        <div className="absolute inset-0 pointer-events-none z-5">
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
        <div className="relative z-10 w-full px-6 py-12 flex items-center justify-center">
          <div className="border border-white/40 bg-white/15 backdrop-blur-xl w-full" style={{ maxWidth: '380px', padding: '42px 32px', borderRadius: '20px', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(250, 204, 21), rgb(250, 193, 21))', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                <span style={{ fontSize: '28px' }}>✨</span>
              </div>

              <div>
                <h1 className="font-bold text-white" style={{ fontSize: '20px', fontFamily: 'Montserrat, sans-serif', marginBottom: '12px', letterSpacing: '0.2px' }}>¡Bienvenido a Be Living!</h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontFamily: 'Montserrat, sans-serif', lineHeight: '1.5' }}>Tu perfil está completo. Ahora explora increíbles propiedades alrededor del mundo.</p>
              </div>

              <div style={{ marginTop: '12px', width: '100%' }}>
                <button
                  onClick={() => router.push('/properties')}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgb(250, 204, 21)',
                    color: 'rgb(17, 24, 39)',
                    borderRadius: '12px',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover:bg-yellow-500"
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
        <div className="border border-white/40 bg-white/15 backdrop-blur-xl w-full" style={{ maxWidth: '380px', padding: '42px 32px', borderRadius: '20px', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
          {/* Progress bar */}
          <div className="mb-8" role="group" aria-label="Progreso del cuestionario">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-white/70" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px' }}>
                Pregunta {stepNumber} de 5
              </p>
              <p className="text-xs font-medium text-white" aria-live="polite" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '12px' }}>{Math.round((stepNumber / 5) * 100)}%</p>
            </div>
            <div className="w-full bg-white/20 border border-white/30 rounded-full h-2" role="progressbar" aria-valuenow={stepNumber} aria-valuemin={1} aria-valuemax={5}>
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stepNumber / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Pregunta 1: Destino */}
          {step === 'destination' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 className="font-semibold text-gray-800" style={{ fontSize: '16px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px', marginBottom: '8px' }}>
                  ¿Dónde quieres viajar?
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat, sans-serif' }}>Selecciona tu destino favorito</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} role="group" aria-label="Opciones de destino">
                {['Dubai', 'Barcelona', 'Madrid', 'Viña del Mar', 'Bali', 'Cancun'].map(
                  (city) => (
                    <button
                      key={city}
                      onClick={() => setResponses({ ...responses, destination: city })}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        border: responses.destination === city ? '2px solid rgba(250, 204, 21, 0.6)' : '1px solid rgba(255,255,255,0.3)',
                        backgroundColor: responses.destination === city ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: responses.destination === city ? 'rgb(250, 204, 21)' : 'white',
                        fontWeight: responses.destination === city ? '600' : '400',
                        fontFamily: 'Montserrat, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      className="hover:bg-white/20"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 className="font-semibold text-gray-800" style={{ fontSize: '16px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px', marginBottom: '8px' }}>
                  ¿Qué tipo de alojamiento prefieres?
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat, sans-serif' }}>Elige tu estilo de estancia</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} role="group" aria-label="Opciones de tipo de alojamiento">
                {['Luxury Villa', 'Modern Apartment', 'Beachfront', 'Mountain Retreat', 'Urban Loft'].map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setResponses({ ...responses, type })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        border: responses.type === type ? '2px solid rgba(250, 204, 21, 0.6)' : '1px solid rgba(255,255,255,0.3)',
                        backgroundColor: responses.type === type ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: responses.type === type ? 'rgb(250, 204, 21)' : 'white',
                        fontWeight: responses.type === type ? '600' : '400',
                        fontFamily: 'Montserrat, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left'
                      }}
                      className="hover:bg-white/20"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 className="font-semibold text-gray-800" style={{ fontSize: '16px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px', marginBottom: '8px' }}>
                  ¿Cuál es tu presupuesto por noche?
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat, sans-serif' }}>En dólares USD</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} role="group" aria-label="Opciones de presupuesto">
                {['< $300', '$300-$500', '$500-$1000', '> $1000'].map((budget) => (
                  <button
                    key={budget}
                    onClick={() => setResponses({ ...responses, budget })}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      border: responses.budget === budget ? '2px solid rgba(250, 204, 21, 0.6)' : '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: responses.budget === budget ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255,255,255,0.1)',
                      color: responses.budget === budget ? 'rgb(250, 204, 21)' : 'white',
                      fontWeight: responses.budget === budget ? '600' : '400',
                      fontFamily: 'Montserrat, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    className="hover:bg-white/20"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 className="font-semibold text-gray-800" style={{ fontSize: '16px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px', marginBottom: '8px' }}>
                  ¿Cuál es el propósito de tu viaje?
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat, sans-serif' }}>Elige una opción</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} role="group" aria-label="Opciones de propósito del viaje">
                {['Vacation', 'Work', 'Investment Exploration', 'Family Time'].map(
                  (purpose) => (
                    <button
                      key={purpose}
                      onClick={() => setResponses({ ...responses, purpose })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        border: responses.purpose === purpose ? '2px solid rgba(250, 204, 21, 0.6)' : '1px solid rgba(255,255,255,0.3)',
                        backgroundColor: responses.purpose === purpose ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: responses.purpose === purpose ? 'rgb(250, 204, 21)' : 'white',
                        fontWeight: responses.purpose === purpose ? '600' : '400',
                        fontFamily: 'Montserrat, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left'
                      }}
                      className="hover:bg-white/20"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 className="font-semibold text-gray-800" style={{ fontSize: '16px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.2px', marginBottom: '8px' }}>
                  ¿Qué experiencias te atraen?
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat, sans-serif' }}>Selecciona las que te interesan</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} role="group" aria-label="Opciones de experiencias">
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
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      border: responses.experiences.includes(exp) ? '2px solid rgba(250, 204, 21, 0.6)' : '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: responses.experiences.includes(exp) ? 'rgba(250, 204, 21, 0.2)' : 'rgba(255,255,255,0.1)',
                      color: responses.experiences.includes(exp) ? 'rgb(250, 204, 21)' : 'white',
                      fontWeight: responses.experiences.includes(exp) ? '600' : '400',
                      fontFamily: 'Montserrat, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    className="hover:bg-white/20"
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
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            {stepNumber > 1 && (
              <button
                onClick={handleBack}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  borderRadius: '12px',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="hover:bg-white/20"
                aria-label="Ir a la pregunta anterior"
              >
                ← Atrás
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                flex: 1,
                padding: '12px 18px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgb(250, 204, 21)',
                color: 'rgb(17, 24, 39)',
                borderRadius: '12px',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
              className="hover:bg-yellow-500"
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

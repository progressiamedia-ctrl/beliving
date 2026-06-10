'use client';

import { useState } from 'react';
import { useMagicLink } from '@/lib/hooks';

interface MagicLinkFormProps {
  userType: 'guest' | 'host';
  onSuccess?: () => void;
}

export function MagicLinkForm({ userType, onSuccess }: MagicLinkFormProps) {
  const { loading, error, sentEmail, sendMagicLink, verifyToken } = useMagicLink();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'verification' | 'details'>('email');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Por favor ingresa tu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    const success = await sendMagicLink(email);
    if (success) {
      setStep('verification');
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!verificationCode.trim()) {
      setLocalError('Por favor ingresa el código de verificación');
      return;
    }

    if (userType === 'host' && (!firstName.trim() || !lastName.trim())) {
      setLocalError('Por favor completa nombre y apellido');
      return;
    }

    const success = await verifyToken(
      verificationCode,
      userType,
      userType === 'host' ? firstName : undefined,
      userType === 'host' ? lastName : undefined
    );

    if (success) {
      setEmail('');
      setVerificationCode('');
      setFirstName('');
      setLastName('');
      setStep('email');
      onSuccess?.();
    }
  };

  const displayError = localError || error;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Acceso sin contraseña</h3>

      {step === 'email' && (
        <form onSubmit={handleSendLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            />
          </div>

          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Enviando enlace...' : 'Enviar enlace de acceso'}
          </button>

          {sentEmail && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              ✓ Enlace enviado a {sentEmail}. Revisa tu email.
            </div>
          )}
        </form>
      )}

      {step === 'verification' && (
        <form onSubmit={handleVerifyAndRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código de verificación</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Código de 6 dígitos"
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
            />
          </div>

          {userType === 'host' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>
            </>
          )}

          {displayError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar y entrar'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email');
              setVerificationCode('');
              setFirstName('');
              setLastName('');
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver atrás
          </button>
        </form>
      )}
    </div>
  );
}

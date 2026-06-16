# Hooks API - Ejemplos de Uso

Todos los hooks están en `lib/hooks/index.ts` y listos para usar en componentes client.

---

## 🏠 `useProperties` - Gestionar Propiedades

```tsx
'use client';

import { useProperties } from '@/lib/hooks';

export function PropertyList() {
  const { properties, loading, error, fetchProperties } = useProperties();

  useEffect(() => {
    // Listar propiedades
    fetchProperties('Madrid', 20);
  }, [fetchProperties]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {properties.map(prop => (
        <div key={prop.id}>
          <h3>{prop.title}</h3>
          <p>{prop.price}/noche</p>
        </div>
      ))}
    </div>
  );
}
```

### Crear Propiedad

```tsx
const { createProperty, loading } = useProperties();

const handleCreate = async (formData) => {
  const result = await createProperty({
    host_id: userId,
    title: 'Mi Apartamento',
    description: '...',
    location: 'Calle 123',
    city: 'Madrid',
    price: 150,
    amenities: ['WiFi', 'AC'],
    images: [],
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    available: true
  });

  if (result) {
    console.log('Propiedad creada:', result.id);
  }
};
```

---

## 📅 `useBookings` - Gestionar Reservas

```tsx
'use client';

import { useBookings } from '@/lib/hooks';

export function BookingsList() {
  const { bookings, loading, fetchBookings, createBooking } = useBookings();

  useEffect(() => {
    // Listar mis reservas como guest
    fetchBookings(userId, 'guest');
  }, [fetchBookings, userId]);

  const handleBook = async (propertyId) => {
    const booking = await createBooking({
      property_id: propertyId,
      guest_id: userId,
      host_id: hostId,
      check_in: '2026-05-15',
      check_out: '2026-05-20',
      total_price: 750,
      guest_name: 'Juan Pérez',
      guest_email: 'juan@example.com'
    });

    if (booking) {
      console.log('Reserva creada:', booking.id);
    }
  };

  return (
    <div>
      {bookings.map(booking => (
        <div key={booking.id}>
          <p>Check-in: {booking.check_in}</p>
          <p>Total: ${booking.total_price}</p>
          <p>Estado: {booking.status}</p>
        </div>
      ))}
    </div>
  );
}
```

### Actualizar Estado de Reserva

```tsx
const { updateBookingStatus } = useBookings();

const handleConfirm = async (bookingId) => {
  const updated = await updateBookingStatus(
    bookingId,
    'confirmed',
    userId
  );

  if (updated) {
    console.log('Reserva confirmada');
  }
};
```

---

## 💬 `useMessages` - Gestionar Conversaciones y Mensajes

```tsx
'use client';

import { useMessages } from '@/lib/hooks';

export function ChatComponent({ bookingId, guestId, hostId }) {
  const { 
    messages, 
    conversations, 
    fetchConversations, 
    createConversation,
    fetchMessages, 
    sendMessage 
  } = useMessages();

  const [conversationId, setConversationId] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Crear conversación desde booking
  const handleStartChat = async () => {
    const conversation = await createConversation({
      booking_id: bookingId,
      guest_id: guestId,
      host_id: hostId,
      guest_name: 'Juan',
      host_name: 'María',
      guest_email: 'juan@example.com',
      host_email: 'maria@example.com',
      property_id: propertyId,
      property_title: 'Mi Apartamento'
    });

    if (conversation) {
      setConversationId(conversation.id);
      await fetchMessages(conversation.id);
    }
  };

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    await sendMessage(
      conversationId,
      userId,
      userName,
      messageText
    );

    setMessageText('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={msg.sender_id === userId ? 'sent' : 'received'}>
            <p>{msg.sender_name}</p>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <input
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder="Escribe un mensaje..."
      />
      <button onClick={handleSendMessage}>Enviar</button>
    </div>
  );
}
```

---

## 🔗 `useMagicLink` - Registro sin Contraseña

```tsx
'use client';

import { useMagicLink } from '@/lib/hooks';
import { useRouter } from 'next/navigation';

export function MagicLinkSignup() {
  const { sendMagicLink, verifyToken, loading, error, sentEmail } = useMagicLink();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'verify'

  const handleSendLink = async () => {
    const success = await sendMagicLink(email);
    if (success) {
      setStep('verify');
    }
  };

  const handleVerifyToken = async (token) => {
    const user = await verifyToken(token, 'guest', 'Juan', 'Pérez');
    
    if (user) {
      // Usuario creado y sesión guardada
      router.push('/properties');
    }
  };

  return (
    <div>
      {step === 'email' ? (
        <div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            type="email"
          />
          <button onClick={handleSendLink} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </div>
      ) : (
        <div>
          <p>Enlace enviado a {sentEmail}</p>
          <p>Verifica tu email para el enlace de acceso</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

---

## 📤 `useUpload` - Subir Imágenes

```tsx
'use client';

import { useUpload } from '@/lib/hooks';

export function ImageUploader({ userId, onImageUploaded }) {
  const { uploadFile, uploadMultiple, loading, progress, error } = useUpload();

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);

    // Subir múltiples archivos
    const results = await uploadMultiple(files, userId, 'properties');

    if (results.length > 0) {
      results.forEach(result => {
        onImageUploaded(result.url);
      });
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />

      {loading && <p>Subiendo... {progress}%</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## ⭐ `useRatings` - Reseñas y Calificaciones

```tsx
'use client';

import { useRatings } from '@/lib/hooks';

export function PropertyReviews({ propertyId }) {
  const { 
    ratings, 
    loading, 
    fetchPropertyRatings, 
    createRating,
    getAverageRating,
    getRatingDistribution
  } = useRatings();

  useEffect(() => {
    fetchPropertyRatings(propertyId);
  }, [propertyId, fetchPropertyRatings]);

  const handleCreateRating = async (bookingId, rating, comment) => {
    await createRating({
      booking_id: bookingId,
      property_id: propertyId,
      guest_id: userId,
      rating, // 1-5
      comment
    });
  };

  const average = getAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div>
      <h3>Calificación Promedio: {average}/5</h3>
      <p>({ratings.length} reseñas)</p>

      <div>
        <div>5 estrellas: {distribution[5]}</div>
        <div>4 estrellas: {distribution[4]}</div>
        <div>3 estrellas: {distribution[3]}</div>
        <div>2 estrellas: {distribution[2]}</div>
        <div>1 estrella: {distribution[1]}</div>
      </div>

      {ratings.map(rating => (
        <div key={rating.id}>
          <p>{rating.rating} estrellas</p>
          <p>{rating.comment}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 Patrón Común en Componentes

```tsx
'use client';

import { useProperties } from '@/lib/hooks';
import { useSession } from '@/lib/useSession';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MyComponent() {
  const { session, loading: sessionLoading } = useSession();
  const { properties, loading, error, fetchProperties } = useProperties();
  const router = useRouter();

  useEffect(() => {
    // Proteger ruta - redirigir si no hay sesión
    if (!sessionLoading && !session) {
      router.push('/');
      return;
    }

    // Cargar datos una vez que la sesión está lista
    if (session) {
      fetchProperties();
    }
  }, [session, sessionLoading, router, fetchProperties]);

  if (sessionLoading || loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!session) return null;

  return (
    <div>
      <h1>Hola, {session.email}</h1>
      {/* Render propiedades */}
    </div>
  );
}
```

---

## 🔄 Estados y Manejo de Errores

Cada hook retorna:
- `loading: boolean` - Operación en progreso
- `error: string | null` - Mensaje de error si algo falla
- Funciones que retornan `null` si fallan (error se guarda en `error`)

```tsx
const { createBooking, loading, error } = useBookings();

const handleBook = async () => {
  const booking = await createBooking(data);
  
  if (!booking) {
    // Hubo un error, está en 'error'
    console.log('Error:', error);
  } else {
    // Éxito
    console.log('Booked:', booking.id);
  }
};
```

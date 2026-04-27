# 🔧 Configuración de Supabase - Be Living

## Paso 1: Ir a Supabase SQL Editor

1. Abre tu Supabase project
2. Ve a **SQL Editor**
3. Haz clic en **+ New Query**

## Paso 2: Copiar y Ejecutar SQL

Copia todo el contenido de **`lib/setup.sql`** y pégalo en el SQL Editor.

El SQL creará automáticamente:

✅ Tabla `users` - registros de usuarios (guest/host)
✅ Tabla `properties` - propiedades de hosts
✅ Tabla `bookings` - reservas
✅ Tabla `reviews` - reseñas
✅ Tabla `messages` - mensajería
✅ Índices de base de datos para performance

Haz clic en **Execute**.

## Paso 3: Verificar Credenciales

Las credenciales están en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xgqiftublvrockxgzwzc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<en-.env.local>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<en-.env.local>
```

## Paso 4: Desplegar a Vercel

Todas las credenciales ya están en Vercel como environment variables.

El despliegue está automático en: https://beliving-alpha.vercel.app

## Paso 5: Probar la Plataforma

1. Ve a https://beliving-alpha.vercel.app
2. Haz clic en **Registrarse**
3. Elige tu tipo (Guest o Host)
4. Ingresa email y contraseña
5. ¡Deberías estar dentro!

## ✅ Qué está funcionando

| Feature | Status |
|---------|--------|
| Registro | ✅ API conectado a Supabase |
| Login | ✅ API conectado a Supabase |
| Chat AI | ✅ Listo (requiere ANTHROPIC_API_KEY) |
| Propiedades | ✅ Funcionando con mock data |
| Base de Datos | ⏳ Se configura al ejecutar SQL |

## 📝 Próximos pasos

Después de ejecutar el SQL:

1. Verifica datos en Supabase → Table Editor
2. Intenta registrar una cuenta real
3. Prueba el login
4. (Opcional) Activa Chat AI agregando ANTHROPIC_API_KEY

---

**La plataforma está lista. Solo falta ejecutar el SQL en Supabase.**

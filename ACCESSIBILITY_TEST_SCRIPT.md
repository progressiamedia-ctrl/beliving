# 🧪 Script de Testing Manual de Accesibilidad — Be Living

**Objetivo:** Validar WCAG 2.1 AA en 20 páginas  
**Duración estimada:** 2-3 horas  
**Herramientas:** Navegador + Lector de pantalla + DevTools

---

## ✅ Checklist de Testing

### 1. **Testing de Formularios** (30 min)

#### Página: `/ (AuthForm)`
- [ ] Tab order correcto: Role Select → Email → Password → Confirm → Submit
- [ ] Labels visibles y asociados a inputs (`htmlFor/id`)
- [ ] Error messages anunciados con `role="alert"`
- [ ] Campos requeridos tienen `aria-required="true"`
- [ ] Focus outline visible en todos los inputs
- [ ] Estados de validación:
  - [ ] Email vacío: mensaje de error
  - [ ] Email sin @: mensaje "Por favor ingresa un email válido"
  - [ ] Password < 6 caracteres: mensaje específico
  - [ ] Passwords no coinciden: mensaje claro
  - [ ] Todos los campos llenados: submit funciona

#### Página: `/host/properties/new` y `[id]/edit`
- [ ] Labels correctamente asociados
- [ ] Required fields marcados con `*` y `aria-required`
- [ ] Validación de precio:
  - [ ] Vacío: error
  - [ ] No numérico: error
  - [ ] < 1: error
  - [ ] > 99999: error
- [ ] Validación de título (min 5, max 100 caracteres)
- [ ] Validación de ubicación (min 3 caracteres)
- [ ] Amenidades (máx 20)
- [ ] Error message con `role="alert"`

---

### 2. **Testing de Navegación** (20 min)

#### Navegación solo con teclado
- [ ] Tab avanza a todos los elementos interactivos
- [ ] Shift+Tab retrocede correctamente
- [ ] Enter/Space activa botones
- [ ] Escape cierra modales y menús
- [ ] Focus visible en todos los elementos
- [ ] No hay trampas de teclado (elementos sin escape)

#### Bottom Navigation (`/properties`)
- [ ] Navegar con tab a cada botón del nav
- [ ] `aria-current="page"` presente en nav activo
- [ ] Profile menu abre/cierra con click
- [ ] Profile menu items navegables con tab
- [ ] Escape cierra profile menu

#### Search Dropdown (`/properties`)
- [ ] Search input tiene `aria-autocomplete="list"`
- [ ] Suggestions lista aparece con `role="listbox"`
- [ ] Suggestions tienen `role="option"`
- [ ] Arrow down navega en dropdown
- [ ] Enter selecciona opción
- [ ] Escape cierra dropdown

---

### 3. **Testing de Diálogos y Modales** (15 min)

#### Booking Modal (`/properties/[id]`)
- [ ] Modal tiene `role="dialog"`
- [ ] Modal tiene `aria-modal="true"`
- [ ] Modal tiene `aria-labelledby` apuntando a title
- [ ] Focus cae dentro del modal al abrir
- [ ] Escape cierra modal
- [ ] Focus retorna al botón trigger después de cerrar
- [ ] Fondo detrás del modal opaco/inactivo

---

### 4. **Testing de Status Messages** (10 min)

#### Status Announcements
Páginas a revisar:
- [ ] `/host/bookings` — booking confirmado
- [ ] `/guest/bookings` — booking cancelado
- [ ] `/messages/[id]` — mensaje enviado
- [ ] `/profile` — perfil actualizado

**Verificar:**
- [ ] Mensaje tiene `role="status"`
- [ ] Se anuncia automáticamente a lector de pantalla
- [ ] Desaparece después de tiempo prudente
- [ ] No interrumpe navegación en curso

#### Alert Messages
- [ ] Error messages tienen `role="alert"`
- [ ] Se anuncian inmediatamente
- [ ] Contraste de color suficiente (min WCAG AA)
- [ ] No solo color, tiene ícono/símbolo también

---

### 5. **Testing de Imágenes y Decoración** (10 min)

#### Imágenes
- [ ] Property card images tienen alt text descriptivo
- [ ] Host avatar tiene alt text (nombre del host)
- [ ] Logo tiene alt="Be Living"
- [ ] Rating stars tienen `aria-hidden="true"` (decorativos)

#### Símbolos Decorativos
- [ ] ✓ (checkmark) tiene `aria-hidden="true"` o `role="img" aria-label`
- [ ] ✗ (x mark) tiene context correcto
- [ ] ★ (stars) tienen aria-hidden si decorativos
- [ ] 🏠, 🔑 (emojis) tienen contexto o aria-hidden

---

### 6. **Testing de Lector de Pantalla** (45 min)

#### Configuración Windows
```bash
# Instalar NVDA (gratuito)
# https://www.nvaccess.org/download/

# Shortcuts importantes:
- Caps + H: Ver todas las letras de acceso rápido
- Caps + F7: Ver toda la página
- Caps + D: Ir a formularios
- Tab: Navegar entre elementos
```

#### Configuración macOS
```bash
# VoiceOver integrado (⌘ + F5)

# Shortcuts:
- VO = Control + Option
- VO + U: Web rotor
- VO + Space: Activar elemento
- VO + Left/Right Arrow: Navegar
```

#### Testing Plan
1. Navega a `/properties`
   - [ ] Lee encabezado página correctamente
   - [ ] Lee nombre de propiedades en cards
   - [ ] Lee precios correctamente
   - [ ] Search input tiene label

2. Navega a `/properties/[id]`
   - [ ] Lee property name
   - [ ] Lee descripción
   - [ ] Lee botón "Reservar" con contexto
   - [ ] Modal dialog anunciado como "dialog"

3. Navega a `/host/dashboard`
   - [ ] Lee KPI stats (revenue, bookings, etc)
   - [ ] Lee gráfico (tiene `role="img" aria-label`)
   - [ ] Tabla de bookings navegable

4. Navega a `/messages`
   - [ ] Lee lista de conversaciones
   - [ ] Lee propiedad asociada a cada chat
   - [ ] Lee unread count si existe

5. Navega a `/profile`
   - [ ] Lee input labels
   - [ ] Password inputs claramente identificados
   - [ ] Error messages claramente anunciados

---

### 7. **Testing de Contraste** (15 min)

#### Herramienta
```
Chrome DevTools > Rendering > Emulate CSS media feature prefers-color-scheme
```

#### Verificar contraste mínimo WCAG AA (4.5:1)
- [ ] Text sobre dark backgrounds
- [ ] Text sobre light backgrounds
- [ ] Text en dark mode
- [ ] Text en light mode
- [ ] Links vs fondo
- [ ] Form inputs vs labels
- [ ] Error messages vs fondo
- [ ] Success messages vs fondo

#### Herramienta online
- https://webaim.org/resources/contrastchecker/
- https://www.tpgi.com/color-contrast-checker/

---

### 8. **Testing de Responsividad** (15 min)

#### Viewports a probar
- [ ] 375px (iPhone SE)
- [ ] 640px (iPhone 12)
- [ ] 768px (iPad)
- [ ] 1024px (iPad Pro)
- [ ] 1440px (Desktop)

#### Verificar en cada viewport
- [ ] No hay scroll horizontal
- [ ] Botones son clickeables (min 44x44px)
- [ ] Textos son legibles sin zoom
- [ ] Imágenes se escalan correctamente
- [ ] Layouts se reajustan sin overflow

---

## 🔍 Casos Edge a Probar

### Login Flow
- [ ] Email vacío → error "El email es requerido"
- [ ] Email inválido → error "Por favor ingresa un email válido"
- [ ] Password vacío → error "La contraseña es requerida"
- [ ] Password muy corta → error "Mínimo 6 caracteres"
- [ ] Passwords no coinciden → error "Las contraseñas no coinciden"

### Property Creation
- [ ] Título vacío → error
- [ ] Título < 5 caracteres → error
- [ ] Precio vacío → error
- [ ] Precio no numérico → error
- [ ] Precio negativo → error
- [ ] Ubicación vacía → error

### Booking Flow
- [ ] Check-out antes que check-in → error
- [ ] Fechas en el pasado → error
- [ ] Cancelar reserva → confirmar con modal
- [ ] Dejar review antes de checkout → error "Espera hasta checkout"

### Messaging
- [ ] Enviar mensaje vacío → error o ignore
- [ ] Escribir a usuario inexistente → error
- [ ] Chat scroll automático a último mensaje ✓

---

## 📋 Resultados del Testing

### Hallazgos de Accesibilidad

**Críticos** (bloquean lanzamiento):
- [ ] Ninguno encontrado ✓

**Altos** (deben corregirse):
- [ ] Documentar aquí

**Medios** (mejora deseada):
- [ ] Documentar aquí

**Bajos** (optimización futura):
- [ ] Documentar aquí

---

## 🎯 Criterios de Éxito

### ✅ Completa cuando:
1. Tab order es lógico en todas las páginas
2. Todos los inputs tienen labels asociados
3. Modales trappean y restituyen focus
4. Errores se anuncian con `role="alert"`
5. Screen reader lee toda la información importante
6. Contraste ≥ 4.5:1 en todas partes
7. Responsivo en 375px sin scroll horizontal
8. Sin trampas de teclado
9. Escape cierra modales/dropdowns
10. Dark mode tiene contraste suficiente

---

## 📖 Recursos

- WCAG 2.1 AA Criteria: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM Testing: https://webaim.org/
- NVDA Screen Reader: https://www.nvaccess.org/
- ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
- Axe DevTools: https://www.deque.com/axe/devtools/

---

**Última actualización:** 2026-05-01  
**Testing completado por:** [Tu nombre]  
**Fecha de testing:** ___________  
**Resultado:** ✅ PASS / ❌ FAIL

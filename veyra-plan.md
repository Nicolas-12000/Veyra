# Veyra — Documento de Arquitectura y Planeación v4.2

> **Stack:** Next.js 15 (App Router) · Supabase (PostgreSQL) · Vercel  
> **Diseño visual:** [`DESIGN.md`](./DESIGN.md) — tokens, componentes y comportamiento responsive.  
> Este documento cubre exclusivamente arquitectura, datos, flujos y lógica de negocio.  
> **Última actualización:** Junio 2026

---

## Índice

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Patrones de Arquitectura](#3-patrones-de-arquitectura)
4. [Estimación de Almacenamiento (3 años)](#4-estimación-de-almacenamiento-3-años)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [Modelo de Rutina y Registro de Series](#6-modelo-de-rutina-y-registro-de-series)
7. [Sistema de Filtros de Tiempo](#7-sistema-de-filtros-de-tiempo)
8. [Métricas y Cálculos](#8-métricas-y-cálculos)
9. [Funcionalidades Completas](#9-funcionalidades-completas)
10. [Flujo de Sesión: Registro en Vivo](#10-flujo-de-sesión-registro-en-vivo)
11. [Gestión de Rutinas](#11-gestión-de-rutinas)
12. [Analítica y Gráficas](#12-analítica-y-gráficas)
13. [Lógica de Negocio](#13-lógica-de-negocio)
14. [Estructura de la Aplicación](#14-estructura-de-la-aplicación)
15. [Principios de Ingeniería](#15-principios-de-ingeniería)
16. [Arquitectura de Módulos](#16-arquitectura-de-módulos)

---

## 1. Visión General

**Veyra** es un tracker de entrenamiento personal de largo plazo (3+ años), diseñado para convertir datos crudos de series en inteligencia accionable. La app tiene dos contextos de uso:

- **Gym mode:** registro rápido de series, con referencia de la sesión anterior visible para cada serie, conversión automática de unidades y mínima fricción.
- **Insight mode:** analítica de cargas, detección de mesetas, seguimiento de peso corporal y proyección por fase.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR + Server Actions + Vercel nativo |
| Base de datos | **Supabase** (PostgreSQL) | Free tier holgado, RLS integrado, tipos generables |
| Auth | **Supabase Auth** | Google OAuth o magic link, integrado |
| ORM | **Drizzle ORM** | Type-safe, edge-compatible (Prisma no corre bien en Vercel edge) |
| UI base | **shadcn/ui** + **Tailwind CSS** | Los tokens de `DESIGN.md` se exportan a Tailwind config |
| Gráficas | **Recharts** | Declarativo, SSR-friendly, sin conflictos con Next.js |
| Estado de URL | **nuqs** | Filtros de analítica como query params tipados |
| Validación | **Zod** | Valida todo input en Server Actions antes de la DB |
| Deploy | **Vercel** | CI/CD automático desde `main`, previews por PR |

### Integración de tokens de diseño

```bash
# Exportar tokens de DESIGN.md a Tailwind v4
npx @google/design.md export --format css-tailwind DESIGN.md > src/styles/theme.css
```

El bloque `@theme { ... }` resultante contiene las custom properties que Tailwind consume.
Ningún componente tiene valores de color, espaciado o tipografía hardcodeados — todo referencia variables CSS generadas desde `DESIGN.md`.

---

## 3. Patrones de Arquitectura

### 3.1 Optimistic UI para registro de series

**Problema:** En el gym, si el usuario espera confirmación de la DB para ver el set registrado, la app se siente lenta.

**Solución:** `useOptimistic` de React 19. La UI se actualiza inmediatamente con los datos locales; la DB sincroniza en background. El set recién registrado aparece con un estado visual "pendiente" hasta que la DB confirma.

```tsx
'use client';
import { useOptimistic } from 'react';
import { logSet } from '@/modules/sessions/actions/log-set';

export function SetLogger({ sessionId, exerciseId, existingSets }) {
  const [optimisticSets, addOptimisticSet] = useOptimistic(
    existingSets,
    (state, newSet) => [...state, { ...newSet, pending: true }]
  );

  async function handleLogSet(data: SetInput) {
    addOptimisticSet(data);           // UI se actualiza ahora
    await logSet(sessionId, exerciseId, data); // DB en background
  }
}
```

**Regla:** Optimistic updates solo para escritura frecuente (log de sets). Para datos críticos como perfil o rutina, esperar confirmación de la DB.

### 3.2 Session Draft — borrador de sesión

**Problema:** El usuario empieza a entrenar, le entra una llamada y cierra el browser. Pierde los sets registrados.

**Solución:** Crear `workout_sessions` con `completed: false` al iniciar, antes de registrar cualquier set. Cada set referencia ese `session_id`. Al terminar, el usuario marca `completed: true`.

```
1. "Iniciar entrenamiento" → INSERT workout_sessions (completed: false)
2. Cada set → INSERT set_logs con el session_id
3. "Finalizar" → UPDATE workout_sessions SET completed = true
4. Si cierra la app → al volver encuentra el borrador y puede continuar
```

Sesiones con `completed: false` de más de 24 horas se marcan automáticamente como descartadas en un cron job de Vercel. El usuario también puede descartarlas manualmente.

### 3.3 Server Actions como comandos

Cada acción del usuario = un Server Action con nombre de verbo. Los componentes no tocan Supabase directamente.

```
modules/sessions/actions/
├── start-session.ts          — Crear borrador de sesión
├── log-set.ts                — Registrar una serie (convierte unidades, valida, inserta)
├── complete-session.ts       — Marcar sesión como completada
├── apply-session-override.ts — Sobreescribir ejercicio/reps/descanso para esta sesión

modules/routines/actions/
├── upsert-routine-exercise.ts
├── duplicate-routine.ts
├── switch-active-routine.ts

modules/body-weight/actions/
├── log-body-weight.ts

modules/auth/actions/
└── update-phase.ts
```

Estructura estándar de cada Server Action:

```ts
export async function logSet(sessionId: string, payload: unknown) {
  // 1. Validar con Zod
  const parsed = SetLogSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.flatten() };

  // 2. Verificar ownership — la sesión debe pertenecer al usuario autenticado
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: session } = await supabase
    .from('workout_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();
  if (session?.user_id !== user?.id) return { error: 'Unauthorized' };

  // 3. Convertir unidades y ejecutar
  const weightKg = parsed.data.unit === 'lb'
    ? parsed.data.weight * 0.453592
    : parsed.data.weight;
  await supabase.from('set_logs').insert({ session_id: sessionId, weight_kg: weightKg, ... });

  // 4. Revalidar caché
  revalidatePath(`/session/${sessionId}`);
  return { success: true };
}
```

### 3.4 URL State para filtros

Los filtros de analítica viven en la URL con `nuqs`. Sobreviven navegación, son compartibles y el botón "atrás" funciona correctamente.

```ts
import { createSearchParamsCache, parseAsString } from 'nuqs/server';

export const analyticsParamsCache = createSearchParamsCache({
  period: parseAsString.withDefault('3m'),
  muscle: parseAsString.withDefault('all'),
  status: parseAsString.withDefault('all'),
  sort:   parseAsString.withDefault('1rm_change'),
});
```

```
/analytics?period=3m&muscle=pierna&status=plateaued
→ "Ejercicios de pierna · últimos 3 meses · estancados"
```

### 3.5 Service layer delgado

Dos archivos de servicio por módulo. Sin clases, sin inyección de dependencias.

```ts
// modules/sessions/queries.ts — lectura
export async function getLastSetsByExercise(params: {
  userId: string;
  exerciseId: string;
  routineDayId: string;
  targetSets: number;
  supabase: SupabaseClient;
}): Promise<PreviousSetReference[]> {
  // Ver sección 6.4 para la query completa
}

// modules/sessions/commands.ts — escritura
export async function insertSetLog(payload: SetLogInsert, supabase: SupabaseClient) {
  return supabase.from('set_logs').insert(payload);
}
```

**Regla:** Si una función se usa en más de un lugar, va al service. Si solo se usa en un Server Action, vive ahí mismo.

---

## 4. Estimación de Almacenamiento (3 años)

**Supabase Free Tier:** 500 MB base de datos · 1 GB storage

Asumiendo **5 sesiones/semana · 7 ejercicios/sesión · 3.5 series/ejercicio**:

| Tabla | Filas en 3 años | Bytes/fila | Total |
|---|---|---|---|
| `workout_sessions` | 780 | ~100 bytes | ~0.08 MB |
| `set_logs` | ~19,110 | ~130 bytes | ~2.5 MB |
| `weekly_metrics` | 156 | ~60 bytes | ~0.01 MB |
| `exercises` (catálogo) | ~300 | ~200 bytes | ~0.06 MB |
| `session_config` (JSONB) | 780 | ~500 bytes | ~0.39 MB |
| **Total estimado** | | | **~3.0 MB** |

El free tier de Supabase aguanta más de 30 años de datos de Veyra.

---

## 5. Modelo de Datos

### 5.1 Dimensiones (escritura infrecuente)

```sql
-- Perfil del usuario
user_profiles (
  id                      uuid PRIMARY KEY REFERENCES auth.users,
  unit_pref               text DEFAULT 'kg',    -- 'kg' | 'lb' — preferencia visual global
  current_phase           text DEFAULT 'volumen', -- 'volumen' | 'definicion' | 'recomposicion'
  starting_weight_kg      numeric(5,2),
  target_weekly_change_kg numeric(4,3),          -- +0.25 volumen | -0.50 def | 0.0 recomp
  phase_start_date        date,
  active_routine_id       uuid,                  -- FK a routines
  created_at              timestamptz DEFAULT now()
)

-- Catálogo de ejercicios
exercises (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  muscle_group     text NOT NULL,
  -- 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps'
  -- 'cuadriceps' | 'isquios' | 'gluteos' | 'pantorrillas' | 'core'

  movement_pattern text,
  -- 'empuje_horizontal' | 'empuje_vertical' | 'jale_horizontal' | 'jale_vertical'
  -- 'sentadilla' | 'bisagra' | 'aislamiento' | 'core'

  mechanic         text,          -- 'compound' | 'isolation'
  is_bilateral     boolean DEFAULT true,
  video_url        text,
  is_custom        boolean DEFAULT false
)

-- Sustituciones (M:N)
exercise_substitutions (
  main_exercise_id uuid REFERENCES exercises,
  sub_exercise_id  uuid REFERENCES exercises,
  PRIMARY KEY (main_exercise_id, sub_exercise_id)
)

-- Rutinas (múltiples por usuario)
routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users,
  name        text NOT NULL,   -- "BTS Semana 12", "PPL Volumen"
  description text,
  is_archived boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
)

-- Días de la rutina
routine_days (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id  uuid REFERENCES routines ON DELETE CASCADE,
  day_order   int NOT NULL,
  day_label   text,            -- "Push - Strength", "Legs - Hypertrophy"
  split_type  text,            -- 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'rest'
  is_rest_day boolean DEFAULT false
)

-- Ejercicios por día — TEMPLATE (no cambia por sesión)
routine_exercises (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_day_id   uuid REFERENCES routine_days ON DELETE CASCADE,
  exercise_id      uuid REFERENCES exercises,
  order_in_day     int NOT NULL,
  target_sets      int NOT NULL DEFAULT 3,   -- número fijo de series, ej: 4
  target_reps_min  int,                      -- rango inferior, ej: 8
  target_reps_max  int,                      -- rango superior, ej: 10  → "8-10 reps"
  rest_minutes     int DEFAULT 2,
  rest_seconds     int DEFAULT 0,
  early_set_rpe    numeric(3,1),             -- RPE objetivo en sets no finales
  last_set_rpe     numeric(3,1),             -- RPE objetivo en el último set (suele ser fallo)
  notes            text                      -- cue de técnica del programa
)
```

### 5.2 Hechos (escritura diaria)

```sql
-- Peso corporal semanal
weekly_metrics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users,
  recorded_date date NOT NULL,
  weight_kg     numeric(5,2) NOT NULL,       -- siempre en kg
  notes         text,
  UNIQUE (user_id, recorded_date)
)

-- Sesión de entrenamiento
workout_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users,
  routine_id     uuid REFERENCES routines,
  routine_day_id uuid REFERENCES routine_days,
  session_date   date NOT NULL,
  notes          text,
  completed      boolean DEFAULT false,      -- false = borrador en progreso
  session_config jsonb DEFAULT '{}',         -- overrides por sesión (ver sección 5.3)
  created_at     timestamptz DEFAULT now()
)

-- Registro de cada serie — toda la analítica nace aquí
set_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid REFERENCES workout_sessions ON DELETE CASCADE,
  exercise_id  uuid REFERENCES exercises,   -- puede ser el original o el sustituto
  set_number   int NOT NULL,                -- 1, 2, 3, 4...
  reps         int NOT NULL,
  weight_kg    numeric(6,3) NOT NULL,       -- SIEMPRE en kg, la conversión ocurre antes
  rpe          numeric(3,1),               -- 6.0 – 10.0
  is_last_set  boolean DEFAULT false,       -- para identificar el set llevado a fallo
  notes        text,
  created_at   timestamptz DEFAULT now()
)
```

### 5.3 Estructura del JSONB session_config

```json
{
  "overrides": {
    "<routine_exercise_id>": {
      "target_reps_min": 6,
      "target_reps_max": 8,
      "rest_minutes": 3,
      "rest_seconds": 0,
      "substitute_exercise_id": "<uuid | null>"
    }
  }
}
```

Los overrides se aplican antes de iniciar la sesión. No modifican el template de `routine_exercises`. Los sets se registran normalmente en `set_logs` con el `exercise_id` del sustituto si aplica.

### 5.4 Row Level Security

```sql
ALTER TABLE workout_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_metrics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_sessions" ON workout_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_set_logs" ON set_logs
  FOR ALL USING (
    session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "own_metrics" ON weekly_metrics
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "own_routines" ON routines
  FOR ALL USING (user_id = auth.uid());

-- Catálogo de ejercicios: lectura pública, escritura solo para ejercicios custom propios
CREATE POLICY "exercises_read"         ON exercises FOR SELECT USING (true);
CREATE POLICY "exercises_write_custom" ON exercises FOR INSERT
  WITH CHECK (is_custom = true);
```

---

## 6. Modelo de Rutina y Registro de Series

Esta sección describe el modelo mental del sistema — cómo se relacionan rutina, día, ejercicio y serie — porque es el corazón de la app.

### 6.1 Estructura de una rutina

Una rutina tiene **días** y cada día tiene **ejercicios**. Cada ejercicio del día define un número fijo de series y un rango de repeticiones (no un número fijo):

```
Rutina: "BTS Semana 12 — PPL"
│
├── Día 1: Push - Strength
│   ├── 45° Incline Barbell Press  →  4 series  ·  8–10 reps  ·  3 min descanso
│   ├── DB Lateral Raise           →  3 series  ·  12–15 reps ·  1.5 min
│   └── Overhead Cable Triceps     →  3 series  ·  10–12 reps ·  1.5 min
│
├── Día 2: Pull - Strength
│   ├── Wide-Grip Pull-Up          →  3 series  ·  8–10 reps  ·  3 min
│   └── ...
│
└── Día 3: Legs - Strength
    └── ...
```

**Clave:** `target_sets` es un entero fijo (ej: 4). `target_reps_min` y `target_reps_max` definen el rango (ej: 8 y 10). El usuario puede hacer 8, 9 o 10 reps en cada serie — lo que importa es registrar el número real de reps y el peso real, no forzar un número específico.

### 6.2 Cómo se registra una serie

En la sesión activa, el usuario ve el ejercicio actual y sus series una por una. Cada serie tiene:

- **Número de serie** (1, 2, 3, 4): fijo según `target_sets`
- **Peso:** input numérico editable con toggle de unidad (kg ↔ lb)
- **Reps:** input numérico editable (entero positivo)
- **RPE:** slider de 6.0 a 10.0 en pasos de 0.5

Cada serie se registra como una fila independiente en `set_logs`. Las series no están vinculadas entre sí en la DB — el número de serie (`set_number`) es el que establece el orden.

### 6.3 Conversión de unidades por serie

La unidad de la DB es siempre **kilogramos**. La UI permite trabajar en lb o kg.

**Flujo de conversión:**

```
Usuario escribe: 225  →  unidad activa: lb
    ↓
UI calcula y muestra: "≈ 102.1 kg" en tiempo real (no se espera al submit)
    ↓
Al registrar el set → Server Action convierte:
    weight_kg = 225 * 0.453592 = 102.058 → se trunca a numeric(6,3) = 102.058
    ↓
DB guarda: weight_kg = 102.058
    ↓
Al mostrar el historial → si unit_pref = 'lb': 102.058 * 2.20462 = 225.0 lb
```

**Comportamiento de la unidad durante la sesión:**

- La unidad activa se inicializa desde `user_profiles.unit_pref`.
- El usuario puede cambiarla por sesión con un toggle visible junto al campo de peso.
- El cambio persiste para todos los sets del resto de la sesión (no es necesario volver a cambiar en cada set).
- El toggle no cambia `user_profiles.unit_pref` — eso se hace solo desde el perfil.

**Lógica de conversión:**

```ts
// utils/units.ts
export const LB_TO_KG = 0.453592;
export const KG_TO_LB = 2.20462;

// Redondear al paso de mancuerna más cercano
export function toKg(lbs: number, step = 0.5): number {
  return Math.round((lbs * LB_TO_KG) / step) * step;
}

export function toLbs(kg: number, step = 2.5): number {
  return Math.round((kg * KG_TO_LB) / step) * step;
}

// Conversión exacta para la DB (sin redondear)
export function toKgExact(lbs: number): number {
  return lbs * LB_TO_KG;
}
```

### 6.4 Referencia de la sesión anterior por serie

Esta es una de las funcionalidades más importantes para la experiencia de entrenamiento. Cuando el usuario está registrando el **Set 2** del "Incline Barbell Press" de hoy, necesita saber qué peso usó en el **Set 2** la última vez que hizo este ejercicio en este mismo tipo de día.

**Por qué es importante:**
- Sirve como guía para decidir si subir carga, mantenerla o bajarla.
- Hace visible el progreso o la regresión de forma inmediata.
- Evita que el usuario empiece demasiado ligero o demasiado pesado.

**Query para obtener la referencia:**

```ts
// modules/sessions/queries.ts
export async function getLastSetsByExercise(params: {
  userId: string;
  exerciseId: string;
  routineDayId: string;
  supabase: SupabaseClient;
}): Promise<PreviousSetReference[]> {
  // Buscar la sesión completada más reciente para este ejercicio en este día de rutina
  const { data } = await params.supabase
    .from('set_logs')
    .select(`
      set_number,
      weight_kg,
      reps,
      rpe,
      workout_sessions!inner (
        session_date,
        routine_day_id,
        completed
      )
    `)
    .eq('exercise_id', params.exerciseId)
    .eq('workout_sessions.user_id', params.userId)
    .eq('workout_sessions.routine_day_id', params.routineDayId)
    .eq('workout_sessions.completed', true)
    .order('workout_sessions.session_date', { ascending: false })
    .order('set_number', { ascending: true })
    .limit(20); // traer más de los necesarios y filtrar en app

  if (!data?.length) return [];

  // Tomar solo los sets de la sesión más reciente
  const mostRecentDate = data[0].workout_sessions.session_date;
  return data
    .filter(s => s.workout_sessions.session_date === mostRecentDate)
    .map(s => ({
      set_number: s.set_number,
      weight_kg:  s.weight_kg,
      reps:       s.reps,
      rpe:        s.rpe,
      session_date: mostRecentDate,
    }));
}

// Tipo resultante
type PreviousSetReference = {
  set_number:   number;
  weight_kg:    number;
  reps:         number;
  rpe:          number;
  session_date: string;
};
```

**Dónde se muestra:**

Para cada serie, antes de que el usuario introduzca su peso, se muestra la referencia de la misma serie numerada de la sesión anterior:

```
Set 1  →  "Anterior (12 jun): 80 kg × 8 reps · RPE 7.5"
           [─── 80 kg ───] [─── 8 ───] [RPE ───●─── 8.5]

Set 2  →  "Anterior (12 jun): 80 kg × 9 reps · RPE 8.0"
           [─── 80 kg ───] [─── 9 ───] [RPE ──────●── 9]

Set 3  →  "Anterior (12 jun): 80 kg × 8 reps · RPE 8.5"
           ...
```

**Pre-relleno del campo de peso:**

El campo de peso se pre-rellena con el peso de la misma serie de la sesión anterior. El usuario puede editarlo. Si no hay sesión anterior para este ejercicio, el campo empieza vacío.

**Cuando la serie no existe en el historial:**

Si la rutina ahora tiene 4 series pero la última vez se hicieron solo 3, la Serie 4 no muestra referencia — el campo aparece vacío con el placeholder "— Sin referencia previa".

**Referencia en lb si el usuario trabaja en lb:**

La referencia siempre se muestra en la unidad activa de la sesión. Si el toggle está en lb, la referencia de "80 kg" se muestra como "176 lb".

```ts
// utils/units.ts
export function formatWeightForDisplay(
  weightKg: number,
  unit: 'kg' | 'lb',
  options?: { round?: boolean }
): string {
  if (unit === 'kg') return `${weightKg} kg`;
  const lbs = options?.round ? toLbs(weightKg) : weightKg * KG_TO_LB;
  return `${Math.round(lbs * 4) / 4} lb`;  // redondear al 0.25 lb más cercano
}
```

---

## 7. Sistema de Filtros de Tiempo

Los filtros de analítica viven en la URL con `nuqs`. Estado persistente entre navegaciones.

### 7.1 Períodos disponibles

| Código | Etiqueta | Descripción |
|---|---|---|
| `4w` | 4 Semanas | Tendencias inmediatas |
| `3m` | 3 Meses | **Default** — balance entre detalle y visión media |
| `6m` | 6 Meses | Comparar bloques de entrenamiento |
| `1y` | 1 Año | Progresión anual, cambios de fase |
| `all` | Todo | Histórico completo |

### 7.2 Traducción a fecha SQL

```ts
// utils/date-filters.ts
export function periodToStartDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case '4w':  return subWeeks(now, 4);
    case '3m':  return subMonths(now, 3);
    case '6m':  return subMonths(now, 6);
    case '1y':  return subYears(now, 1);
    case 'all': return null;
    default:    return subMonths(now, 3);
  }
}
```

### 7.3 Combinación de filtros

```
?period=3m&muscle=pierna&status=plateaued
→ Ejercicios de pierna · últimos 3 meses · estado estancado
```

Filtros disponibles:

```
period: '4w' | '3m' | '6m' | '1y' | 'all'
muscle: 'all' | 'pecho' | 'espalda' | 'hombros' | 'biceps' | 'triceps'
        'cuadriceps' | 'isquios' | 'gluteos' | 'pantorrillas' | 'core'
status: 'all' | 'progressing' | 'slow' | 'plateaued' | 'regressing'
sort:   'name' | '1rm_change' | 'volume_change' | 'last_trained'
```

---

## 8. Métricas y Cálculos

Todas las funciones viven en `utils/math.ts`. Funciones puras, sin side effects, testeables con Vitest.

### 8.1 1RM Estimado (Epley)

```ts
// La métrica clave: compara progresión independientemente del esquema de reps
export function estimatedOneRepMax(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}
```

**¿Por qué Epley?** Para el rango de hipertrofia (6–15 reps) da resultados consistentes. Para reps > 15, la comparación se hace por volumen.

**Ejemplo:**
- Semana 1: 80 kg × 8 reps → 1RM = 101.3 kg
- Semana 4: 82.5 kg × 10 reps → 1RM = 110.0 kg → **+8.6%** de progresión real

### 8.2 Volumen Total

```ts
// Volumen = Σ (Reps × Carga). Cada serie se registra individualmente.
export function calculateVolume(sets: { reps: number; weight_kg: number }[]): number {
  return sets.reduce((acc, s) => acc + s.reps * s.weight_kg, 0);
}

// Volumen agrupado por músculo (para gráfica de volumen semanal)
export function volumeByMuscleGroup(
  sets: { reps: number; weight_kg: number; muscle_group: string }[]
): Record<string, number> {
  return sets.reduce((acc, s) => {
    acc[s.muscle_group] = (acc[s.muscle_group] ?? 0) + s.reps * s.weight_kg;
    return acc;
  }, {} as Record<string, number>);
}
```

### 8.3 Proyección de Peso Corporal

```ts
export function generateWeightProjection(params: {
  startDate: Date;
  startWeightKg: number;
  weeklyChangeKg: number;  // + volumen | - definición | 0 recomp
  weeksToProject: number;
}) {
  return Array.from({ length: params.weeksToProject }, (_, i) => ({
    date:       addWeeks(params.startDate, i),
    projected:  params.startWeightKg + params.weeklyChangeKg * i,
    upper_band: params.startWeightKg + (params.weeklyChangeKg + Math.abs(params.weeklyChangeKg) * 0.3) * i,
    lower_band: params.startWeightKg + (params.weeklyChangeKg - Math.abs(params.weeklyChangeKg) * 0.3) * i,
  }));
}
```

La banda de tolerancia es ±30% del objetivo semanal. Si el objetivo es +0.25 kg/semana, la zona "en rango" va de +0.175 a +0.325 kg/semana.

### 8.4 Detección de Meseta

```ts
export type PlateauStatus = 'progressing' | 'slow' | 'plateaued' | 'regressing';

export function detectPlateau(
  history: { estimated_1rm: number; avg_rpe: number }[],
  windowWeeks = 3
): PlateauStatus {
  if (history.length < windowWeeks) return 'progressing';

  const recent  = history.slice(-windowWeeks);
  const first   = recent[0].estimated_1rm;
  const last    = recent.at(-1)!.estimated_1rm;
  const avgRpe  = recent.reduce((a, b) => a + b.avg_rpe, 0) / recent.length;
  const pct     = ((last - first) / first) * 100;

  if (pct < -1)                   return 'regressing';  // bajó más del 1%
  if (pct < 1.5 && avgRpe >= 8.5) return 'plateaued';   // sin progresión + esfuerzo alto
  if (pct < 1.5 && avgRpe < 8.5)  return 'slow';        // sin progresión pero hay margen
  return 'progressing';
}
```

**La lógica del RPE:** Si el 1RM no sube pero el RPE está en 6–7, no es meseta real — hay margen de carga. Si el RPE está en 9–10 y la carga igual no sube, eso sí es estancamiento real.

### 8.5 Promedio Móvil de Peso

```ts
// Suaviza ruido semanal (retención de agua, digestión, ciclo hormonal)
export function movingAverage(
  data: { date: Date; weight_kg: number }[],
  windowSize = 4
): { date: Date; avg: number }[] {
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - windowSize + 1), i + 1);
    return {
      date: data[i].date,
      avg:  slice.reduce((a, b) => a + b.weight_kg, 0) / slice.length,
    };
  });
}
```

### 8.6 Tasa de Adherencia

```ts
export function adherenceRate(planned: number, completed: number): number {
  if (planned === 0) return 0;
  return Math.round((Math.min(completed, planned) / planned) * 100);
}
```

---

## 9. Funcionalidades Completas

Esta es la lista definitiva de funcionalidades de Veyra. No hay MVP ni fases — es el sistema completo.

### Autenticación y Perfil
- [ ] Login con Google OAuth o magic link (Supabase Auth)
- [ ] Perfil: fase actual (volumen / definición / recomposición)
- [ ] Perfil: objetivo de cambio de peso semanal (kg/semana)
- [ ] Perfil: unidad de peso preferida (kg / lb) — preferencia visual, DB siempre kg
- [ ] Perfil: historial de cambios de fase con fecha y anotación

### Catálogo de Ejercicios
- [ ] Catálogo predefinido de ejercicios con nombre, grupo muscular y patrón de movimiento
- [ ] Opción de crear ejercicios custom
- [ ] Sustituciones predefinidas por ejercicio (M:N)
- [ ] Link a video de demostración por ejercicio

### Gestión de Rutinas
- [ ] Crear, editar, archivar y duplicar rutinas
- [ ] Múltiples rutinas por usuario; una activa en cada momento
- [ ] Días de rutina: label, tipo de split, marcador de día de descanso
- [ ] Ejercicios por día: número fijo de series, rango de reps (min–max), descanso en min:seg, RPE objetivo por tipo de set, notas de técnica
- [ ] Reordenar ejercicios dentro de un día con drag-and-drop
- [ ] Edición inline de sets / reps / descanso por ejercicio (auto-save con debounce)

### Sesión de Entrenamiento
- [ ] Seleccionar día de rutina para entrenar hoy
- [ ] Overrides pre-sesión: cambiar sets, reps, descanso o sustituir ejercicio sin tocar el template
- [ ] Registro serie por serie con: peso (kg o lb), reps, RPE
- [ ] Toggle de unidad (kg ↔ lb) por sesión, con conversión visual en tiempo real
- [ ] Referencia de la sesión anterior por número de serie (ver sección 6.4)
- [ ] Pre-relleno del campo de peso con el peso de la misma serie de la sesión anterior
- [ ] Optimistic UI: el set aparece en pantalla antes de la confirmación de la DB
- [ ] Borrador de sesión persistente (`completed: false`) — recuperable si se cierra la app
- [ ] Notas por sesión y notas por serie
- [ ] Navegación entre ejercicios con swipe horizontal (mobile) o flechas (desktop)

### Seguimiento de Peso Corporal
- [ ] Registro semanal de peso corporal
- [ ] Notas por registro
- [ ] Visualización del peso real vs proyección de la fase actual
- [ ] Banda de tolerancia ±30% alrededor de la proyección
- [ ] Promedio móvil de 4 semanas para suavizar fluctuaciones
- [ ] Marcadores de cambio de fase en la gráfica

### Analítica de Cargas
- [ ] Tabla de progresión: todos los ejercicios con 1RM estimado, cambio vs período anterior, volumen acumulado, último entrenado, estado de meseta
- [ ] Filtros: período (4S / 3M / 6M / 1A / Todo) + grupo muscular + estado de meseta
- [ ] Ordenamiento por cualquier columna
- [ ] Gráfica de 1RM estimado por ejercicio: hasta 3 ejercicios simultáneos, línea de cambio de fase, puntos de sustitución
- [ ] Gráfica de volumen semanal por grupo muscular (stacked bar)
- [ ] Scatter plot RPE × carga por ejercicio (tamaño del punto = reps, color = RPE)
- [ ] Detección de meseta automática con estado: Progresando / Lento / Estancado / Regresando

### Adherencia
- [ ] Heatmap de calendario de entrenamientos completados (intensidad = volumen)
- [ ] Porcentaje de adherencia en el período seleccionado
- [ ] Racha actual y racha máxima

### Exportación y PWA
- [ ] Exportar todos los datos en CSV (set_logs + weekly_metrics)
- [ ] Exportar todos los datos en JSON
- [ ] PWA con service worker para instalación en celular

---

## 10. Flujo de Sesión: Registro en Vivo

### 10.1 Paso 1 — Seleccionar día

El usuario ve los días de la rutina activa como cards. Cada card muestra el label del día, el tipo de split y cuándo fue entrenado por última vez. Puede seleccionar cualquier día sin necesidad de seguir el orden.

### 10.2 Paso 2 — Confirmar y aplicar overrides pre-sesión

Antes de iniciar, el usuario ve la lista de ejercicios del día con sus parámetros del template:

```
[1] 45° Incline Barbell Press
    Sets: 4  ·  Reps: 8–10  ·  Descanso: 3:00
    [Sustituir]

[2] DB Lateral Raise
    Sets: 3  ·  Reps: 12–15  ·  Descanso: 1:30
    [Sustituir]
```

Cada campo (Sets / Reps min / Reps max / Descanso) es editable inline. Los cambios van al JSONB `session_config`, no al template. El botón "Sustituir" abre el picker de sustituciones para ese ejercicio.

Al tocar "Iniciar Entrenamiento" → `startSession()` crea la sesión con `completed: false`.

### 10.3 Paso 3 — Registro serie por serie

Para cada ejercicio el usuario ve:

```
45° Incline Barbell Press
"Pausa de 1 segundo en la posición inferior"
Objetivo: 4 series · 8–10 reps · Descanso 3:00

Serie 1   Anterior (12 jun): 80 kg × 8 · RPE 7.5
┌──────────────────────────────────────────────────────┐
│  [−] [ 80 kg ] [+]     [−] [ 8 ] [+]    [ kg | lb ] │
│  ──────────────[●]──── RPE 8.5                       │
│              [+ Registrar Serie]                     │
└──────────────────────────────────────────────────────┘

Serie 1  ✓  80 kg × 8 reps  ·  RPE 7.5

Serie 2   Anterior (12 jun): 80 kg × 9 · RPE 8.0
┌──────────────────────────────────────────────────────┐
│  [−] [ 80 kg ] [+]     [−] [ 9 ] [+]    [ kg | lb ] │
│  ────────────────[●]── RPE 8.0                       │
│              [+ Registrar Serie]                     │
└──────────────────────────────────────────────────────┘
```

**Comportamiento detallado del registro:**

1. El campo de peso se pre-rellena con el peso de la misma serie en la sesión anterior (si existe).
2. El toggle `[ kg | lb ]` aplica a toda la sesión. Al cambiarlo, el campo de peso convierte el valor en tiempo real sin esperar al submit.
3. Al tocar `[+ Registrar Serie]`:
   - Se muestra inmediatamente como fila completada (optimistic UI).
   - Se llama a `logSet()` → convierte a kg → inserta en `set_logs`.
4. La serie siguiente aparece con su propia referencia anterior y el peso pre-rellenado.
5. El campo de reps no se pre-rellena — el usuario decide cuántas hizo.
6. Al completar todas las series del ejercicio, el usuario puede navegar al siguiente.

**Referencia cuando no hay historial:**

```
Serie 1   Sin referencia previa
┌──────────────────────────────────────────────────────┐
│  [−] [       ] [+]     [−] [  ] [+]   [ kg | lb ]   │
│  ──────●────────────── RPE 7.0                       │
│              [+ Registrar Serie]                     │
└──────────────────────────────────────────────────────┘
```

**Cuando el ejercicio tiene sustitución activa en esta sesión:**

La referencia muestra los datos del **ejercicio sustituto** si hay historial previo del sustituto en este día de rutina. Si no hay historial del sustituto pero sí del original, se muestra el del original con una nota "(ejercicio original)".

### 10.4 Finalizar sesión

Al completar el último set del último ejercicio → botón "Finalizar Entrenamiento" → `completeSession()` → `completed: true`.

Se muestra un resumen de la sesión:
- Tiempo total
- Volumen total (kg·reps)
- Número de series completadas
- Comparación de 1RM estimado vs sesión anterior por ejercicio

---

## 11. Gestión de Rutinas

### 11.1 Lista de rutinas (`/routines`)

- Cards por rutina: nombre, descripción, número de días, última sesión usada.
- Badge "Activa" en la rutina con `active_routine_id` activo.
- Acciones: Activar · Editar · Duplicar · Archivar.
- La rutina archivada no aparece en el selector de sesión pero sí en el historial.

### 11.2 Editor de rutina (`/routines/[routineId]`)

```
Rutina: "PPL — Volumen"
Días:  [Push - Fuerza] [Pull - Fuerza] [Legs] [Push - Hiper] [Pull - Hiper] [Legs]

Día activo: Push - Fuerza

Ejercicio                Sets  Reps     Descanso    RPE (Early/Last)
☰ 45° Incline BB Press    4    8–10     3:00        8 / fallo
☰ DB Lateral Raise        3    12–15    1:30        8 / 9
☰ Overhead Cable Triceps  3    10–12    1:30        8 / fallo
+ Agregar ejercicio
```

- Cada campo es editable inline sin modal. Guardado con debounce de 500ms.
- `☰` activa el drag-and-drop para reordenar (long-press en mobile, drag directo en desktop).
- `[···]` por ejercicio → Ver sustitutos · Eliminar.
- Descanso: input de minutos y segundos, o presets rápidos (1:00 / 1:30 / 2:00 / 3:00 / 5:00).

### 11.3 Duplicar rutina

```
duplicateRoutine(sourceRoutineId)
  → INSERT routines (name: "Copia de X")
  → Para cada routine_day: INSERT con nuevo routine_id
  → Para cada routine_exercise de esos días: INSERT con los nuevos day ids
  → redirect('/routines/[newRoutineId]')
```

Útil para ajustar la semana 12 a partir de la semana 11 sin perder el historial de la original.

### 11.4 Cambio de rutina activa

```
switchActiveRoutine(routineId)
  → UPDATE user_profiles SET active_routine_id = routineId
  → Las sesiones anteriores mantienen su routine_id original
  → En /session, la nueva rutina activa aparece por defecto
```

---

## 12. Analítica y Gráficas

Todas las gráficas usan **Recharts**. El sistema de filtros de tiempo (sección 7) aplica a todas.

### 12.1 Tabla de progresión por ejercicio

Vista central de analítica. Filtrable y ordenable. En mobile colapsa a cards individuales por ejercicio.

| Columna | Descripción |
|---|---|
| Ejercicio | Nombre, link al detalle del ejercicio |
| Músculo | Grupo muscular |
| Mejor 1RM | 1RM estimado más alto en el período seleccionado |
| Cambio | % vs mismo período anterior (con indicador de dirección) |
| Volumen | kg·reps totales en el período |
| Último entrenado | Fecha relativa ("Hace 3 días") |
| Estado | Progresando / Lento / Estancado / Regresando |

Ordenamiento por click en header. Default: "Cambio" descendente.

### 12.2 Gráfica de 1RM estimado (Line Chart)

- Hasta 3 ejercicios simultáneos seleccionables desde un dropdown.
- Eje X: semanas. Eje Y: 1RM en la unidad preferida del usuario.
- Tooltip: fecha · 1RM estimado · carga real × reps del mejor set.
- Punto especial cuando hubo sustitución de ejercicio en esa sesión.
- Línea vertical en cada cambio de fase.

```sql
SELECT
  date_trunc('week', ws.session_date) AS week,
  sl.exercise_id,
  MAX(sl.weight_kg * (1 + sl.reps / 30.0)) AS estimated_1rm
FROM set_logs sl
JOIN workout_sessions ws ON sl.session_id = ws.id
WHERE ws.user_id = $1
  AND sl.exercise_id = ANY($2)
  AND ws.session_date >= $3
  AND ws.completed = true
GROUP BY week, sl.exercise_id
ORDER BY week;
```

### 12.3 Gráfica de peso corporal vs proyección (Composite Chart)

- Línea de peso real semanal.
- Línea de proyección ideal desde `phase_start_date`.
- Banda de tolerancia ±30% como área rellena.
- Puntos coloreados según si están dentro o fuera de la banda.
- Línea vertical en cada cambio de fase.

### 12.4 Tendencia de peso — promedio móvil (Line Chart)

- Línea del peso real semana a semana (con ruido).
- Línea del promedio móvil de 4 semanas (tendencia real).

### 12.5 Volumen semanal por grupo muscular (Stacked Bar)

- Eje X: semanas. Eje Y: volumen total (kg·reps).
- Una barra apilada por grupo muscular, cada uno con su color.
- Útil para detectar grupos musculares descuidados o caídas de volumen.

### 12.6 Scatter plot RPE × carga (detalle de ejercicio)

- Cada punto = una serie registrada en el período.
- Eje X: fecha. Eje Y: carga.
- Tamaño del punto proporcional a las reps.
- Color del punto: gradiente según RPE (positivo → negativo).
- Línea de tendencia: 1RM estimado del mejor set por sesión.
- Detecta visualmente si el RPE sube sin que suba la carga (fatiga acumulada).

### 12.7 Heatmap de adherencia (Calendar Heatmap)

- Librería: `react-activity-calendar`.
- Un cuadrito por día del año; coloreado si hubo sesión completada.
- Intensidad proporcional al volumen de la sesión.
- Tooltip: fecha · grupos musculares entrenados · volumen total.
- Stats debajo: % de adherencia en el período · racha actual · racha máxima.

---

## 13. Lógica de Negocio

### 13.1 Flujo completo de una sesión

```
"Iniciar Entrenamiento" (día X, rutina activa)
    ↓
startSession()
  → INSERT workout_sessions (completed: false, session_config: overrides del paso 2)
  → Retorna session_id
    ↓
Por cada serie:
logSet(sessionId, exerciseId, { weight, unit, reps, rpe, setNumber })
  → Zod valida: weight > 0, reps > 0 y ≤ 100, rpe entre 6 y 10
  → Verifica ownership de la sesión
  → Si unit === 'lb': weight_kg = weight * 0.453592 (sin redondear)
  → INSERT set_logs
  → revalidatePath('/session/[sessionId]')
    ↓
"Finalizar Entrenamiento"
completeSession(sessionId)
  → UPDATE workout_sessions SET completed = true
  → revalidatePath('/dashboard')
  → Calcular y mostrar resumen de sesión
```

### 13.2 Cambio de fase

```
updatePhase({ phase, weeklyChangeKg, note? })
  → Leer weekly_metrics más reciente → nuevo starting_weight_kg
  → INSERT phase_history (user_id, phase, start_date, starting_weight_kg, note)
  → UPDATE user_profiles SET
      current_phase = phase,
      target_weekly_change_kg = weeklyChangeKg,
      phase_start_date = TODAY,
      starting_weight_kg = <último peso>
    ↓
En /body-weight:
  → La proyección reinicia desde la nueva phase_start_date
  → Los datos históricos NO se borran
  → Se añade marcador de cambio de fase en la gráfica
```

### 13.3 Historial de fases

Se requiere una tabla adicional para guardar el historial de cambios de fase con anotaciones:

```sql
phase_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users,
  phase            text NOT NULL,
  start_date       date NOT NULL,
  starting_weight_kg numeric(5,2),
  target_weekly_change_kg numeric(4,3),
  note             text,
  created_at       timestamptz DEFAULT now()
)
```

Esta tabla alimenta los marcadores de cambio de fase en todas las gráficas.

### 13.4 Duplicar rutina

```
duplicateRoutine(sourceRoutineId)
  → Verificar ownership
  → INSERT routines (name: "Copia de [nombre]", user_id, ...)
  → Para cada routine_day: INSERT con nuevo routine_id
  → Para cada routine_exercise de esos días: INSERT con los nuevos day ids
  → Retorna el nuevo routineId
  → redirect('/routines/[newRoutineId]')
```

---

## 14. Estructura de la Aplicación

```
src/

├── app/                              # Next.js App Router — solo rutas y layouts
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   └── (app)/
│       ├── layout.tsx                # Sidebar (desktop) / Bottom nav (mobile)
│       ├── dashboard/page.tsx
│       ├── session/
│       │   ├── page.tsx              # Selector de día de rutina
│       │   └── [sessionId]/page.tsx  # Registro en vivo (fullscreen mobile)
│       ├── body-weight/page.tsx
│       ├── analytics/
│       │   ├── page.tsx              # Tabla de progresión con filtros
│       │   └── [exerciseId]/page.tsx # Detalle de ejercicio + scatter plot
│       ├── routines/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [routineId]/page.tsx  # Editor de rutina
│       └── profile/page.tsx

├── modules/                          # Vertical slices por dominio funcional
│   ├── auth/
│   │   ├── actions/update-phase.ts
│   │   └── types.ts
│   ├── exercises/
│   │   ├── queries.ts
│   │   └── types.ts
│   ├── routines/
│   │   ├── actions/
│   │   │   ├── upsert-routine-exercise.ts
│   │   │   ├── duplicate-routine.ts
│   │   │   └── switch-active-routine.ts
│   │   ├── components/
│   │   ├── queries.ts
│   │   └── types.ts
│   ├── sessions/
│   │   ├── actions/
│   │   │   ├── start-session.ts
│   │   │   ├── log-set.ts            # Convierte unidades, valida, inserta
│   │   │   ├── complete-session.ts
│   │   │   └── apply-session-override.ts
│   │   ├── components/
│   │   ├── queries.ts                # getLastSetsByExercise y otras lecturas
│   │   └── types.ts
│   ├── analytics/
│   │   ├── components/               # Recharts wrappers
│   │   ├── queries.ts
│   │   └── selectors.ts              # Transforman datos DB → series para charts
│   └── body-weight/
│       ├── actions/log-body-weight.ts
│       └── queries.ts

├── shared/
│   ├── ui/                           # Primitivos: Button, Card, Badge, Input, etc.
│   ├── hooks/
│   └── utils/
│       ├── math.ts                   # 1RM, volumen, proyección, plateau, moving avg
│       ├── units.ts                  # toKg, toLbs, formatWeightForDisplay
│       └── date-filters.ts           # periodToStartDate

├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Cliente browser
│   │   └── server.ts                 # Cliente Server Actions
│   └── drizzle/

└── drizzle/                          # Schema y migrations SQL
    ├── schema.ts
    └── migrations/
```

---

## 15. Principios de Ingeniería

### Mobile-first — gym mode primero

La pantalla de sesión activa es la superficie más crítica. La posición de los inputs y el botón de registro están diseñados para uso con una mano. Ver `DESIGN.md §Layout > Thumb zone` para la especificación visual de posicionamiento.

### No sobre-ingenierizar

| Anti-patrón | Decisión en Veyra |
|---|---|
| Redux / Zustand para estado global | Server Components + `useOptimistic` para sets |
| tRPC o GraphQL | Server Actions directas |
| Tabla separada para overrides de sesión | JSONB en `workout_sessions.session_config` |
| Temporizadores de descanso activos | Texto estático "Descanso: 3:00" — el usuario usa su reloj |
| Tabla separada para historial de unidades | La unidad es preferencia visual, la DB siempre guarda kg |
| Re-animación de charts en cada filtro | Animar solo en mount (`animationDuration: 600`), luego off |

### KISS en el gym

La pantalla de registro tiene un solo trabajo: capturar sets rápido. No hay configuración mid-sesión. La referencia de la sesión anterior es el único dato extra que se muestra — y está ahí porque tiene valor directo en la toma de decisiones del usuario.

### DRY en los cálculos

`utils/math.ts` y `utils/units.ts` son las únicas fuentes de verdad para todos los cálculos. Server Actions y componentes de charts importan de ahí. Nunca se duplica la lógica de conversión o de 1RM.

### Type safety end-to-end

```bash
# Después de cada migración de Drizzle
npx supabase gen types typescript --project-id <id> > types/database.ts
```

Zod valida todo input en Server Actions antes de llegar a la DB. Si el schema cambia, TypeScript lo detecta en compile time.

### Design tokens como contrato

`DESIGN.md` es el único lugar donde viven los valores de color, espaciado, tipografía y radios. Los componentes de `shared/ui/` implementan los tokens como variables CSS. Ningún componente tiene valores visuales hardcodeados.

---

## 16. Arquitectura de Módulos

### Monolito modular

Un deploy en Vercel, una DB en Supabase, una app Next.js. Organización por dominio (vertical slices) en `src/modules/`.

### Server Actions = capa de aplicación

Validan (Zod), verifican ownership, llaman a services/queries, revalidan caché, retornan DTOs tipados. Nunca la UI llama directamente a Supabase.

### Separación lectura / escritura

Dentro de cada módulo: `queries.ts` para lectura, `commands.ts` para escritura, `service.ts` como fachada si se necesita orquestación de ambas.

### Estrategia de caché (Next.js 15)

- `dynamic = 'force-dynamic'` en la página de sesión activa (datos en tiempo real).
- Analytics y dashboard: cacheable con `revalidateTag`.
- Tags de caché: `user:<id>:sessions`, `user:<id>:analytics`, `user:<id>:body-weight`.
- Tras `logSet`: `revalidateTag('user:<id>:sessions')` y diferido `revalidateTag('user:<id>:analytics')`.

### Testing

- Unit: Vitest para `utils/math.ts`, `utils/units.ts`, y servicios puros.
- Integration: Server Actions con mock de Supabase/Drizzle.
- E2E: Playwright para el flujo completo de sesión en viewport de 375px (mobile).

---

## Apéndice — Decisiones de Arquitectura

**¿Por qué no temporizadores de descanso?**  
Los temporizadores requieren estado persistente entre renders y acceso a web workers o notificaciones del sistema operativo. El valor agregado es marginal — el usuario puede ver "Descanso: 3:00" y usar su reloj. La complejidad no justifica el beneficio.

**¿Por qué la referencia de sesión anterior usa `routine_day_id` y no solo `exercise_id`?**  
El mismo ejercicio puede aparecer en días distintos con cargas distintas (ejemplo: sentadilla en día de fuerza con 3×5 y en día de hipertrofia con 4×10). Filtrar por `routine_day_id` garantiza que la referencia mostrada corresponde al mismo contexto de entrenamiento.

**¿Qué pasa si el usuario entrena el mismo ejercicio con otra rutina?**  
Si cambia de rutina activa, la nueva sesión tiene un `routine_day_id` diferente. La referencia no encontrará historial de la nueva rutina y mostrará "Sin referencia previa" hasta que complete la primera sesión con ella.

**¿Por qué JSONB para los overrides y no una tabla separada?**  
Los overrides solo se leen cuando se carga una sesión específica. Nunca se filtran ni agregan en queries de analítica. JSONB los trae en la misma query que la sesión sin joins adicionales.

**¿Por qué duplicar la rutina en lugar de versionar?**  
El versionado añade complejidad de modelo (FK a versión, queries con `version_id`) sin valor práctico. El usuario quiere "la semana 12 pero con este cambio" — duplicar es más intuitivo y el historial de sesiones siempre apunta a la rutina correcta por su `routine_id`.

**¿Cómo comparar el ejercicio original con su sustituto en la gráfica de 1RM?**  
El dropdown de selección de la gráfica acepta hasta 3 ejercicios. El usuario selecciona tanto el original como el sustituto y ve las dos curvas superpuestas.
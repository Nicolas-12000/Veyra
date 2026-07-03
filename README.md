# Veyra

Veyra es un tracker de entrenamiento mobile-first y dark-first, pensado para llevar rutinas, sesiones, peso corporal y analítica de progreso sin fricción en el gimnasio.

## Qué incluye

- Autenticación con Supabase.
- Rutinas con días, ejercicios y sustituciones.
- Registro de sesiones y sets.
- Seguimiento de peso corporal y fases.
- Analítica de volumen, 1RM estimado y tendencias.
- Exportación de datos del usuario.

## Stack

- Next.js 16 con App Router.
- React 19.
- Supabase Auth + PostgreSQL.
- Drizzle ORM y Drizzle Kit.
- Tailwind CSS + estilos globales propios.
- Deploy pensado para Vercel.

## Requisitos

- Node.js 20 o superior.
- pnpm.
- Un proyecto de Supabase con Postgres.

## Variables de entorno

Copia [`.env.example`](.env.example) a `.env.local` y completa estas variables:

- `DATABASE_URL`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` si necesitas tareas administrativas

Para tareas programadas o limpieza automática, añade también una clave propia como `CRON_SECRET`.

## Instalación

```bash
pnpm install
```

## Desarrollo local

```bash
pnpm dev
```

Abre `http://localhost:3000`.

## Base de datos

El esquema vive en [drizzle/schema.ts](drizzle/schema.ts). Las migraciones están en [drizzle/migrations](drizzle/migrations).

Generar migraciones:

```bash
pnpm db:generate
```

Aplicar migraciones:

```bash
pnpm db:migrate
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Configura las variables de entorno de producción.
3. Verifica que `DATABASE_URL` apunte al Postgres de Supabase.
4. Añade en Supabase Auth las URLs de producción para login y callback.
5. Despliega.

## Estructura rápida

- [app/](app) contiene rutas, layouts y páginas.
- [src/modules/](src/modules) contiene la lógica de dominio.
- [drizzle/](drizzle) contiene el esquema y las migraciones SQL.
- [lib/](lib) contiene clientes compartidos de Supabase y base de datos.
- [public/](public) contiene assets estáticos.

## Notas

- Las rutinas archivadas no se borran: se ocultan de la vista principal y se pueden restaurar.
- El proyecto usa Supabase como base de datos principal y auth provider.
- La UI está optimizada para móvil y pensada para uso en gimnasio.

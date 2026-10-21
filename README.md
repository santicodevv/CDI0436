# CDI0436 - Sistema de Gestión de Asistencias y Beneficiarios

## 📋 Descripción del Proyecto

CDI0436 es una aplicación web completa para la gestión integral de un Centro de Desarrollo Infantil. Proporciona una solución moderna y escalable construida con tecnologías de punta para optimizar los procesos administrativos, académicos y de seguimiento de beneficiarios.

### ✨ Características Principales

- **Gestión de Asistencias**: Registrar, actualizar y justificar asistencias de forma individual o masiva, con soporte para fotos
- **Administración de Beneficiarios**: Gestión completa con información personal, expedientes, clases y tutor asignado
- **Gestión de Clases**: Crear y administrar clases, asignándolas a horarios y tutores, con control de capacidad
- **Gestión de Horarios**: Definir y organizar bloques horarios por día de la semana
- **Administración de Tutores**: Gestión de tutores y su asignación a clases
- **Gestión de Usuarios**: Control de acceso con roles y permisos granulares
- **Sistema de Roles y Permisos**: RBAC completo con permisos por módulo y acción
- **Módulo de Mérito Escolar**: Registro de notas por período y cálculo de ganadores por ciclo (Primaria/Secundaria)
- **Módulo de Nutrición**: Control de menús diarios por tanda (matutina/vespertina)
- **Módulo de Ayudas**: Gestión de solicitudes de ayuda con comentarios y fotos de entrega, integración WhatsApp
- **Módulo de Supervivencia**: Curso extracurricular con encuentros configurables por mes, asistencia y fotos independientes
- **Sistema de Reportes**: Generación de reportes en Excel y PDF
- **Autenticación Segura**: JWT con soporte para "Recordarme" y cambio de contraseña en primer inicio
- **Validación de Datos**: Validación exhaustiva en cliente y servidor con class-validator y Zod
- **Rate Limiting**: Protección contra abusos con ThrottleGuard in-memory
- **Swagger/OpenAPI**: Documentación automática de la API
- **Importación/Exportación Excel**: Carga masiva de beneficiarios desde archivos Excel

## 🏗️ Arquitectura

El proyecto utiliza una arquitectura de **monorepo** con dos aplicaciones principales:

```
CDI0436/
├── backend/              # NestJS API REST (TypeORM + PostgreSQL)
├── frontend/             # Next.js 16 App Router + Tailwind CSS 4
└── docker-compose.yml    # Orquestación de servicios (PostgreSQL + Backend + Frontend)
```

**Diagrama de Arquitectura:**

```
┌──────────────┐     HTTPS      ┌──────────────┐     TypeORM     ┌────────────┐
│   Frontend   │ ──────────────> │   Backend    │ ──────────────> │ PostgreSQL │
│  Next.js 16  │ <────────────── │  NestJS 11   │ <────────────── │    15      │
│  Tailwind 4  │     JSON/JWT    │  TypeORM     │    SQL/SSL      │            │
└──────────────┘                 └──────────────┘                 └────────────┘
       │                                │
       │ localStorage/                  │ Rate Limiting
       │ sessionStorage                 │ Helmet-like headers
       │ (token + user)                 │ CORS whitelist
```

## 🛠️ Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **NestJS** | ~11.0.1 | Framework Node.js escalable |
| **TypeORM** | ^0.3.28 | ORM para PostgreSQL |
| **PostgreSQL** | 15 | Base de datos relacional |
| **@nestjs/jwt** | ^11.0.2 | JWT signing/verification |
| **Passport.js** | ^0.7.0 | Estrategias de autenticación |
| **passport-jwt** | ^4.0.1 | Estrategia JWT |
| **bcrypt** | ^6.0.0 | Hashing de contraseñas |
| **class-validator** | ^0.14.3 | Validación de DTOs |
| **class-transformer** | ^0.5.1 | Transformación de objetos |
| **@nestjs/swagger** | ^11.2.3 | Documentación OpenAPI |
| **multer** | ^2.0.2 | Subida de archivos |
| **xlsx** | ^0.18.5 | Importación/Exportación Excel |
| **Jest** | ^30.0.0 | Testing |
| **Supertest** | ^7.0.0 | Testing HTTP |

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Next.js** | 16.0.9 | Framework React con SSR |
| **React** | 19.2.1 | Biblioteca de UI |
| **Tailwind CSS** | ^4 | Utilidades CSS |
| **TypeScript** | ^5 | Tipado estático |
| **Axios** | ^1.13.2 | Cliente HTTP con interceptors |
| **Zustand** | ^5.0.9 | Estado global (store) |
| **TanStack React Query** | ^5.90.12 | Datos asíncronos y caché |
| **React Hook Form** | ^7.68.0 | Gestión de formularios |
| **Zod** | ^4.1.13 | Validación de esquemas |
| **date-fns** | ^4.1.0 | Manipulación de fechas |
| **lucide-react** | ^0.560.0 | Iconos SVG |
| **xlsx** | ^0.18.5 | Exportación Excel cliente |
| **jspdf** | ^3.0.4 | Generación PDF |
| **jspdf-autotable** | ^5.0.2 | Tablas en PDF |
| **file-saver** | ^2.0.5 | Descarga de archivos |
| **class-variance-authority** | ^0.7.1 | Variantes de componentes |
| **clsx / tailwind-merge** | - | Utilidades CSS |

### DevOps
| Tecnología | Propósito |
|-----------|-----------|
| **Docker** 20.x+ | Containerización |
| **Docker Compose** 1.29.x+ | Orquestación multi-servicio |
| **PostgreSQL 15 Alpine** | Base de datos en contenedor |

## 📋 Requisitos Previos

### Requisitos Mínimos
- **Node.js**: 18.x o superior (20.x recomendado)
- **npm**: 9.x o superior
- **Docker**: 20.x o superior
- **Docker Compose**: 1.29.x o superior
- **Git**: 2.x o superior

### Requisitos Opcionales
- **PostgreSQL**: 15.x (si ejecutas sin Docker)
- **Visual Studio Code**: Editor recomendado

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd CDI0436
```

### 2. Configurar Variables de Entorno

#### Backend (`backend/.env`)

```env
# ========================================
# BACKEND - Variables de Entorno
# ========================================

# Base de datos PostgreSQL (producción: Neon, desarrollo: local/Docker)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# JWT
JWT_SECRET=tu-clave-secreta-segura-minimo-32-caracteres
JWT_EXPIRES_IN=86400

# Server
PORT=3001
NODE_ENV=development

# CORS - URL del frontend
FRONTEND_URL=http://localhost:3000
```

#### Frontend (`frontend/.env.local`)

```env
# ========================================
# FRONTEND - Variables de Entorno
# ========================================

# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Opción A: Ejecutar con Docker Compose (Recomendado)

```bash
# Iniciar los servicios
docker-compose up -d

# El backend estará disponible en: http://localhost:3001
# El frontend estará disponible en: http://localhost:3000
# Documentación Swagger: http://localhost:3001/apidocs
```

### 4. Opción B: Ejecutar Localmente

#### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno (editar backend/.env)
# Asegúrate de que DATABASE_URL apunte a tu PostgreSQL local o Docker

# Modo desarrollo (con hot-reload)
npm run start:dev

# El servidor estará disponible en http://localhost:3001
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar frontend/.env.local con NEXT_PUBLIC_API_URL

# Ejecutar en modo desarrollo
npm run dev

# El servidor estará disponible en http://localhost:3000
```

## 📦 Scripts Disponibles

### Backend

| Script | Descripción |
|--------|-------------|
| `npm run start` | Inicia la aplicación |
| `npm run start:dev` | Inicia en modo desarrollo con watch |
| `npm run start:debug` | Inicia con debug mode |
| `npm run start:prod` | Inicia en modo producción |
| `npm run build` | Compila el proyecto TypeScript |
| `npm run lint` | Ejecuta linter (ESLint) y corrige errores |
| `npm run format` | Formatea el código con Prettier |
| `npm run test` | Ejecuta pruebas unitarias (Jest) |
| `npm run test:watch` | Ejecuta pruebas en modo watch |
| `npm run test:cov` | Genera reporte de cobertura |
| `npm run test:e2e` | Ejecuta pruebas e2e (Supertest) |
| `npm run test:debug` | Ejecuta pruebas en modo debug |

### Frontend

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (Next.js) |
| `npm run build` | Compila para producción (output standalone) |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta linter (ESLint) |

## 📁 Estructura del Proyecto

```
CDI0436/
├── backend/                          # NestJS API REST
│   ├── src/                          # Código fuente
│   │   ├── app.controller.ts         # Controlador raíz
│   │   ├── app.module.ts             # Módulo raíz (importa todos los módulos)
│   │   ├── app.service.ts            # Servicio raíz
│   │   ├── main.ts                   # Punto de entrada (bootstrap)
│   │   ├── common/                   # Recursos compartidos
│   │   │   ├── filters/              # Filtros de excepción (HttpExceptionFilter)
│   │   │   ├── guards/               # Guards globales (ThrottleGuard)
│   │   │   └── pipes/                # Pipes de validación (ValidationPipe custom)
│   │   ├── modules/                  # Módulos de funcionalidad
│   │   │   ├── asistencias/          # CRUD asistencias, fotos, reportes
│   │   │   ├── auth/                 # Login, JWT, guards, decorators, strategies
│   │   │   ├── ayudas/               # Gestión de ayudas, webhook, WhatsApp
│   │   │   ├── beneficiarios/        # CRUD beneficiarios, expedientes, importación Excel
│   │   │   ├── clases/               # CRUD clases, asignación beneficiarios
│   │   │   ├── horarios/             # CRUD horarios
│   │   │   ├── merito/               # Períodos, notas, cálculo de ganadores
│   │   │   ├── nutricion/            # Menús diarios por tanda
│   │   │   ├── reportes/             # Entidad reporte
│   │   │   ├── roles/                # CRUD roles, permisos, asignación
│   │   │   ├── supervivencias/       # Curso supervivencia, asistencias, fotos
│   │   │   ├── tutores/              # CRUD tutores
│   │   │   └── usuarios/             # CRUD usuarios, cambio/reset password
│   │   └── scripts/                  # Scripts auxiliares
│   │       └── seed-users.ts         # Seed de usuarios iniciales
│   ├── test/                         # Pruebas e2e
│   ├── Dockerfile                    # Docker producción (Node 20 Alpine)
│   ├── Dockerfile.dev                # Docker desarrollo
│   ├── nest-cli.json                 # Configuración NestJS CLI
│   ├── tsconfig.json                 # Configuración TypeScript
│   └── tsconfig.build.json           # Configuración build TypeScript
│
├── frontend/                         # Next.js App Router
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── layout.tsx            # Layout raíz (AuthProvider + Inter font)
│   │   │   ├── page.tsx              # Página de login principal
│   │   │   ├── globals.css           # Estilos globales (Tailwind)
│   │   │   ├── login/                # Página de login alternativa
│   │   │   ├── register/             # Página de registro
│   │   │   ├── dashboard/            # Dashboard protegido
│   │   │   │   ├── layout.tsx        # Layout dashboard (Sidebar + Header)
│   │   │   │   ├── page.tsx          # Dashboard principal
│   │   │   │   ├── asistencias/      # Gestión de asistencias
│   │   │   │   ├── ayudas/           # Gestión de ayudas
│   │   │   │   ├── beneficiarios/    # Gestión de beneficiarios
│   │   │   │   ├── bonos/            # Bonos
│   │   │   │   ├── clases/           # Gestión de clases
│   │   │   │   ├── cumpleanos/       # Cumpleaños del mes
│   │   │   │   ├── horarios/         # Gestión de horarios
│   │   │   │   ├── merito/           # Mérito escolar
│   │   │   │   ├── nutricion/        # Menús de nutrición
│   │   │   │   ├── reportes/         # Reportes
│   │   │   │   ├── roles/            # Roles y permisos
│   │   │   │   ├── supervivencia/    # Curso de supervivencia
│   │   │   │   ├── tutores/          # Gestión de tutores
│   │   │   │   └── usuarios/         # Gestión de usuarios
│   │   ├── components/               # Componentes React reutilizables
│   │   │   ├── asistencias/          # RegistroAsistencia, EstadoBadge, ClaseFechaSelector
│   │   │   ├── auth/                 # ProtectedRoute, PrimerLoginModal
│   │   │   ├── beneficiarios/        # BeneficiarioForm, ImportarExcelModal, etc.
│   │   │   ├── clases/               # Componentes de clases
│   │   │   ├── dashboard/            # StatCard
│   │   │   ├── horarios/             # Componentes de horarios
│   │   │   ├── layout/               # DashboardLayout, Sidebar, Header
│   │   │   ├── reportes/             # Componentes de reportes
│   │   │   ├── supervivencia/        # SupervivenciaForm, AgregarBeneficiariosModal
│   │   │   ├── tutores/              # Componentes de tutores
│   │   │   └── ui/                   # Componentes base (Button, Input, Modal, Table, Select, Alert, Loading)
│   │   ├── contexts/                 # Contextos de React
│   │   │   └── AuthContext.tsx        # Contexto de autenticación con permisos
│   │   └── lib/                      # Utilidades y configuración
│   │       ├── api/                  # Clientes API por módulo
│   │       │   ├── client.ts          # Axios instance con interceptors
│   │       │   ├── auth.ts
│   │       │   ├── asistencias.ts
│   │       │   ├── beneficiarios.ts
│   │       │   ├── clases.ts
│   │       │   ├── tutores.ts
│   │       │   ├── horarios.ts
│   │       │   ├── usuarios.ts
│   │       │   ├── ayudas.ts
│   │       │   ├── supervivencias.ts
│   │       │   ├── nutricion.ts
│   │       │   ├── merito.ts
│   │       │   ├── roles.ts
│   │       │   └── dashboard.ts
│   │       ├── types/                # Tipos TypeScript compartidos
│   │       │   └── index.ts
│   │       └── utils/                # Utilidades
│   │           ├── cn.ts              # clsx + tailwind-merge helper
│   │           ├── exportExcel.ts     # Exportación a Excel
│   │           └── exportPDF.ts       # Exportación a PDF
│   ├── public/                       # Archivos estáticos (logo.svg, etc.)
│   ├── next.config.ts                # Configuración Next.js (standalone output)
│   ├── tailwind.config.ts            # Configuración Tailwind
│   └── tsconfig.json                 # Configuración TypeScript
│
├── docker-compose.yml                # Orquestación PostgreSQL + Backend + Frontend
├── .gitignore
└── README.md
```

## 🔐 Autenticación y Autorización

### Flujo de Autenticación (JWT)

1. El usuario ingresa credenciales (correo + contraseña) en la página de login
2. El backend valida contra la base de datos (bcrypt.compare)
3. El servidor genera un JWT token firmado con `JWT_SECRET` y `JWT_EXPIRES_IN`
4. El cliente almacena el token en `localStorage` (Recordarme activo) o `sessionStorage`
5. En cada solicitud, el interceptor de Axios adjunta el header `Authorization: Bearer <token>`
6. El `JwtAuthGuard` verifica el token, y el `PermisosGuard` verifica permisos específicos
7. Si el token expira o es inválido, el interceptor 401 limpia la sesión y redirige al login

### Estrategia de Almacenamiento de Token

- **Recordarme activo**: Token y usuario en `localStorage` (persiste al cerrar navegador)
- **Recordarme inactivo**: Token y usuario en `sessionStorage` (se borra al cerrar pestaña)
- El correo recordado se guarda en `localStorage` con clave `cdi_correo`

### Sistema de Roles y Permisos (RBAC)

El sistema implementa un control de acceso basado en roles (RBAC) con permisos granulares:

| Componente | Descripción |
|-----------|-------------|
| `RolesService` | CRUD de roles con asignación de permisos |
| `Permiso` entity | Permisos individuales con código, módulo y acción |
| `Rol` entity | Roles con flag `es_super_admin` que otorga todos los permisos |
| `PermisosGuard` | Guard que verifica permisos requeridos por ruta |
| `RequierePermiso()` | Decorador para especificar permisos necesarios |
| `@Public()` | Decorador para rutas públicas (sin autenticación) |
| `@CurrentUser()` | Decorador para obtener usuario autenticado |
| `esSuperAdmin()` | Helper en frontend para verificar super admin |
| `tienePermiso()` | Helper en frontend para verificar permiso específico |

**Roles disponibles:**
- **Super Admin**: Acceso total (`es_super_admin = true`, permisos = `['*']`)
- **Roles personalizados**: Creados dinámicamente con permisos asignables

### Permisos por Módulo

Los permisos se definen con formato `modulo:accion` (ej: `beneficiarios:ver`, `asistencias:crear`). Se agrupan por módulo para su administración.

## 📊 Módulos Principales

### Asistencias
- **Backend**: `src/modules/asistencias/` - CRUD completo, registro masivo, justificación masiva, fotos (base64), reportes por clase/beneficiario/tutor/global/ausencias, estadísticas mensuales
- **Frontend**: `components/asistencias/` - Registro visual con estados (Presente/Ausente/Sin marcar), búsqueda, observaciones
- **Endpoints**: `/asistencias`, `/asistencias/masiva`, `/asistencias/marcar-todos`, `/asistencias/justificar-masivo`, `/asistencias/clase/:claseId/fecha/:fecha`, `/asistencias/reporte/*`, `/asistencias/foto/*`, `/asistencias/estadisticas/mensuales/*`

### Beneficiarios
- **Backend**: `src/modules/beneficiarios/` - CRUD, expedientes, importación Excel, exportación, búsqueda pública, cumpleaños, reporte carpetas
- **Frontend**: `components/beneficiarios/` - Formulario, modal expedientes, importación Excel, edición perfil
- **Endpoints**: `/beneficiarios`, `/beneficiarios/importar`, `/beneficiarios/plantilla/descargar`, `/beneficiarios/exportar`, `/beneficiarios/buscar-publico`, `/beneficiarios/cumpleanos/*`, `/beneficiarios/reporte/carpetas`, `/beneficiarios/:id/expediente`

### Clases
- **Backend**: `src/modules/clases/` - CRUD, asignación/remoción de beneficiarios, estadísticas
- **Frontend**: Componentes en `components/clases/`
- **Endpoints**: `/clases`, `/clases/:id/beneficiarios`, `/clases/:id/estadisticas`

### Horarios
- **Backend**: `src/modules/horarios/` - CRUD, horarios disponibles
- **Endpoints**: `/horarios`, `/horarios/disponibles`

### Tutores
- **Backend**: `src/modules/tutores/` - CRUD completo
- **Endpoints**: `/tutores`

### Usuarios
- **Backend**: `src/modules/usuarios/` - CRUD, cambio de contraseña, reset de contraseña
- **Endpoints**: `/usuarios`, `/usuarios/:id/cambiar-password`, `/usuarios/:id/reset-password`

### Roles y Permisos
- **Backend**: `src/modules/roles/` - CRUD roles, permisos agrupados, asignación masiva
- **Endpoints**: `/roles`, `/roles/permisos`, `/roles/permisos/agrupados`, `/roles/:id/permisos`

### Ayudas
- **Backend**: `src/modules/ayudas/` - CRUD ayudas, cambio de estado, comentarios, foto de entrega, webhook, integración WhatsApp
- **Frontend**: `components/ayudas/`
- **Endpoints**: `/ayudas`, `/ayudas/:id/estado`, `/ayudas/:id/comentarios`, `/ayudas/:id/foto-entrega`, `/ayudas/exportar`

### Supervivencia
- **Backend**: `src/modules/supervivencias/` - CRUD curso supervivencia, asistencias con fotos, historial
- **Frontend**: `components/supervivencia/` - Formulario y modal de asignación
- **Endpoints**: `/supervivencias`, `/supervivencias/:id/asistencias`, `/supervivencias/:id/asistencias/foto/*`

### Nutrición
- **Backend**: `src/modules/nutricion/` - Menús diarios por tanda (matutina/vespertina)
- **Endpoints**: `/nutricion/menus`, `/nutricion/menus/fecha/:fecha/:tanda`

### Mérito Escolar
- **Backend**: `src/modules/merito/` - Períodos académicos, registro de notas (matemáticas, lengua, naturales, sociales), cálculo de ganadores por ciclo
- **Endpoints**: `/merito/periodos`, `/merito/periodos/:id/dashboard`, `/merito/periodos/:id/notas`, `/merito/periodos/:id/ganadores`

### Reportes
- **Backend**: `src/modules/reportes/` - Entidad reporte
- **Frontend**: Exportación a Excel (`exportExcel.ts`) y PDF (`exportPDF.ts`)

## 🧪 Testing

### Backend

```bash
# Ejecutar pruebas unitarias
npm run test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:cov

# Pruebas e2e
npm run test:e2e

# Modo debug
npm run test:debug
```

## 🔒 Seguridad

### Medidas Implementadas

| Medida | Implementación |
|--------|---------------|
| **Headers de seguridad** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Strict-Transport-Security` |
| **CORS** | Lista blanca de orígenes permitidos (localhost + producción) |
| **Rate Limiting** | `ThrottleGuard` in-memory (60 requests/min por defecto) |
| **Validación de entrada** | `ValidationPipe` custom con `class-validator` |
| **JWT** | Tokens firmados con expiración configurable |
| **Hashing de contraseñas** | bcrypt con salt rounds = 10 |
| **Protección de rutas** | `JwtAuthGuard` + `PermisosGuard` por endpoint |
| **Logging** | Errores de autenticación y rate limiting registrados |

### Variables de Entorno Sensibles

| Variable | Propósito | Requerida |
|----------|-----------|-----------|
| `DATABASE_URL` | Conexión a PostgreSQL | Sí |
| `JWT_SECRET` | Clave para firmar tokens JWT | Sí |
| `FRONTEND_URL` | Origen CORS permitido | Sí |
| `NODE_ENV` | Entorno (development/production) | Sí |

## 🐛 Troubleshooting

### Puerto ya en uso
Si los puertos 3000, 3001 o 5432 ya están en uso:
```bash
# Cambiar puertos en docker-compose.yml
# O detener el servicio conflictivo
```

### Problemas de conexión a BD
```bash
# Verificar que PostgreSQL esté ejecutándose
docker ps

# Ver logs del contenedor
docker logs cdi_db

# Probar conexión directa
psql -h localhost -U postgres -d cdi0436
```

### Limpiar Docker
```bash
docker-compose down -v  # Elimina contenedores y volúmenes
docker system prune -a   # Limpia recursos no utilizados
```

### Token JWT inválido
```bash
# Verificar JWT_SECRET en backend/.env
# Verificar que la fecha del servidor esté sincronizada
# Intentar reconectar: limpiar localStorage del navegador
```

## 🤝 Contribución

Para contribuir al proyecto:

1. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
2. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
3. Push a la rama (`git push origin feature/AmazingFeature`)
4. Abre un Pull Request

### Estándares de Código
- Usar TypeScript estricto
- Seguir las convenciones de NestJS (modular, decorators, DTOs) y Next.js (App Router)
- Ejecutar `npm run lint` y `npm run format` antes de hacer commit
- Escribir tests para nuevas funcionalidades
- Documentar código complejo
- NO incluir secrets en archivos de configuración o `.env.example`

## 📚 Documentación Adicional

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [Seguridad](./SECURITY.md)
- [Changelog](./CHANGELOG.md)
- [Swagger API Documentation](http://localhost:3001/apidocs) (cuando el backend está ejecutándose)

## 📝 Licencia

Este proyecto está bajo la licencia **UNLICENSED**.

## 📞 Contacto y Soporte

Para reportar issues o solicitar features, abre un issue en el repositorio.

---

**Última actualización**: Junio 2026

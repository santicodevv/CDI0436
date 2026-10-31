// ── Asistencia report inner types ──────────────────────────────────────────

export interface ReporteAsistenciaFechaItem {
  estado?: string;
  fecha: string;
  observaciones?: string;
}

export interface ReporteAsistenciaBeneficiarioItem {
  beneficiario: {
    id: string;
    nombre: string;
    codigo: string;
  };
  registros: ReporteAsistenciaFechaItem[];
}

export interface ReporteAsistenciaClaseItem {
  clase: {
    id: string;
    nombre: string;
    codigo?: string;
  };
  registros: ReporteAsistenciaFechaItem[];
}

// Cumpleaños
export interface CumpleanosItem {
  id: string;
  codigo: string;
  nombre: string;
  dia: number;
  fecha_nacimiento: string;
  edad: number;
  telefono: string | null;
  padre_tutor: string | null;
}

// Enums
export enum EstadoAsistencia {
  PRESENTE = 'presente',
  AUSENTE = 'ausente',
}

export enum DiaSemana {
  LUNES = 'lunes',
  MARTES = 'martes',
  MIERCOLES = 'miercoles',
  JUEVES = 'jueves',
  VIERNES = 'viernes',
  SABADO = 'sabado',
  DOMINGO = 'domingo',
}

// Permisos y Roles
export interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
  modulo: string;
  accion: string;
  descripcion: string;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  es_super_admin: boolean;
  activo: boolean;
  permisos?: Permiso[];
  creado_en?: string;
  actualizado_en?: string;
}

export enum TutorTipo {
  CLASE = 'clase',
  CLUB = 'club',
  AMBOS = 'ambos',
}

// Interfaces
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol | null;
  rol_id?: string | null;
  permisos?: string[]; // Lista de códigos de permisos o ['*'] si es super admin
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
}

export interface Tutor {
  id: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
  correo?: string;
  especialidad?: string;
  tipo: TutorTipo;
  activo: boolean;
  clases?: Clase[];
  creado_en: string;
  actualizado_en: string;
}

export interface Horario {
  id: string;
  dia: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  descripcion?: string;
  activo: boolean;
  clases?: Clase[];
  creado_en: string;
  actualizado_en: string;
}

export interface Beneficiario {
  id: string;
  codigo: string;
  nombre: string;
  apellido?: string;
  direccion?: string;
  telefono?: string;
  padre_tutor?: string;
  fecha_nacimiento?: string;
  foto_url?: string;
  correo?: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  clases?: Clase[];
  supervivencias?: Supervivencia[];
  clubes?: Club[];
}

export interface Clase {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  tutor: Tutor;
  horarios: Horario[];
  beneficiarios: Beneficiario[];
  capacidad_maxima: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Supervivencia {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  tutor?: Tutor;
  beneficiarios: Beneficiario[];
  capacidad_maxima: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface AsistenciaSupervivencia {
  id: string;
  supervivencia: Supervivencia;
  beneficiario: Beneficiario;
  fecha: string;
  presente: boolean;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface AsistenciaSupervivenciaBeneficiario {
  beneficiario: {
    id: string;
    nombre: string;
    apellido?: string;
    codigo: string;
  };
  presente: boolean | null;
  observaciones?: string | null;
  asistencia_id?: string | null;
}

export interface AsistenciaSupervivenciaResponse {
  fecha: string;
  supervivencia: {
    id: string;
    nombre: string;
    codigo?: string;
  };
  asistencias: AsistenciaSupervivenciaBeneficiario[];
  estadisticas: {
    total: number;
    presentes: number;
    ausentes: number;
    sinRegistrar: number;
  };
}

export interface Asistencia {
  id: string;
  clase: Clase;
  beneficiario: Beneficiario;
  fecha: string;
  estado: EstadoAsistencia;
  observaciones?: string;
  hora_registro?: string;
  sincronizado: boolean;
  creado_en: string;
  actualizado_en: string;
}

// Auth types
export interface LoginCredentials {
  correo: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  correo: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  usuario: Usuario;
}

// ============ Ayudas ============

export type EstadoFiltroAyuda = 'pendiente' | 'aprobada' | 'rechazada' | 'todos';

export interface Ayuda {
  id: string;
  nombre_beneficiario: string;
  codigo_beneficiario: string;
  nombre_madre: string;
  nombre_tutor: string;
  telefono?: string;
  tipo: 'medica' | 'alimentos' | 'pequeno_negocio' | 'educacion' | 'otros';
  tipo_especificacion?: string;
  detalle: string;
  foto_url?: string;
  foto_entrega_url?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  creado_en: string;
}

export interface ComentarioAyuda {
  id: string;
  contenido: string;
  autor: string;
  ayuda_id: string;
  creado_en: string;
}

// ============ Mérito ============

export type ModoGanadores = 'cantidad' | 'rango_nota';

export interface PeriodoMerito {
  id: string;
  nombre: string;
  anio: number;
  estado: string;
  creado_en: string;
}

export interface NotaMerito {
  id: string;
  beneficiario_id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  ciclo: 'Primaria' | 'Secundaria';
  curso: number;
  matematicas: number;
  lengua_espanola: number;
  naturales: number;
  sociales: number;
  promedio: number;
}

export interface BeneficiarioPendiente {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
}

export interface PeriodoDashboard {
  periodo: PeriodoMerito;
  faltan_por_entregar: BeneficiarioPendiente[];
  notas_registradas: NotaMerito[];
}

export interface GanadorMerito {
  id: string;
  codigo: string;
  nombre: string;
  curso: number;
  promedio: number;
}

export interface GanadoresResponse {
  primaria: GanadorMerito[];
  secundaria: GanadorMerito[];
}

export interface AgregarNotaData {
  beneficiario_id: string;
  ciclo: string;
  curso: number;
  matematicas: number;
  lengua_espanola: number;
  naturales: number;
  sociales: number;
}

// ============ Asistencia Reportes ============

export interface ReporteAsistenciaClase {
  clase: {
    id: string;
    nombre: string;
    codigo?: string;
    tutor: string;
    horarios: string;
  };
  periodo: {
    fechaInicio: string;
    fechaFin: string;
  };
  fechas: string[];
  beneficiarios: {
    id: string;
    codigo: string;
    nombre: string;
    presentes: string[];
  }[];
}

// ── Expediente types ─────────────────────────────────────────────────────────
export type ExpedienteTipo = 'educativo' | 'registro' | 'documentos' | 'otros' | 'galeria' | 'libre';

export interface ImagenGaleria {
  base64: string;
  titulo?: string;
  descripcion?: string;
}

export interface PdfAdjunto {
  nombre: string;
  base64_pdf: string;
}

export interface ExpedientePayload {
  tipo: string;
  titulo: string | null;
  mostrar_titulo: boolean;
  contenido: string | null;
  fecha_evento: string | null;
  etiqueta_color: string;
  imagen_base64: null;
  imagenes_galeria: ImagenGaleria[] | null;
  pdfs: PdfAdjunto[] | null;
}

export interface ExpedienteEditPayload {
  titulo: string | null;
  mostrar_titulo: boolean;
  contenido: string | null;
  fecha_evento: string | null;
  etiqueta_color: string;
  imagen_base64: null;
  imagenes_galeria: ImagenGaleria[] | null;
  pdfs: PdfAdjunto[] | null;
}

export interface ExpedienteEntry {
  id: string;
  tipo: ExpedienteTipo;
  titulo?: string | null;
  mostrar_titulo?: boolean;
  contenido?: string | null;
  fecha_evento?: string | null;
  etiqueta_color?: string;
  imagen_base64?: string | null;
  imagenes_galeria?: ImagenGaleria[] | null;
  pdfs?: PdfAdjunto[] | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ColorMapEntry {
  dot: string;
  badge: string;
  text: string;
}

export interface TipoMetaEntry {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export interface FiltroEntry {
  key: string;
  label: string;
}

// ── Reporte filters types ──────────────────────────────────────────────────────

export interface FiltrosReportePayload {
  id: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaReporte?: string;
}

export type TipoFiltroFecha = 'todo' | 'fecha' | 'rango' | 'mes';

// ── Usuario form types ─────────────────────────────────────────────────────────

export interface UsuarioFormValues {
  nombre: string;
  correo: string;
  password: string;
  rol_id: string;
}

// ─── Clase Detalle ───────────────────────────────────────────────────────────
export interface FotoAsistencia {
  id: string;
  imagen_url: string;
  [key: string]: unknown;
}

// ─── Bonos ────────────────────────────────────────────────────────────────────
export interface BeneficiarioRow {
  id: string;
  codigo: string;
  beneficiario: string;
  padre: string;
  cedula: string;
  monto: string;
}

export interface BondCardProps {
  row: BeneficiarioRow;
  mes: string;
  expira: string;
}

// ─── Nutrición ────────────────────────────────────────────────────────────────
export type TandaNutricion = 'matutina' | 'vespertina';

export interface MenuNutricion {
  id: string;
  fecha: string;
  tanda: TandaNutricion;
  titulo_menu: string;
  meriendas_servidas: number | null;
  observaciones: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ResumenClase {
  claseId: string;
  nombre: string;
  codigo: string | null;
  tutor: string | null;
  totalInscritos: number;
  totalPresentes: number;
}

// Club types
export interface Club {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  tutor?: Tutor;
  beneficiarios: Beneficiario[];
  capacidad_maxima: number;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface AsistenciaClub {
  id: string;
  club: Club;
  beneficiario: Beneficiario;
  fecha: string;
  presente: boolean;
  observaciones?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface AsistenciaClubBeneficiario {
  beneficiario: {
    id: string;
    nombre: string;
    apellido?: string;
    codigo: string;
  };
  presente: boolean | null;
  observaciones?: string | null;
  asistencia_id?: string | null;
}

export interface AsistenciaClubResponse {
  fecha: string;
  club: {
    id: string;
    nombre: string;
    codigo?: string;
  };
  asistencias: AsistenciaClubBeneficiario[];
  estadisticas: {
    total: number;
    presentes: number;
    ausentes: number;
    sinRegistrar: number;
  };
}

export interface ClubFoto {
  id: string;
  imagen_url: string;
  fecha: string;
  creado_en: string;
}

// Supervivencia-specific types
export type TabType = 'beneficiarios' | 'asistencia';

export interface AsistenciaLocal {
  beneficiario_id: string;
  presente: boolean;
  observaciones: string;
}

export interface SupervivenciaFoto {
  id: string;
  imagen_url: string;
  fecha: string;
  creado_en: string;
}

export interface ReporteAsistenciaBeneficiario {
  beneficiario: {
    id: string;
    codigo: string;
    nombre: string;
    edad?: number;
    padre_tutor?: string;
  };
  periodo: {
    fechaInicio: string;
    fechaFin: string;
  };
  estadisticas: {
    totalClasesInscritas: number;
    totalRegistros: number;
    presentes: number;
    ausentes: number;
    porcentajeAsistencia: string;
  };
  asistenciasPorClase: ReporteAsistenciaClaseItem[];
}

import type { ComponentType } from 'react';

// ── Sidebar types ────────────────────────────────────────────────────────────

export interface MenuItem {
  title: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  permisos?: string[];
  subItems?: MenuItem[];
}

// ── NotaForm types ───────────────────────────────────────────────────────────
export interface NotaFormValues {
  ciclo: string;
  curso: number;
  matematicas: string;
  lengua_espanola: string;
  naturales: string;
  sociales: string;
}

// ── Reportes types ──────────────────────────────────────────────────────────
export type TipoPeriodo = 'dia' | 'mes' | 'anio' | 'rango' | 'todo';
export type TipoReporteGlobal = 'estadistico' | 'detallado';
export type TipoReportePrincipal = 'clase' | 'beneficiario' | 'tutor' | 'global' | 'ausencias';

export interface ReporteFiltrosClase {
  id: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaReporte?: string;
}

export interface ReporteFiltrosGlobal {
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ReporteContextClase {
  tipo: 'clase';
  filtros: ReporteFiltrosClase;
  fechaReporte: string;
}

export interface ReporteContextBeneficiario {
  tipo: 'beneficiario';
  filtros: ReporteFiltrosClase;
  fechaReporte: string;
}

export interface ReporteContextTutor {
  tipo: 'tutor';
  filtros: ReporteFiltrosClase;
  fechaReporte: string;
}

export interface ReporteContextGlobal {
  tipo: 'global';
  tipoGlobal: TipoReporteGlobal;
  periodoDescripcion: string;
  fechaReporte: string;
}

export interface ReporteContextAusencias {
  tipo: 'ausencias';
  periodoDescripcion: string;
  fechaReporte: string;
}

export type ReportContext =
  | ReporteContextClase
  | ReporteContextBeneficiario
  | ReporteContextTutor
  | ReporteContextGlobal
  | ReporteContextAusencias;

export interface StatItem {
  label: string;
  value: string | number;
}

export interface TableRow {
  cells: React.ReactNode[];
  key: string;
}

export interface MesOption {
  value: string;
  label: string;
}

export interface BeneficiarioSugerido {
  id: string;
  codigo: string;
  nombre: string;
  apellido?: string;
  padre_tutor?: string;
  telefono?: string;
  profesor_nombre?: string;
}

// ─── Importación ─────────────────────────────────────────────────────────────
export interface ImportarResultado {
  exitosos: number;
  fallidos: number;
  errores?: Array<{ fila: number; error: string; datos?: Record<string, string> }>;
}

// ─── Reporte Carpetas ─────────────────────────────────────────────────────────
export interface CarpetaRegistroItem {
  beneficiario: {
    id: string;
    nombre: string;
    codigo: string;
  };
  tieneRegistros: boolean;
  expedientes: Array<{
    tipo: string;
    titulo: string;
  }>;
}

export interface ReporteCarpetasEstadisticas {
  totalEvaluados: number;
  conRegistros: number;
  sinRegistros: number;
}

export interface ReporteCarpetasData {
  registros: CarpetaRegistroItem[];
  estadisticas: ReporteCarpetasEstadisticas;
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────
export interface EstadisticasGenerales {
  totalRegistros?: number;
  presentes?: number;
  ausentes?: number;
  porcentajeAsistencia?: string;
  [key: string]: unknown;
}

export interface EncuentrosResponse { fechas: string[]; fechasBloqueadas: string[]; }

export type EstadoPaseLista = 'sin_registro' | 'parcial' | 'registrada' | 'pendiente_hoy' | 'programada';
export interface SesionPaseLista {
  fecha: string;
  tipo: 'clase' | 'club' | 'supervivencia';
  actividadId: string;
  actividad: string;
  codigo: string | null;
  inscritos: number;
  registrados: number;
  estado: EstadoPaseLista;
}
export interface ReportePaseListaTutor {
  tutor: { id: string; nombre: string };
  periodo: { fechaInicio: string; fechaFin: string; hoy: string };
  estadisticas: {
    sesionesProgramadas: number;
    sesionesSinRegistro: number;
    diasSinRegistro: number;
    sesionesRegistradas: number;
    sesionesParciales: number;
    pendientesHoy: number;
  };
  sesiones: SesionPaseLista[];
  nota: string;
}

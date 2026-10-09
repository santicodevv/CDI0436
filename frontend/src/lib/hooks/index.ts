// Auth
export { useLogin, useRegister, useValidateToken, authKeys } from './useAuth';

// Usuarios
export {
  useUsuarios,
  useUsuario,
  useCreateUsuario,
  useUpdateUsuario,
  useDeleteUsuario,
  useChangePassword,
  useResetPassword,
  usuariosKeys,
} from './useUsuarios';

// Roles
export {
  useRoles,
  useRol,
  useCreateRol,
  useUpdateRol,
  useDeleteRol,
  usePermisosAgrupados,
  rolesKeys,
} from './useRoles';

// Beneficiarios
export {
  useBeneficiarios,
  useBeneficiario,
  useCreateBeneficiario,
  useUpdateBeneficiario,
  useDeleteBeneficiario,
  useBeneficiarioEstadisticas,
  useCumpleanosPorMes,
  beneficiariosKeys,
} from './useBeneficiarios';

// Clases
export {
  useClases,
  useClase,
  useCreateClase,
  useUpdateClase,
  useDeleteClase,
  useClasesEstadisticas,
  useClasesPorTutor,
  clasesKeys,
} from './useClases';

// Asistencias
export {
  useAsistencias,
  useAsistencia,
  useCreateAsistencia,
  useRegistrarAsistenciaMasiva,
  useAsistenciasPorClaseYFecha,
  useReporteAsistenciaClase,
  useReporteAsistenciaBeneficiario,
  useEstadisticasAsistenciaMensual,
  useResumenAsistenciaPorFecha,
  useFotosAsistencia,
  useSubirFotoAsistencia,
  useEliminarFotoAsistencia,
  asistenciasKeys,
} from './useAsistencias';

// Tutores
export {
  useTutores,
  useTutor,
  useCreateTutor,
  useUpdateTutor,
  useDeleteTutor,
  useDesactivarTutor,
  tutoresKeys,
} from './useTutores';

// Horarios
export {
  useHorarios,
  useHorario,
  useHorariosDisponibles,
  useCreateHorario,
  useUpdateHorario,
  useDeleteHorario,
  useDesactivarHorario,
  horariosKeys,
} from './useHorarios';

// Clubs
export {
  useClubs,
  useClub,
  useCreateClub,
  useUpdateClub,
  useDeleteClub,
  useRegistrarAsistenciaClub,
  useAsistenciasClub,
  useClubEstadisticas,
  useFechasConAsistenciaClub,
  useFotosClub,
  useSubirFotoClub,
  useEliminarFotoClub,
  useAgregarBeneficiariosClub,
  useRemoverBeneficiarioClub,
  clubsKeys,
} from './useClubs';

// Supervivencias
export {
  useSupervivencias,
  useSupervivencia,
  useCreateSupervivencia,
  useUpdateSupervivencia,
  useDeleteSupervivencia,
  useRegistrarAsistenciaSupervivencia,
  useAsistenciasSupervivencia,
  useSupervivenciaEstadisticas,
  useFechasConAsistencia,
  useFotosSupervivencia,
  useSubirFotoSupervivencia,
  useEliminarFotoSupervivencia,
  useAgregarBeneficiariosSupervivencia,
  useRemoverBeneficiarioSupervivencia,
  supervivenciasKeys,
} from './useSupervivencias';

// Nutrición
export {
  useMenusNutricion,
  useMenuNutricionPorFecha,
  useCreateMenuNutricion,
  useUpdateMenuNutricion,
  useDeleteMenuNutricion,
  nutricionKeys,
} from './useNutricion';

// Mérito
export {
  usePeriodosMerito,
  useDashboardPeriodo,
  useNotasMerito,
  useCreatePeriodoMerito,
  useAgregarNotaMerito,
  useGanadoresMerito,
  useGenerarGanadoresMerito,
  meritoKeys,
} from './useMerito';

// Ayudas
export {
  useAyudas,
  useCreateAyuda,
  useUpdateEstadoAyuda,
  useDeleteAyuda,
  useComentariosAyuda,
  useCreateComentarioAyuda,
  useUpdateFotoEntregaAyuda,
  useExportAyudas,
  ayudasKeys,
} from './useAyudas';

// Dashboard
export {
  useDashboardEstadisticas,
  useAsistenciasRecientes,
  useClasesHoy,
  dashboardKeys,
} from './useDashboard';

// Asistencia Personal
export {
  useTrabajadores,
  useCreateTrabajador,
  useUpdateTrabajador,
  useDeleteTrabajador,
  useAsistenciaPersonal,
  useMarcarEntrada,
  useMarcarSalida,
  useEliminarAsistencia,
  useActualizarNotas,
  asistenciaPersonalKeys,
} from './useAsistenciaPersonal';

// Documentos de Usuarios
export {
  useDocumentosUsuario,
  useSubirDocumento,
  useEliminarDocumento,
  useTiposDocumento,
  documentosKeys,
} from './useDocumentosUsuario';

// Reportes
export {
  useReporteClase,
  useReporteBeneficiario,
  useReporteTutor,
  useReporteGlobal,
  useReporteAusencias,
  reportesKeys,
} from './useReportes';

// Bonos
export {
  useBonosRegalos,
  useBonosEstadisticas,
  useBonosMeses,
  useCrearBonosLote,
  useMarcarEntregado,
  useEliminarBono,
  bonosKeys,
} from './useBonos';

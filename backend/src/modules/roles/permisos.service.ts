import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from './entities/permiso.entity';
import { Rol } from './entities/rol.entity';
import { Usuario } from '../usuarios/usuario.entity';
import * as bcrypt from 'bcrypt';

// Definición de todos los permisos del sistema
export const PERMISOS_SISTEMA = [
  // Usuarios
  {
    codigo: 'usuarios:ver',
    nombre: 'Ver usuarios',
    modulo: 'usuarios',
    accion: 'ver',
    descripcion: 'Permite ver la lista de usuarios',
  },
  {
    codigo: 'usuarios:crear',
    nombre: 'Crear usuarios',
    modulo: 'usuarios',
    accion: 'crear',
    descripcion: 'Permite crear nuevos usuarios',
  },
  {
    codigo: 'usuarios:editar',
    nombre: 'Editar usuarios',
    modulo: 'usuarios',
    accion: 'editar',
    descripcion: 'Permite editar usuarios existentes',
  },
  {
    codigo: 'usuarios:eliminar',
    nombre: 'Eliminar usuarios',
    modulo: 'usuarios',
    accion: 'eliminar',
    descripcion: 'Permite eliminar usuarios',
  },

  // Roles
  {
    codigo: 'roles:ver',
    nombre: 'Ver roles',
    modulo: 'roles',
    accion: 'ver',
    descripcion: 'Permite ver la lista de roles',
  },
  {
    codigo: 'roles:crear',
    nombre: 'Crear roles',
    modulo: 'roles',
    accion: 'crear',
    descripcion: 'Permite crear nuevos roles',
  },
  {
    codigo: 'roles:editar',
    nombre: 'Editar roles',
    modulo: 'roles',
    accion: 'editar',
    descripcion: 'Permite editar roles existentes',
  },
  {
    codigo: 'roles:eliminar',
    nombre: 'Eliminar roles',
    modulo: 'roles',
    accion: 'eliminar',
    descripcion: 'Permite eliminar roles',
  },

  // Beneficiarios
  {
    codigo: 'beneficiarios:ver',
    nombre: 'Ver beneficiarios',
    modulo: 'beneficiarios',
    accion: 'ver',
    descripcion: 'Permite ver la lista de beneficiarios',
  },
  {
    codigo: 'beneficiarios:crear',
    nombre: 'Crear beneficiarios',
    modulo: 'beneficiarios',
    accion: 'crear',
    descripcion: 'Permite crear nuevos beneficiarios',
  },
  {
    codigo: 'beneficiarios:editar',
    nombre: 'Editar beneficiarios',
    modulo: 'beneficiarios',
    accion: 'editar',
    descripcion: 'Permite editar beneficiarios existentes',
  },
  {
    codigo: 'beneficiarios:eliminar',
    nombre: 'Eliminar beneficiarios',
    modulo: 'beneficiarios',
    accion: 'eliminar',
    descripcion: 'Permite eliminar beneficiarios',
  },

  // Clases
  {
    codigo: 'clases:ver',
    nombre: 'Ver clases',
    modulo: 'clases',
    accion: 'ver',
    descripcion: 'Permite ver la lista de clases',
  },
  {
    codigo: 'clases:crear',
    nombre: 'Crear clases',
    modulo: 'clases',
    accion: 'crear',
    descripcion: 'Permite crear nuevas clases',
  },
  {
    codigo: 'clases:editar',
    nombre: 'Editar clases',
    modulo: 'clases',
    accion: 'editar',
    descripcion: 'Permite editar clases existentes',
  },
  {
    codigo: 'clases:eliminar',
    nombre: 'Eliminar clases',
    modulo: 'clases',
    accion: 'eliminar',
    descripcion: 'Permite eliminar clases',
  },

  // Asistencias
  {
    codigo: 'asistencias:ver',
    nombre: 'Ver asistencias',
    modulo: 'asistencias',
    accion: 'ver',
    descripcion: 'Permite ver registros de asistencia',
  },
  {
    codigo: 'asistencias:crear',
    nombre: 'Registrar asistencias',
    modulo: 'asistencias',
    accion: 'crear',
    descripcion: 'Permite registrar asistencias',
  },
  {
    codigo: 'asistencias:editar',
    nombre: 'Editar asistencias',
    modulo: 'asistencias',
    accion: 'editar',
    descripcion: 'Permite editar registros de asistencia',
  },
  {
    codigo: 'asistencias:eliminar',
    nombre: 'Eliminar asistencias',
    modulo: 'asistencias',
    accion: 'eliminar',
    descripcion: 'Permite eliminar registros de asistencia',
  },

  // Horarios
  {
    codigo: 'horarios:ver',
    nombre: 'Ver horarios',
    modulo: 'horarios',
    accion: 'ver',
    descripcion: 'Permite ver horarios',
  },
  {
    codigo: 'horarios:crear',
    nombre: 'Crear horarios',
    modulo: 'horarios',
    accion: 'crear',
    descripcion: 'Permite crear nuevos horarios',
  },
  {
    codigo: 'horarios:editar',
    nombre: 'Editar horarios',
    modulo: 'horarios',
    accion: 'editar',
    descripcion: 'Permite editar horarios existentes',
  },
  {
    codigo: 'horarios:eliminar',
    nombre: 'Eliminar horarios',
    modulo: 'horarios',
    accion: 'eliminar',
    descripcion: 'Permite eliminar horarios',
  },

  // Tutores
  {
    codigo: 'tutores:ver',
    nombre: 'Ver tutores',
    modulo: 'tutores',
    accion: 'ver',
    descripcion: 'Permite ver la lista de tutores',
  },
  {
    codigo: 'tutores:crear',
    nombre: 'Crear tutores',
    modulo: 'tutores',
    accion: 'crear',
    descripcion: 'Permite crear nuevos tutores',
  },
  {
    codigo: 'tutores:editar',
    nombre: 'Editar tutores',
    modulo: 'tutores',
    accion: 'editar',
    descripcion: 'Permite editar tutores existentes',
  },
  {
    codigo: 'tutores:eliminar',
    nombre: 'Eliminar tutores',
    modulo: 'tutores',
    accion: 'eliminar',
    descripcion: 'Permite eliminar tutores',
  },

  // Ayudas
  {
    codigo: 'ayudas:ver',
    nombre: 'Ver ayudas',
    modulo: 'ayudas',
    accion: 'ver',
    descripcion: 'Permite ver la lista de ayudas',
  },
  {
    codigo: 'ayudas:crear',
    nombre: 'Crear ayudas',
    modulo: 'ayudas',
    accion: 'crear',
    descripcion: 'Permite crear nuevas ayudas',
  },
  {
    codigo: 'ayudas:editar',
    nombre: 'Editar ayudas',
    modulo: 'ayudas',
    accion: 'editar',
    descripcion: 'Permite editar ayudas existentes',
  },
  {
    codigo: 'ayudas:eliminar',
    nombre: 'Eliminar ayudas',
    modulo: 'ayudas',
    accion: 'eliminar',
    descripcion: 'Permite eliminar ayudas',
  },
  {
    codigo: 'ayudas:disponibilidad',
    nombre: 'Habilitar o deshabilitar ayudas',
    modulo: 'ayudas',
    accion: 'disponibilidad',
    descripcion:
      'Permite abrir o cerrar el formulario público de solicitudes de ayuda',
  },

  // Reportes
  {
    codigo: 'reportes:ver',
    nombre: 'Ver reportes',
    modulo: 'reportes',
    accion: 'ver',
    descripcion: 'Permite ver reportes',
  },
  {
    codigo: 'reportes:generar',
    nombre: 'Generar reportes',
    modulo: 'reportes',
    accion: 'generar',
    descripcion: 'Permite generar reportes',
  },
  {
    codigo: 'reportes:exportar',
    nombre: 'Exportar reportes',
    modulo: 'reportes',
    accion: 'exportar',
    descripcion: 'Permite exportar reportes',
  },

  // Bonos
  {
    codigo: 'bonos:ver',
    nombre: 'Ver bonos',
    modulo: 'bonos',
    accion: 'ver',
    descripcion: 'Permite ver el módulo de bonos de regalo',
  },
  {
    codigo: 'bonos:generar',
    nombre: 'Generar bonos',
    modulo: 'bonos',
    accion: 'generar',
    descripcion: 'Permite generar e imprimir bonos de regalo',
  },
  {
    codigo: 'bonos:regalos:crear',
    nombre: 'Crear bonos de regalos',
    modulo: 'bonos',
    accion: 'crear',
    descripcion:
      'Permite subir Excel y guardar bonos de regalos en la base de datos',
  },
  {
    codigo: 'bonos:regalos:entregar',
    nombre: 'Entregar bonos de regalos',
    modulo: 'bonos',
    accion: 'entregar',
    descripcion:
      'Permite subir fotos de entrega y marcar bonos como entregados',
  },

  // Reportes Generales
  {
    codigo: 'reportes_generales:ver',
    nombre: 'Ver reportes generales',
    modulo: 'reportes_generales',
    accion: 'ver',
    descripcion: 'Permite ver reportes generales de todas las clases',
  },
  {
    codigo: 'reportes_generales:exportar',
    nombre: 'Exportar reportes generales',
    modulo: 'reportes_generales',
    accion: 'exportar',
    descripcion: 'Permite exportar reportes generales',
  },

  // Nutrición
  {
    codigo: 'nutricion:ver',
    nombre: 'Ver nutrición',
    modulo: 'nutricion',
    accion: 'ver',
    descripcion: 'Permite ver el resumen de nutrición por clase y fecha',
  },

  // Supervivencia
  {
    codigo: 'supervivencia:ver',
    nombre: 'Ver supervivencia',
    modulo: 'supervivencia',
    accion: 'ver',
    descripcion: 'Permite ver los cursos de supervivencia',
  },
  {
    codigo: 'supervivencia:crear',
    nombre: 'Crear supervivencia',
    modulo: 'supervivencia',
    accion: 'crear',
    descripcion: 'Permite crear nuevos cursos de supervivencia',
  },
  {
    codigo: 'supervivencia:editar',
    nombre: 'Editar supervivencia',
    modulo: 'supervivencia',
    accion: 'editar',
    descripcion: 'Permite editar cursos de supervivencia existentes',
  },
  {
    codigo: 'supervivencia:eliminar',
    nombre: 'Eliminar supervivencia',
    modulo: 'supervivencia',
    accion: 'eliminar',
    descripcion: 'Permite eliminar cursos de supervivencia',
  },

  // Cumpleaños
  {
    codigo: 'cumpleanos:ver',
    nombre: 'Ver cumpleaños',
    modulo: 'cumpleanos',
    accion: 'ver',
    descripcion: 'Permite ver los cumpleaños de los beneficiarios',
  },

  // Clubs
  {
    codigo: 'clubs:ver',
    nombre: 'Ver clubs',
    modulo: 'clubs',
    accion: 'ver',
    descripcion: 'Permite ver la lista de clubs',
  },
  {
    codigo: 'clubs:crear',
    nombre: 'Crear clubs',
    modulo: 'clubs',
    accion: 'crear',
    descripcion: 'Permite crear nuevos clubs',
  },
  {
    codigo: 'clubs:editar',
    nombre: 'Editar clubs',
    modulo: 'clubs',
    accion: 'editar',
    descripcion: 'Permite editar clubs existentes',
  },
  {
    codigo: 'clubs:eliminar',
    nombre: 'Eliminar clubs',
    modulo: 'clubs',
    accion: 'eliminar',
    descripcion: 'Permite eliminar clubs',
  },

  // Mérito Estudiantil
  {
    codigo: 'merito:ver',
    nombre: 'Ver mérito',
    modulo: 'merito',
    accion: 'ver',
    descripcion: 'Permite ver los periodos y ganadores del mérito estudiantil',
  },
  {
    codigo: 'merito:crear',
    nombre: 'Crear periodo de mérito',
    modulo: 'merito',
    accion: 'crear',
    descripcion: 'Permite crear nuevos periodos de mérito',
  },
  {
    codigo: 'merito:editar',
    nombre: 'Digitar notas',
    modulo: 'merito',
    accion: 'editar',
    descripcion: 'Permite digitar notas de los estudiantes',
  },
];

@Injectable()
export class PermisosService implements OnModuleInit {
  constructor(
    @InjectRepository(Permiso)
    private permisosRepository: Repository<Permiso>,
    @InjectRepository(Rol)
    private rolesRepository: Repository<Rol>,
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  // Inicializar permisos, roles y usuario admin al arrancar
  async onModuleInit() {
    await this.seedPermisos();
    await this.seedRolesAndAdmin();
  }

  async seedRolesAndAdmin(): Promise<void> {
    try {
      // Crear rol Super Admin si no existe
      let rolSuperAdmin = await this.rolesRepository.findOne({
        where: { es_super_admin: true },
      });

      if (!rolSuperAdmin) {
        const todosLosPermisos = await this.permisosRepository.find();
        rolSuperAdmin = this.rolesRepository.create({
          nombre: 'Super Administrador',
          descripcion:
            'Acceso completo a todas las funcionalidades del sistema',
          es_super_admin: true,
          activo: true,
          permisos: todosLosPermisos,
        });
        await this.rolesRepository.save(rolSuperAdmin);
        console.log('[Seed] Rol Super Administrador creado');
      }

      // Crear usuario admin si no existe
      const adminEmail = 'admin@cdi.com';
      const adminUser = await this.usuariosRepository.findOne({
        where: { correo: adminEmail },
      });

      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        const newUser = this.usuariosRepository.create({
          nombre: 'Super Administrador',
          correo: adminEmail,
          password_hash: passwordHash,
          rol_id: rolSuperAdmin.id,
          activo: true,
        });
        await this.usuariosRepository.save(newUser);
        console.log('[Seed] Usuario admin creado: admin@cdi.com / admin123');
      }
    } catch (error) {
      console.error('[Seed] Error (non-critical):', error.message);
    }
  }

  async seedPermisos(): Promise<void> {
    for (const permisoData of PERMISOS_SISTEMA) {
      const existe = await this.permisosRepository.findOne({
        where: { codigo: permisoData.codigo },
      });

      if (!existe) {
        const permiso = this.permisosRepository.create(permisoData);
        await this.permisosRepository.save(permiso);
      }
    }
  }

  async findAll(): Promise<Permiso[]> {
    return this.permisosRepository.find({
      order: { modulo: 'ASC', accion: 'ASC' },
    });
  }

  async findByModulo(modulo: string): Promise<Permiso[]> {
    return this.permisosRepository.find({
      where: { modulo },
      order: { accion: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Permiso | null> {
    return this.permisosRepository.findOne({ where: { id } });
  }

  async findByCodigo(codigo: string): Promise<Permiso | null> {
    return this.permisosRepository.findOne({ where: { codigo } });
  }

  // Obtener permisos agrupados por módulo
  async findAllGroupedByModulo(): Promise<Record<string, Permiso[]>> {
    const permisos = await this.findAll();
    return permisos.reduce(
      (acc, permiso) => {
        if (!acc[permiso.modulo]) {
          acc[permiso.modulo] = [];
        }
        acc[permiso.modulo].push(permiso);
        return acc;
      },
      {} as Record<string, Permiso[]>,
    );
  }
}

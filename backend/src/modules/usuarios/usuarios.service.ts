import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // Verificar si el correo ya existe
    const existe = await this.usuariosRepository.findOne({
      where: { correo: createUsuarioDto.correo },
    });

    if (existe) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Hash del password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createUsuarioDto.password, salt);

    const usuario = this.usuariosRepository.create({
      nombre: createUsuarioDto.nombre,
      correo: createUsuarioDto.correo,
      password_hash: passwordHash,
      rol_id: createUsuarioDto.rol_id,
    });

    const savedUsuario = await this.usuariosRepository.save(usuario);

    // Recargar con relación de rol
    return this.findOne(savedUsuario.id);
  }

  async findAll(): Promise<Usuario[]> {
    const usuarios = await this.usuariosRepository.find({
      relations: ['rol', 'rol.permisos'],
      order: { nombre: 'ASC' },
    });

    // Eliminar passwords
    return usuarios.map((u) => {
      const { password_hash: _password_hash, ...safe } = u;
      return safe as Usuario;
    });
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: ['rol', 'rol.permisos'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const { password_hash: _password_hash, ...safeUsuario } = usuario;
    return safeUsuario as Usuario;
  }

  // Única forma de cargar password_hash (la columna tiene select: false)
  private findConPassword(where: { id: string } | { correo: string }) {
    const query = this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.password_hash')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .leftJoinAndSelect('rol.permisos', 'permisos');
    return 'id' in where
      ? query.where('usuario.id = :id', { id: where.id }).getOne()
      : query
          .where('usuario.correo = :correo', { correo: where.correo })
          .getOne();
  }

  // findByCorreo puede devolver null si no existe
  async findByCorreo(correo: string): Promise<Usuario | null> {
    return await this.usuariosRepository.findOne({
      where: { correo },
      relations: ['rol', 'rol.permisos'],
    });
  }

  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Si se intenta cambiar el correo, verificar que no exista
    if (updateUsuarioDto.correo && updateUsuarioDto.correo !== usuario.correo) {
      const existe = await this.usuariosRepository.findOne({
        where: { correo: updateUsuarioDto.correo },
      });

      if (existe) {
        throw new ConflictException('El correo ya está registrado');
      }
    }

    // Actualizar campos
    if (updateUsuarioDto.nombre) usuario.nombre = updateUsuarioDto.nombre;
    if (updateUsuarioDto.correo) usuario.correo = updateUsuarioDto.correo;
    if (updateUsuarioDto.rol_id) usuario.rol_id = updateUsuarioDto.rol_id;
    if (updateUsuarioDto.activo !== undefined)
      usuario.activo = updateUsuarioDto.activo;

    await this.usuariosRepository.save(usuario);

    return this.findOne(id);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const usuario = await this.findConPassword({ id });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Verificar password actual
    const isValid = await bcrypt.compare(
      changePasswordDto.passwordActual,
      usuario.password_hash,
    );
    if (!isValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash del nuevo password
    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(
      changePasswordDto.passwordNueva,
      salt,
    );
    // Marcar que ya no es primer login
    usuario.primer_login = false;

    await this.usuariosRepository.save(usuario);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const salt = await bcrypt.genSalt(10);
    usuario.password_hash = await bcrypt.hash(newPassword, salt);

    await this.usuariosRepository.save(usuario);
  }

  async remove(id: string): Promise<void> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: ['rol'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // No permitir eliminar super admin
    if (usuario.rol?.es_super_admin) {
      throw new BadRequestException(
        'No se puede eliminar el usuario Super Administrador',
      );
    }

    await this.usuariosRepository.remove(usuario);
  }

  async softDelete(id: string): Promise<Usuario> {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: ['rol'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // No permitir desactivar super admin
    if (usuario.rol?.es_super_admin) {
      throw new BadRequestException(
        'No se puede desactivar el usuario Super Administrador',
      );
    }

    usuario.activo = false;
    await this.usuariosRepository.save(usuario);

    return this.findOne(id);
  }

  async validateUser(
    correo: string,
    password: string,
  ): Promise<Usuario | null> {
    const usuario = await this.findConPassword({ correo });

    if (!usuario || !usuario.activo) {
      return null;
    }

    const isValid = await bcrypt.compare(password, usuario.password_hash);
    if (!isValid) {
      return null;
    }

    const { password_hash: _password_hash, ...safeUsuario } = usuario;
    return safeUsuario as Usuario;
  }
}

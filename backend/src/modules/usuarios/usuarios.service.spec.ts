import { BadRequestException } from '@nestjs/common';
import { getMetadataArgsStorage } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuario.entity';

describe('UsuariosService y password_hash', () => {
  let usuarioDb: Usuario | null;
  const qb = {
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(() => Promise.resolve(usuarioDb)),
  };
  const repo = {
    createQueryBuilder: jest.fn(() => qb),
    save: jest.fn((u: Usuario) => Promise.resolve(u)),
  };
  const service = new UsuariosService(repo as never);

  beforeEach(async () => {
    jest.clearAllMocks();
    usuarioDb = {
      id: 'u1',
      nombre: 'Ana',
      correo: 'ana@cdi.com',
      activo: true,
      primer_login: true,
      password_hash: await bcrypt.hash('secreta', 4),
    } as Usuario;
  });

  it('la columna password_hash no se carga por defecto', () => {
    const columna = getMetadataArgsStorage().columns.find(
      (c) => c.target === Usuario && c.propertyName === 'password_hash',
    );
    expect(columna?.options.select).toBe(false);
  });

  it('el login pide el hash explícitamente y no lo devuelve', async () => {
    const usuario = await service.validateUser('ana@cdi.com', 'secreta');
    expect(qb.addSelect).toHaveBeenCalledWith('usuario.password_hash');
    expect(usuario).toMatchObject({ id: 'u1', correo: 'ana@cdi.com' });
    expect(usuario).not.toHaveProperty('password_hash');
  });

  it('el login rechaza contraseña incorrecta o usuario inactivo', async () => {
    await expect(
      service.validateUser('ana@cdi.com', 'otra'),
    ).resolves.toBeNull();
    usuarioDb!.activo = false;
    await expect(
      service.validateUser('ana@cdi.com', 'secreta'),
    ).resolves.toBeNull();
  });

  it('cambiar contraseña compara con el hash guardado', async () => {
    await expect(
      service.changePassword('u1', {
        passwordActual: 'mal',
        passwordNueva: 'nueva123',
      }),
    ).rejects.toThrow(BadRequestException);

    await service.changePassword('u1', {
      passwordActual: 'secreta',
      passwordNueva: 'nueva123',
    });
    const guardado = repo.save.mock.calls[0][0];
    expect(await bcrypt.compare('nueva123', guardado.password_hash)).toBe(true);
    expect(guardado.primer_login).toBe(false);
  });
});

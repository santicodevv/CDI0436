import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import { TicketsService, UsuarioTicket } from './tickets.service';
import { EstadoTicket, Ticket } from './ticket.entity';
import { UpdateTicketDto } from './dto/update-ticket.dto';

jest.mock('fs', () => ({
  ...jest.requireActual<typeof fs>('fs'),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  rmSync: jest.fn(),
  existsSync: jest.fn(() => true),
}));

describe('TicketsService', () => {
  let ticket: Ticket;
  const qb = {
    leftJoin: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(() => Promise.resolve(ticket)),
  };
  const repo = {
    createQueryBuilder: jest.fn(() => qb),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: Ticket) => Promise.resolve({ ...data, id: 't1' })),
    findOne: jest.fn(() => Promise.resolve(ticket)),
    delete: jest.fn(() => Promise.resolve()),
  };
  const service = new TicketsService(repo as never);

  const autor: UsuarioTicket = {
    id: 'u1',
    rol: { permisos: [{ codigo: 'tickets:crear' }] },
  };
  const otro: UsuarioTicket = {
    id: 'u2',
    rol: { permisos: [{ codigo: 'tickets:crear' }] },
  };
  const admin: UsuarioTicket = {
    id: 'u3',
    rol: { permisos: [{ codigo: 'tickets:gestionar' }] },
  };
  const superAdmin: UsuarioTicket = { id: 'u4', rol: { es_super_admin: true } };

  const pdf = (contenido: string, mimetype = 'application/pdf') =>
    ({
      buffer: Buffer.from(contenido),
      size: contenido.length,
      mimetype,
      originalname: 'propuesta.pdf',
    }) as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
    ticket = {
      id: 't1',
      numero: 1,
      titulo: 'Agregar reporte',
      estado: EstadoTicket.ABIERTO,
      respuesta: null,
      cerrado_en: null,
      documento_nombre: 'propuesta.pdf',
      documento_path: 'abc.pdf',
      creado_por: { id: 'u1' },
    } as Ticket;
  });

  it('no carga más datos del autor que id y nombre', async () => {
    await service.findOne('t1');
    expect(qb.leftJoin).toHaveBeenCalledWith('t.creado_por', 'creado_por');
    expect(qb.addSelect).toHaveBeenCalledWith([
      'creado_por.id',
      'creado_por.nombre',
    ]);
  });

  it('sabe quién puede gestionar tickets', () => {
    expect(service.puedeGestionar(autor)).toBe(false);
    expect(service.puedeGestionar(admin)).toBe(true);
    expect(service.puedeGestionar(superAdmin)).toBe(true);
  });

  it('crea el ticket con el PDF guardado con nombre aleatorio', async () => {
    await service.create(
      { titulo: ' Nuevo módulo ', descripcion: ' Detalle ' },
      'u1',
      pdf('%PDF-1.7 contenido'),
    );
    const creado = repo.create.mock.calls[0][0] as Partial<Ticket>;
    expect(creado).toMatchObject({
      titulo: 'Nuevo módulo',
      descripcion: 'Detalle',
      documento_nombre: 'propuesta.pdf',
      creado_por: { id: 'u1' },
    });
    expect(creado.documento_path).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  it('rechaza archivos que no son PDF aunque digan serlo', async () => {
    await expect(
      service.create(
        { titulo: 'x', descripcion: 'y' },
        'u1',
        pdf('MZ ejecutable'),
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.create(
        { titulo: 'x', descripcion: 'y' },
        'u1',
        pdf('%PDF-1.7', 'image/png'),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('solo el autor o un gestor pueden ver el ticket', async () => {
    await expect(service.findOneVisible('t1', autor)).resolves.toBe(ticket);
    await expect(service.findOneVisible('t1', admin)).resolves.toBe(ticket);
    await expect(service.findOneVisible('t1', otro)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('marca la fecha de cierre al completar y la quita al reabrir', async () => {
    await service.update('t1', {
      estado: EstadoTicket.COMPLETADO,
      respuesta: ' Listo ',
    });
    expect(ticket.cerrado_en).toBeInstanceOf(Date);
    expect(ticket.respuesta).toBe('Listo');

    await service.update('t1', { estado: EstadoTicket.EN_PROGRESO });
    expect(ticket.cerrado_en).toBeNull();
  });

  it('ignora campos que no son editables', async () => {
    await service.update('t1', {
      titulo: 'Cambiado',
      creado_por: { id: 'hack' },
    } as unknown as UpdateTicketDto);
    expect(ticket.titulo).toBe('Agregar reporte');
    expect(ticket.creado_por).toEqual({ id: 'u1' });
  });

  it('borra el PDF del disco al eliminar el ticket', async () => {
    await service.remove('t1');
    expect(fs.rmSync).toHaveBeenCalledWith(
      expect.stringMatching(/tickets[/\\]abc\.pdf$/),
      {
        force: true,
      },
    );
    expect(repo.delete).toHaveBeenCalledWith('t1');
  });
});

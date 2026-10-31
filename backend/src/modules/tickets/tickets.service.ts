import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EstadoTicket, Ticket } from './ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';

export const PERMISO_GESTIONAR_TICKETS = 'tickets:gestionar';
export const TAMANO_MAXIMO_PDF = 10 * 1024 * 1024;

export interface UsuarioTicket {
  id: string;
  rol?: { es_super_admin?: boolean; permisos?: { codigo: string }[] };
}

function decodeFileName(name: string): string {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
}

@Injectable()
export class TicketsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'tickets');

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  puedeGestionar(user: UsuarioTicket): boolean {
    return (
      !!user.rol?.es_super_admin ||
      !!user.rol?.permisos?.some((p) => p.codigo === PERMISO_GESTIONAR_TICKETS)
    );
  }

  private guardarPdf(file: Express.Multer.File): string {
    // Se valida el contenido además del mimetype que envía el navegador
    const esPdf =
      file.mimetype === 'application/pdf' &&
      file.buffer.subarray(0, 5).toString('latin1') === '%PDF-';
    if (!esPdf) {
      throw new BadRequestException('El documento debe ser un archivo PDF');
    }
    if (file.size > TAMANO_MAXIMO_PDF) {
      throw new BadRequestException('El PDF no puede pesar más de 10 MB');
    }
    fs.mkdirSync(this.uploadDir, { recursive: true });
    const nombre = `${randomUUID()}.pdf`;
    fs.writeFileSync(path.join(this.uploadDir, nombre), file.buffer);
    return nombre;
  }

  async create(
    dto: CreateTicketDto,
    usuarioId: string,
    file?: Express.Multer.File,
  ): Promise<Ticket> {
    const documento = file ? this.guardarPdf(file) : null;
    const ticket = this.ticketRepo.create({
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion.trim(),
      tipo: dto.tipo,
      prioridad: dto.prioridad,
      documento_path: documento,
      documento_nombre: file ? decodeFileName(file.originalname) : null,
      creado_por: { id: usuarioId } as Ticket['creado_por'],
    });
    const guardado = await this.ticketRepo.save(ticket);
    return this.findOne(guardado.id);
  }

  // Solo id y nombre del autor; no hace falta exponer correo ni rol
  private consulta() {
    return this.ticketRepo
      .createQueryBuilder('t')
      .leftJoin('t.creado_por', 'creado_por')
      .addSelect(['creado_por.id', 'creado_por.nombre']);
  }

  async findMios(usuarioId: string): Promise<Ticket[]> {
    return this.consulta()
      .where('creado_por.id = :usuarioId', { usuarioId })
      .orderBy('t.creado_en', 'DESC')
      .getMany();
  }

  async findAll(filters?: FilterTicketDto): Promise<Ticket[]> {
    const query = this.consulta().orderBy('t.creado_en', 'DESC');

    if (filters?.estado) {
      query.andWhere('t.estado = :estado', { estado: filters.estado });
    }
    if (filters?.buscar) {
      const numero = Number(filters.buscar.replace('#', ''));
      query.andWhere(
        `(t.titulo ILIKE :buscar OR t.descripcion ILIKE :buscar${
          Number.isInteger(numero) && numero > 0 ? ' OR t.numero = :numero' : ''
        })`,
        { buscar: `%${filters.buscar}%`, numero },
      );
    }
    return query.getMany();
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.consulta().where('t.id = :id', { id }).getOne();
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }
    return ticket;
  }

  async findOneVisible(id: string, user: UsuarioTicket): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!this.puedeGestionar(user) && ticket.creado_por?.id !== user.id) {
      throw new ForbiddenException('No tienes acceso a este ticket');
    }
    return ticket;
  }

  async getDocumento(
    id: string,
    user: UsuarioTicket,
  ): Promise<{ ruta: string; nombre: string }> {
    const ticket = await this.findOneVisible(id, user);
    const conRuta = await this.ticketRepo.findOne({
      where: { id },
      select: ['id', 'documento_path'],
    });
    const ruta = conRuta?.documento_path
      ? path.join(this.uploadDir, path.basename(conRuta.documento_path))
      : null;
    if (!ruta || !fs.existsSync(ruta)) {
      throw new NotFoundException('Este ticket no tiene documento');
    }
    return {
      ruta,
      nombre: ticket.documento_nombre || `ticket-${ticket.numero}.pdf`,
    };
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    // El ValidationPipe global no aplica whitelist: copiar solo campos editables.
    if (dto.prioridad !== undefined) ticket.prioridad = dto.prioridad;
    if (dto.respuesta !== undefined) {
      ticket.respuesta = dto.respuesta.trim() || null;
    }
    if (dto.estado !== undefined && dto.estado !== ticket.estado) {
      ticket.estado = dto.estado;
      const cerrado = [EstadoTicket.COMPLETADO, EstadoTicket.RECHAZADO];
      ticket.cerrado_en = cerrado.includes(dto.estado) ? new Date() : null;
    }
    await this.ticketRepo.save(ticket);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      select: ['id', 'documento_path'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }
    if (ticket.documento_path) {
      fs.rmSync(
        path.join(this.uploadDir, path.basename(ticket.documento_path)),
        {
          force: true,
        },
      );
    }
    await this.ticketRepo.delete(id);
  }
}

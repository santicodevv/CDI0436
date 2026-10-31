import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ayuda, EstadoAyuda } from './ayuda.entity';
import { ComentarioAyuda } from './comentario-ayuda.entity';
import {
  CONFIGURACION_AYUDAS_ID,
  ConfiguracionAyudas,
} from './configuracion-ayudas.entity';
import { CreateAyudaDto } from './dto/create-ayuda.dto';
import { UpdateEstadoAyudaDto } from './dto/update-estado-ayuda.dto';
import { UpdateFotoEntregaDto } from './dto/update-foto-entrega.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateDisponibilidadAyudasDto } from './dto/update-disponibilidad-ayudas.dto';
import { WhatsappService } from './whatsapp.service';
import { WebhookService } from './webhook.service';
import * as XLSX from 'xlsx';

@Injectable()
export class AyudasService {
  constructor(
    @InjectRepository(Ayuda)
    private ayudasRepository: Repository<Ayuda>,
    @InjectRepository(ComentarioAyuda)
    private comentariosRepository: Repository<ComentarioAyuda>,
    @InjectRepository(ConfiguracionAyudas)
    private configuracionRepository: Repository<ConfiguracionAyudas>,
    private whatsappService: WhatsappService,
    private webhookService: WebhookService,
  ) {}

  async create(createAyudaDto: CreateAyudaDto): Promise<Ayuda> {
    const disponibilidad = await this.getDisponibilidad();
    if (!disponibilidad.habilitada) {
      throw new ForbiddenException(
        disponibilidad.motivo ||
          'Las solicitudes de ayuda están cerradas temporalmente',
      );
    }

    const ayuda = this.ayudasRepository.create(createAyudaDto);
    return await this.ayudasRepository.save(ayuda);
  }

  async getDisponibilidad(): Promise<ConfiguracionAyudas> {
    const configuracion = await this.configuracionRepository.findOne({
      where: { id: CONFIGURACION_AYUDAS_ID },
    });
    // Sin fila guardada, las solicitudes se consideran abiertas.
    return (
      configuracion ??
      this.configuracionRepository.create({
        id: CONFIGURACION_AYUDAS_ID,
        habilitada: true,
        motivo: null,
        actualizado_por: null,
      })
    );
  }

  async updateDisponibilidad(
    dto: UpdateDisponibilidadAyudasDto,
    actualizadoPor?: string,
  ): Promise<ConfiguracionAyudas> {
    const configuracion = await this.getDisponibilidad();
    configuracion.habilitada = dto.habilitada;
    configuracion.motivo = dto.habilitada ? null : dto.motivo!.trim();
    configuracion.actualizado_por = actualizadoPor ?? null;
    return await this.configuracionRepository.save(configuracion);
  }

  async findAll(): Promise<Ayuda[]> {
    return await this.ayudasRepository.find({
      order: { creado_en: 'DESC' },
    });
  }

  // El código lo escribe el solicitante en el formulario público, por eso se
  // compara sin espacios ni distinción de mayúsculas.
  async findByCodigoBeneficiario(codigo: string): Promise<Ayuda[]> {
    return await this.ayudasRepository
      .createQueryBuilder('a')
      .where('UPPER(TRIM(a.codigo_beneficiario)) = UPPER(TRIM(:codigo))', {
        codigo,
      })
      .orderBy('a.creado_en', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Ayuda> {
    const ayuda = await this.ayudasRepository.findOne({ where: { id } });
    if (!ayuda) {
      throw new NotFoundException(`Ayuda con ID ${id} no encontrada`);
    }
    return ayuda;
  }

  async updateEstado(
    id: string,
    updateEstadoDto: UpdateEstadoAyudaDto,
  ): Promise<Ayuda> {
    const ayuda = await this.findOne(id);
    ayuda.estado = updateEstadoDto.estado;
    const saved = await this.ayudasRepository.save(ayuda);

    // Enviar webhook a n8n para procesar la notificación de WhatsApp
    if (
      saved.estado === EstadoAyuda.APROBADA ||
      saved.estado === EstadoAyuda.RECHAZADA
    ) {
      this.webhookService.notificarCambioEstado(saved, saved.estado);
    }

    // También mantener envío directo de WhatsApp como respaldo (opcional)
    // Si prefieres usar solo n8n, puedes comentar o eliminar este bloque
    if (saved.telefono) {
      const estadoTexto =
        saved.estado === EstadoAyuda.APROBADA ? 'aprobada ✅' : 'rechazada ❌';
      const mensaje = `Hola ${saved.nombre_beneficiario}, le informamos que su solicitud de ayuda (${saved.tipo}) ha sido ${estadoTexto}. CDI - Centro de Desarrollo Integral.`;
      // Se envía de forma asíncrona sin bloquear la respuesta
      this.whatsappService.enviarMensaje(saved.telefono, mensaje);
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const ayuda = await this.findOne(id);
    await this.ayudasRepository.remove(ayuda);
  }

  async updateFotoEntrega(
    id: string,
    updateFotoEntregaDto: UpdateFotoEntregaDto,
  ): Promise<Ayuda> {
    const ayuda = await this.findOne(id);
    ayuda.foto_entrega_url = updateFotoEntregaDto.foto_entrega_url;
    return await this.ayudasRepository.save(ayuda);
  }

  async exportarAExcel(): Promise<Buffer> {
    const ayudas = await this.findAll();

    const getTipoLabel = (tipo: string, especificacion?: string) => {
      switch (tipo) {
        case 'medica':
          return 'MEDICA';
        case 'alimentos':
          return 'ALIMENTOS';
        case 'pequeno_negocio':
          return 'PEQUENO NEGOCIO';
        case 'educacion':
          return 'EDUCACION';
        case 'otros':
          return especificacion ? `OTROS: ${especificacion}` : 'OTROS';
        default:
          return tipo.toUpperCase();
      }
    };

    const data = ayudas.map((a) => ({
      CODIGO: a.codigo_beneficiario,
      BENEFICIARIO: a.nombre_beneficiario,
      TELEFONO: a.telefono || '',
      'PADRE/TUTOR': a.nombre_madre,
      PROFESOR: a.nombre_tutor,
      TIPO: getTipoLabel(a.tipo, a.tipo_especificacion),
      ESTADO: a.estado.toUpperCase(),
      DETALLE: a.detalle,
      'TIENE FOTO': a.foto_url ? 'SI' : 'NO',
      'FECHA SOLICITUD': new Date(a.creado_en).toLocaleString('es-DO'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const columnWidths = [
      { wch: 15 }, // CODIGO
      { wch: 25 }, // BENEFICIARIO
      { wch: 15 }, // TELEFONO
      { wch: 25 }, // PADRE/TUTOR
      { wch: 25 }, // PROFESOR
      { wch: 20 }, // TIPO
      { wch: 15 }, // ESTADO
      { wch: 40 }, // DETALLE
      { wch: 12 }, // TIENE FOTO
      { wch: 20 }, // FECHA
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitudes de Ayuda');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // Métodos para comentarios
  async createComentario(
    ayudaId: string,
    createComentarioDto: CreateComentarioDto,
  ): Promise<ComentarioAyuda> {
    await this.findOne(ayudaId); // Verificar que la ayuda existe

    const comentario = this.comentariosRepository.create({
      ...createComentarioDto,
      ayuda_id: ayudaId,
    });

    return await this.comentariosRepository.save(comentario);
  }

  async getComentarios(ayudaId: string): Promise<ComentarioAyuda[]> {
    return await this.comentariosRepository.find({
      where: { ayuda_id: ayudaId },
      order: { creado_en: 'DESC' },
    });
  }
}

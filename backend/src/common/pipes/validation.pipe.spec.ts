import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, ValidateNested } from 'class-validator';
import { ValidationPipe } from './validation.pipe';
import { UpdateClubDto } from '../../modules/clubs/dto/update-club.dto';
import { CreateComentarioDto } from '../../modules/ayudas/dto/create-comentario.dto';

class Item {
  @IsInt()
  cantidad: number;
}

class ConItems {
  @ValidateNested({ each: true })
  @Type(() => Item)
  items: Item[];
}

describe('ValidationPipe', () => {
  const pipe = new ValidationPipe();

  const errorDe = async (metatype: unknown, value: unknown) => {
    try {
      await pipe.transform(value, {
        type: 'body',
        metatype: metatype as never,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      return (e as BadRequestException).getResponse() as {
        message: string;
        errors: { field: string; messages: string[] }[];
      };
    }
    throw new Error('Se esperaba un error de validación');
  };

  it('dice qué campo falló, en español', async () => {
    const res = await errorDe(UpdateClubDto, {
      tutor_id: 'a0000000-0000-0000-0000-000000000002',
    });
    expect(res.message).toBe('Tutor no es un identificador válido.');
    expect(res.errors).toEqual([
      { field: 'tutor_id', messages: ['Tutor no es un identificador válido'] },
    ]);
  });

  it('mantiene los mensajes propios de los DTOs', async () => {
    const res = await errorDe(CreateComentarioDto, {
      contenido: '',
      autor: 'Ana',
    });
    expect(res.message).toBe('El contenido del comentario es requerido.');
  });

  it('nombra los campos anidados', async () => {
    const res = await errorDe(ConItems, {
      items: [{ cantidad: 1 }, { cantidad: 'x' }],
    });
    expect(res.errors).toEqual([
      {
        field: 'items.1.cantidad',
        messages: ['Cantidad debe ser un número entero'],
      },
    ]);
  });

  it('deja pasar los datos válidos', async () => {
    const value = { nombre: 'Club de Lectura', capacidad_maxima: 10 };
    await expect(
      pipe.transform(value, { type: 'body', metatype: UpdateClubDto }),
    ).resolves.toBe(value);
  });
});

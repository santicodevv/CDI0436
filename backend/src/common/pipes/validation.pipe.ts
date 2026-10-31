import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Mensajes por defecto de class-validator (en inglés) traducidos para el usuario.
const MENSAJES: Record<string, string> = {
  isNotEmpty: 'es obligatorio',
  isDefined: 'es obligatorio',
  isString: 'debe ser texto',
  isInt: 'debe ser un número entero',
  isNumber: 'debe ser un número',
  isPositive: 'debe ser mayor que cero',
  min: 'es menor que el mínimo permitido',
  max: 'es mayor que el máximo permitido',
  minLength: 'es demasiado corto',
  maxLength: 'es demasiado largo',
  isEmail: 'no es un correo válido',
  isUuid: 'no es un identificador válido',
  isEnum: 'tiene un valor no permitido',
  isIn: 'tiene un valor no permitido',
  isBoolean: 'debe ser verdadero o falso',
  isDateString: 'no es una fecha válida',
  isDate: 'no es una fecha válida',
  isISO8601: 'no es una fecha válida',
  matches: 'no tiene el formato correcto',
  isArray: 'debe ser una lista',
  arrayNotEmpty: 'no puede estar vacío',
  isObject: 'no tiene el formato correcto',
};

// "tutor_id" → "Tutor", "capacidad_maxima" → "Capacidad maxima".
const etiquetaCampo = (campo: string) => {
  const texto = campo.replace(/_id$/, '').replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export interface ErrorCampo {
  field: string;
  messages: string[];
}

// Aplana errores anidados ("beneficiarios.0.estado") y traduce los mensajes por
// defecto; los mensajes propios definidos en los DTOs se mantienen tal cual.
export function formatearErrores(
  errores: ValidationError[],
  prefijo = '',
): ErrorCampo[] {
  return errores.flatMap((err) => {
    const campo = prefijo ? `${prefijo}.${err.property}` : err.property;
    const propios = Object.entries(err.constraints || {}).map(
      ([clave, mensaje]) => {
        const porDefecto =
          mensaje.startsWith(`${err.property} `) ||
          mensaje.startsWith('each value in ');
        return porDefecto && MENSAJES[clave]
          ? `${etiquetaCampo(err.property)} ${MENSAJES[clave]}`
          : mensaje;
      },
    );
    return [
      ...(propios.length ? [{ field: campo, messages: propios }] : []),
      ...formatearErrores(err.children || [], campo),
    ];
  });
}

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length === 0) {
      return value;
    }

    const formattedErrors = formatearErrores(errors);

    throw new BadRequestException({
      statusCode: 400,
      message: formattedErrors
        .flatMap((e) => e.messages)
        .map((m) => (m.endsWith('.') ? m : `${m}.`))
        .join(' '),
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    });
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

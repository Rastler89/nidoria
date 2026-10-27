import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const BANNER_VARIANTS = ['info', 'warning', 'danger'] as const;
export type BannerVariant = (typeof BANNER_VARIANTS)[number];

export interface BannerInput {
  message?: unknown;
  linkLabel?: unknown;
  linkUrl?: unknown;
  variant?: unknown;
  active?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  priority?: unknown;
}

const MAX_MESSAGE_LENGTH = 500;
const MAX_LABEL_LENGTH = 60;

@Injectable()
export class BannerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Banners visibles ahora mismo: activos y dentro de su ventana de fechas. */
  findActive(now: Date = new Date()) {
    return this.prisma.banner.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findAll() {
    return this.prisma.banner.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(input: BannerInput) {
    const data = this.normalize(input, true);
    this.validateWindow(data.startsAt ?? null, data.endsAt ?? null);
    return this.prisma.banner.create({
      data: data as Prisma.BannerUncheckedCreateInput,
    });
  }

  async update(id: number, input: BannerInput) {
    const existing = await this.findOrFail(id);
    const data = this.normalize(input, false);
    this.validateWindow(
      data.startsAt !== undefined ? data.startsAt : existing.startsAt,
      data.endsAt !== undefined ? data.endsAt : existing.endsAt,
    );
    return this.prisma.banner.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOrFail(id);
    return this.prisma.banner.delete({ where: { id } });
  }

  private async findOrFail(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Identificador de banner inválido');
    }
    const found = await this.prisma.banner.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Banner no encontrado');
    }
    return found;
  }

  /** Valida y normaliza los campos recibidos. En creación exige `message`. */
  private normalize(input: BannerInput, requireMessage: boolean) {
    const data: {
      message?: string;
      linkLabel?: string | null;
      linkUrl?: string | null;
      variant?: string;
      active?: boolean;
      startsAt?: Date | null;
      endsAt?: Date | null;
      priority?: number;
    } = {};

    if (input.message !== undefined || requireMessage) {
      const message =
        typeof input.message === 'string' ? input.message.trim() : '';
      if (!message) {
        throw new BadRequestException('El mensaje del banner es obligatorio');
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new BadRequestException(
          `El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres`,
        );
      }
      data.message = message;
    }

    if (input.linkLabel !== undefined) {
      data.linkLabel = this.optionalText(
        input.linkLabel,
        MAX_LABEL_LENGTH,
        'El texto del enlace',
      );
    }

    if (input.linkUrl !== undefined) {
      data.linkUrl = this.normalizeUrl(input.linkUrl);
    }

    if (input.variant !== undefined) {
      const variant =
        typeof input.variant === 'string'
          ? input.variant.trim().toLowerCase()
          : '';
      if (!BANNER_VARIANTS.includes(variant as BannerVariant)) {
        throw new BadRequestException(
          `El color debe ser uno de: ${BANNER_VARIANTS.join(', ')}`,
        );
      }
      data.variant = variant;
    }

    if (input.active !== undefined) {
      if (typeof input.active !== 'boolean') {
        throw new BadRequestException('El campo activo debe ser booleano');
      }
      data.active = input.active;
    }

    if (input.priority !== undefined) {
      const priority = Number(input.priority);
      if (!Number.isInteger(priority)) {
        throw new BadRequestException('La prioridad debe ser un número entero');
      }
      data.priority = priority;
    }

    if (input.startsAt !== undefined) {
      data.startsAt = this.optionalDate(input.startsAt, 'La fecha de inicio');
    }

    if (input.endsAt !== undefined) {
      data.endsAt = this.optionalDate(input.endsAt, 'La fecha de fin');
    }

    const startsAt = data.startsAt !== undefined ? data.startsAt : undefined;
    const endsAt = data.endsAt !== undefined ? data.endsAt : undefined;
    if (startsAt && endsAt && endsAt < startsAt) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }

    return data;
  }

  private validateWindow(startsAt: Date | null, endsAt: Date | null) {
    if (startsAt && endsAt && endsAt < startsAt) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }
  }

  private optionalText(
    value: unknown,
    maxLength: number,
    label: string,
  ): string | null {
    if (value === null || value === '') return null;
    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} no es válido`);
    }
    const text = value.trim();
    if (!text) return null;
    if (text.length > maxLength) {
      throw new BadRequestException(
        `${label} no puede superar ${maxLength} caracteres`,
      );
    }
    return text;
  }

  private normalizeUrl(value: unknown): string | null {
    if (value === null || value === '') return null;
    if (typeof value !== 'string') {
      throw new BadRequestException('La URL del enlace no es válida');
    }
    const url = value.trim();
    if (!url) return null;
    if (url.startsWith('/')) return url;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('protocolo no permitido');
      }
      return parsed.toString();
    } catch {
      throw new BadRequestException(
        'La URL del enlace debe usar http(s) o empezar por /',
      );
    }
  }

  private optionalDate(value: unknown, label: string): Date | null {
    if (value === null || value === '') return null;
    if (typeof value !== 'string' && !(value instanceof Date)) {
      throw new BadRequestException(`${label} no es válida`);
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} no es válida`);
    }
    return date;
  }
}

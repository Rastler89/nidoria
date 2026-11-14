import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReportType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateReportInput {
  ownerId: number;
  type: ReportType;
  battleId?: number | null;
  title: string;
  body: Prisma.InputJsonValue;
}

export interface ListReportsOptions {
  page?: number;
  limit?: number;
  type?: ReportType;
  unreadOnly?: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Buzón del jugador. Los reportes son la única fuente de verdad de lo que ha
 * pasado mientras estaba desconectado: batallas PvE/PvP, avisos del sistema y,
 * más adelante, actividad de alianza (`ReportType.ALLIANCE`).
 *
 * La lectura es siempre por `ownerId`: ningún endpoint acepta un id de usuario
 * del cliente.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateReportInput) {
    return this.prisma.report.create({
      data: {
        ownerId: input.ownerId,
        type: input.type,
        battleId: input.battleId ?? null,
        title: input.title,
        body: input.body,
      },
    });
  }

  async list(ownerId: number, options: ListReportsOptions = {}) {
    const page = Math.max(1, Math.floor(Number(options.page) || 1));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Math.floor(Number(options.limit) || DEFAULT_LIMIT)),
    );

    const where: Prisma.ReportWhereInput = { ownerId };

    if (options.type) {
      where.type = options.type;
    }

    if (options.unreadOnly) {
      where.readAt = null;
    }

    const [total, unread, items] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.count({ where: { ownerId, readAt: null } }),
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      page,
      limit,
      total,
      unread,
      pages: Math.max(1, Math.ceil(total / limit)),
      items: items.map((report) => this.toSummary(report)),
    };
  }

  async get(ownerId: number, reportId: number) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, ownerId },
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return {
      id: report.id,
      type: report.type,
      battleId: report.battleId,
      title: report.title,
      body: report.body,
      readAt: report.readAt,
      createdAt: report.createdAt,
    };
  }

  /** Marca un reporte como leído. Devuelve `null` si ya no existe. */
  async markRead(ownerId: number, reportId: number) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, ownerId },
      select: { id: true, readAt: true },
    });

    if (!report) {
      throw new NotFoundException('Reporte no encontrado');
    }

    if (report.readAt) {
      return { id: report.id, readAt: report.readAt, unread: await this.unreadCount(ownerId) };
    }

    const updated = await this.prisma.report.update({
      where: { id: report.id },
      data: { readAt: new Date() },
      select: { id: true, readAt: true },
    });

    return {
      id: updated.id,
      readAt: updated.readAt,
      unread: await this.unreadCount(ownerId),
    };
  }

  async markAllRead(ownerId: number) {
    const result = await this.prisma.report.updateMany({
      where: { ownerId, readAt: null },
      data: { readAt: new Date() },
    });

    return { updated: result.count, unread: 0 };
  }

  async unreadCount(ownerId: number) {
    return this.prisma.report.count({ where: { ownerId, readAt: null } });
  }

  private toSummary(report: {
    id: number;
    type: ReportType;
    battleId: number | null;
    title: string;
    body: Prisma.JsonValue;
    readAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: report.id,
      type: report.type,
      battleId: report.battleId,
      title: report.title,
      body: report.body,
      read: report.readAt != null,
      readAt: report.readAt,
      createdAt: report.createdAt,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';

@Injectable()
export class BroadcastsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBroadcastDto) {
    const client = await this.prisma.client();
    return client.broadcast.create({
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      } as any,
    });
  }

  async findAll(status?: string) {
    const client = await this.prisma.client();
    return client.broadcast.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        location: true,
      },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client();
    const broadcast = await client.broadcast.findUnique({
      where: { id },
      include: {
        location: true,
        logs: {
          take: 10,
          orderBy: { sentAt: 'desc' },
        },
      },
    });
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    return broadcast;
  }

  async update(id: string, dto: UpdateBroadcastDto) {
    const client = await this.prisma.client();
    const broadcast = await client.broadcast.findUnique({ where: { id } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    return client.broadcast.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      } as any,
    });
  }

  async remove(id: string) {
    const client = await this.prisma.client();
    const broadcast = await client.broadcast.findUnique({ where: { id } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    return client.broadcast.delete({ where: { id } });
  }

  async getStats() {
    const client = await this.prisma.client();
    const [total, sent, scheduled, draft] = await Promise.all([
      client.broadcast.count(),
      client.broadcast.count({ where: { status: 'sent' } }),
      client.broadcast.count({ where: { status: 'scheduled' } }),
      client.broadcast.count({ where: { status: 'draft' } }),
    ]);

    return { total, sent, scheduled, draft };
  }
}


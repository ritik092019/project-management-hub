import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.team.findMany({
      include: {
        members: true,
        projects: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        members: true,
        projects: {
          include: {
            owner: true,
            supervisor: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID "${id}" not found`);
    }

    return team;
  }

  async create(createTeamDto: CreateTeamDto) {
    const existing = await this.prisma.team.findUnique({
      where: { name: createTeamDto.name },
    });

    if (existing) {
      throw new ConflictException(`Team with name "${createTeamDto.name}" already exists`);
    }

    return this.prisma.team.create({
      data: createTeamDto,
      include: { members: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.team.delete({ where: { id } });
  }
}

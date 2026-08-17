import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTechnologyDto } from './dto/create-technology.dto';

@Injectable()
export class TechnologiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.technology.findMany({
      include: {
        _count: {
          select: { projectTechnologies: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tech = await this.prisma.technology.findUnique({
      where: { id },
      include: {
        projectTechnologies: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!tech) {
      throw new NotFoundException(`Technology with ID "${id}" not found`);
    }

    return tech;
  }

  async create(createTechDto: CreateTechnologyDto) {
    const existing = await this.prisma.technology.findUnique({
      where: { name: createTechDto.name },
    });

    if (existing) {
      throw new ConflictException(`Technology "${createTechDto.name}" already exists`);
    }

    return this.prisma.technology.create({
      data: createTechDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.technology.delete({ where: { id } });
  }
}

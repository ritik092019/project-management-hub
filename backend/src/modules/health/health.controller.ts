import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('System & Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System health check (Database, Memory, Uptime)' })
  @ApiResponse({ status: 200, description: 'System healthy' })
  @ApiResponse({ status: 503, description: 'System unhealthy (Database offline)' })
  async checkHealth(@Res() res: Response) {
    const startTime = Date.now();
    let dbStatus = 'DOWN';
    let dbLatencyMs = -1;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'UP';
    } catch (error) {
      dbStatus = 'DOWN';
    }

    const memoryUsage = process.memoryUsage();
    const isHealthy = dbStatus === 'UP';

    const healthReport = {
      status: isHealthy ? 'OK' : 'ERROR',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          engine: 'SQLite / PostgreSQL (Prisma)',
        },
        memory: {
          heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        },
      },
      responseTimeMs: Date.now() - startTime,
    };

    return res.status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(healthReport);
  }

  @Public()
  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe endpoint for orchestrators (Kubernetes/Docker)' })
  @ApiResponse({ status: 200, description: 'Service alive' })
  getLiveness() {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }
}

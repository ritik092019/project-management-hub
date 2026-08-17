import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TechnologiesService } from './technologies.service';
import { CreateTechnologyDto } from './dto/create-technology.dto';
import { TechnologyResponseDto } from './dto/technology-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Technologies')
@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all technologies' })
  @ApiResponse({ status: 200, description: 'List of all technologies', type: [TechnologyResponseDto] })
  async findAll() {
    return this.technologiesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get technology by ID' })
  @ApiParam({ name: 'id', description: 'Technology UUID' })
  @ApiResponse({ status: 200, description: 'Technology details', type: TechnologyResponseDto })
  @ApiResponse({ status: 404, description: 'Technology not found' })
  async findOne(@Param('id') id: string) {
    return this.technologiesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new technology (Admin only)' })
  @ApiResponse({ status: 201, description: 'Technology created successfully', type: TechnologyResponseDto })
  @ApiResponse({ status: 409, description: 'Technology already exists' })
  async create(@Body() createTechDto: CreateTechnologyDto) {
    return this.technologiesService.create(createTechDto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete technology (Admin only)' })
  @ApiParam({ name: 'id', description: 'Technology UUID' })
  @ApiResponse({ status: 200, description: 'Technology deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.technologiesService.remove(id);
  }
}

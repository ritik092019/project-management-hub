import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamResponseDto } from './dto/team-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({ status: 200, description: 'List of all teams', type: [TeamResponseDto] })
  async findAll() {
    return this.teamsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({ status: 200, description: 'Team details with members and projects', type: TeamResponseDto })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new team (Admin only)' })
  @ApiResponse({ status: 201, description: 'Team created successfully', type: TeamResponseDto })
  @ApiResponse({ status: 409, description: 'Team name already exists' })
  async create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete team (Admin only)' })
  @ApiParam({ name: 'id', description: 'Team UUID' })
  @ApiResponse({ status: 200, description: 'Team deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.teamsService.remove(id);
  }
}

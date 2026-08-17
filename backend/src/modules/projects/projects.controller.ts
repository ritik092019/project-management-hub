import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterDto } from './dto/project-filter.dto';
import { ProjectResponseDto } from './dto/project-response.dto';
import {
  UpdateProjectStatusDto,
  AssignSupervisorDto,
  AssignTeamDto,
  ManageTechnologiesDto,
} from './dto/project-action.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all projects with search, filtering, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated project list with metadata' })
  async findAll(@Query() filterDto: ProjectFilterDto) {
    return this.projectsService.findAll(filterDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get project details by ID' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project details', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project (Admin, Supervisor, Developer/Student)' })
  @ApiResponse({ status: 201, description: 'Project created successfully', type: ProjectResponseDto })
  async create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() currentUser: any) {
    return this.projectsService.create(createProjectDto, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing project (PATCH)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: ProjectResponseDto })
  async updatePatch(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Put(':id')
  @ApiOperation({ summary: 'Update an existing project (PUT)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully', type: ProjectResponseDto })
  async updatePut(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete/archive project (Owner or Admin)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.projectsService.remove(id, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit project for supervisor review' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project submitted for review successfully' })
  async submitForReview(@Param('id') id: string, @CurrentUser() currentUser: any) {
    return this.projectsService.submitForReview(id, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status or approval status' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.projectsService.updateStatus(id, dto, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @Patch(':id/supervisor')
  @ApiOperation({ summary: 'Assign supervisor to project (Admin or Supervisor)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Supervisor assigned successfully' })
  async assignSupervisor(
    @Param('id') id: string,
    @Body() dto: AssignSupervisorDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.projectsService.assignSupervisor(id, dto.supervisorId, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @Patch(':id/team')
  @ApiOperation({ summary: 'Assign team to project (Admin or Supervisor)' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Team assigned successfully' })
  async assignTeam(
    @Param('id') id: string,
    @Body() dto: AssignTeamDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.projectsService.assignTeam(id, dto.teamId, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Post(':id/technologies')
  @ApiOperation({ summary: 'Add technology links to project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Technologies added successfully' })
  async addTechnologies(
    @Param('id') id: string,
    @Body() dto: ManageTechnologiesDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.projectsService.addTechnologies(id, dto.technologyIds, currentUser);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEVELOPER)
  @Delete(':id/technologies/:techId')
  @ApiOperation({ summary: 'Remove technology link from project' })
  @ApiParam({ name: 'id', description: 'Project UUID' })
  @ApiParam({ name: 'techId', description: 'Technology UUID' })
  @ApiResponse({ status: 200, description: 'Technology removed successfully' })
  async removeTechnology(
    @Param('id') id: string,
    @Param('techId') techId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.projectsService.removeTechnology(id, techId, currentUser);
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterDto } from './dto/project-filter.dto';
import { UpdateProjectStatusDto } from './dto/project-action.dto';
import { Prisma, UserRole, ProjectCategory, ProjectStatus, ApprovalStatus, Priority } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private formatProject(project: any) {
    if (!project) return null;

    const techStack = project.technologies
      ? project.technologies.map((pt: any) => pt.technology?.name).filter(Boolean)
      : [];

    const ownerName = project.owner?.name || 'Unassigned';
    const ownerEmail = project.owner?.email || '';
    const supervisorName = project.supervisor?.name || 'Unassigned';
    const supervisorEmail = project.supervisor?.email || '';
    const teamName = project.team?.name || 'Unassigned';

    return {
      ...project,
      owner: ownerName,
      ownerEmail,
      ownerId: project.ownerId,
      ownerDetails: project.owner
        ? {
            id: project.owner.id,
            name: project.owner.name,
            email: project.owner.email,
            avatar: project.owner.avatar,
            role: project.owner.role,
            department: project.owner.department,
            title: project.owner.title,
          }
        : null,
      supervisor: supervisorName,
      supervisorEmail,
      supervisorId: project.supervisorId,
      supervisorDetails: project.supervisor
        ? {
            id: project.supervisor.id,
            name: project.supervisor.name,
            email: project.supervisor.email,
            avatar: project.supervisor.avatar,
            role: project.supervisor.role,
            department: project.supervisor.department,
            title: project.supervisor.title,
          }
        : null,
      teamId: project.teamId,
      teamName,
      teamDetails: project.team,
      techStack,
      links: {
        github: project.githubUrl || undefined,
        live: project.liveUrl || undefined,
        demo: project.demoUrl || undefined,
        docs: project.documentationUrl || project.docsUrl || undefined,
      },
      documentationUrl: project.documentationUrl || project.docsUrl,
      docsUrl: project.docsUrl || project.documentationUrl,
      imageUrl: project.imageUrl || project.thumbnail,
      thumbnail: project.thumbnail || project.imageUrl,
    };
  }

  async findAll(filter: ProjectFilterDto) {
    const {
      search,
      owner,
      ownerId,
      supervisor,
      supervisorId,
      team,
      teamId,
      technology,
      tech,
      category,
      status,
      approvalStatus,
      priority,
      deploymentDate,
      from,
      startDate,
      to,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = filter;

    const where: Prisma.ProjectWhereInput = {};

    // 1. Search Query (Name, Summary, Description)
    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { summary: { contains: term } },
        { description: { contains: term } },
        { owner: { name: { contains: term } } },
        { supervisor: { name: { contains: term } } },
      ];
    }

    // 2. Owner Filtering
    if (ownerId) {
      where.ownerId = ownerId;
    } else if (owner && owner !== 'ALL') {
      where.OR = [
        ...(where.OR || []),
        { ownerId: owner },
        { owner: { name: { contains: owner } } },
        { owner: { email: { contains: owner } } },
      ];
    }

    // 3. Supervisor Filtering
    if (supervisorId) {
      where.supervisorId = supervisorId;
    } else if (supervisor && supervisor !== 'ALL') {
      where.OR = [
        ...(where.OR || []),
        { supervisorId: supervisor },
        { supervisor: { name: { contains: supervisor } } },
        { supervisor: { email: { contains: supervisor } } },
      ];
    }

    // 4. Team Filtering
    if (teamId) {
      where.teamId = teamId;
    } else if (team && team !== 'ALL') {
      where.OR = [
        ...(where.OR || []),
        { teamId: team },
        { team: { name: { contains: team } } },
      ];
    }

    // 5. Technology Filtering
    const techSearch = technology || tech;
    if (techSearch && techSearch !== 'ALL' && techSearch.trim() !== '') {
      const techList = techSearch.split(',').map((t) => t.trim());
      where.technologies = {
        some: {
          technology: {
            OR: [
              { id: { in: techList } },
              { name: { in: techList } },
              ...techList.map((t) => ({ name: { contains: t } })),
            ],
          },
        },
      };
    }

    // 6. Category Filtering
    if (category) {
      where.category = category;
    }

    // 7. Status & Approval Filtering
    if (status && (status as string) !== 'ALL') {
      where.status = status;
    }
    if (approvalStatus && (approvalStatus as string) !== 'ALL') {
      where.approvalStatus = approvalStatus;
    }
    if (priority && (priority as string) !== 'ALL') {
      where.priority = priority;
    }

    // 8. Deployment Date Filtering
    if (deploymentDate) {
      const targetDate = new Date(deploymentDate);
      if (!isNaN(targetDate.getTime())) {
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        where.deploymentDate = {
          gte: targetDate,
          lt: nextDay,
        };
      }
    }

    // 9. Custom Date Range Filtering (from / to or startDate / endDate)
    const effectiveFrom = from || startDate;
    const effectiveTo = to || endDate;

    if (effectiveFrom || effectiveTo) {
      where.deploymentDate = where.deploymentDate || {};
      if (effectiveFrom) {
        const fromDate = new Date(effectiveFrom);
        if (!isNaN(fromDate.getTime())) {
          (where.deploymentDate as Prisma.DateTimeFilter).gte = fromDate;
        }
      }
      if (effectiveTo) {
        const toDate = new Date(effectiveTo);
        if (!isNaN(toDate.getTime())) {
          // Set to end of day
          toDate.setHours(23, 59, 59, 999);
          (where.deploymentDate as Prisma.DateTimeFilter).lte = toDate;
        }
      }
    }

    // 10. Sorting Configuration
    let orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: sortOrder };
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'deploymentDate') {
      orderBy = { deploymentDate: sortOrder };
    } else if (sortBy === 'testCoverage') {
      orderBy = { testCoverage: sortOrder };
    } else if (sortBy === 'linesOfCode') {
      orderBy = { linesOfCode: sortOrder };
    } else if (sortBy === 'priority') {
      orderBy = { priority: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    }

    const skip = (page - 1) * limit;

    const [rawItems, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: true,
          supervisor: true,
          team: true,
          technologies: {
            include: {
              technology: true,
            },
          },
        },
        orderBy,
      }),
      this.prisma.project.count({ where }),
    ]);

    const formattedItems = rawItems.map((item) => this.formatProject(item));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: formattedItems,
      projects: formattedItems,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
        supervisor: true,
        team: true,
        technologies: {
          include: {
            technology: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    return this.formatProject(project);
  }

  async create(createProjectDto: CreateProjectDto, currentUser?: any) {
    const {
      technologyIds,
      techStack,
      deploymentDate,
      expectedCompletionDate,
      actualCompletionDate,
      ownerId,
      docsUrl,
      documentationUrl,
      imageUrl,
      thumbnail,
      summary,
      ...rest
    } = createProjectDto;

    // Resolve ownerId
    let finalOwnerId = ownerId || currentUser?.id;
    if (!finalOwnerId) {
      // Find default first admin/developer user
      const defaultOwner = await this.prisma.user.findFirst({
        where: { role: { in: [UserRole.DEVELOPER, UserRole.ADMIN] } },
      });
      if (!defaultOwner) {
        throw new BadRequestException('No valid user account found to assign as project owner.');
      }
      finalOwnerId = defaultOwner.id;
    }

    // Resolve Technology IDs from string names if technologyIds not provided directly
    let resolvedTechIds: string[] = technologyIds || [];

    if ((!resolvedTechIds || resolvedTechIds.length === 0) && techStack && techStack.length > 0) {
      for (const techName of techStack) {
        let tech = await this.prisma.technology.findUnique({ where: { name: techName } });
        if (!tech) {
          tech = await this.prisma.technology.create({
            data: { name: techName, category: 'General' },
          });
        }
        resolvedTechIds.push(tech.id);
      }
    }

    const docUrlVal = documentationUrl || docsUrl || null;
    const imgUrlVal = imageUrl || thumbnail || null;
    const summaryVal = summary || rest.description.slice(0, 150);

    const project = await this.prisma.project.create({
      data: {
        ...rest,
        summary: summaryVal,
        ownerId: finalOwnerId,
        docsUrl: docUrlVal,
        documentationUrl: docUrlVal,
        imageUrl: imgUrlVal,
        thumbnail: imgUrlVal,
        deploymentDate: deploymentDate ? new Date(deploymentDate) : null,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
        actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : null,
        technologies: resolvedTechIds.length
          ? {
              create: resolvedTechIds.map((techId) => ({
                technology: { connect: { id: techId } },
              })),
            }
          : undefined,
      },
      include: {
        owner: true,
        supervisor: true,
        team: true,
        technologies: {
          include: {
            technology: true,
          },
        },
      },
    });

    return this.formatProject(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    // Role-based permission check
    if (currentUser) {
      const isOwner = existing.ownerId === currentUser.id;
      const isSupervisor = existing.supervisorId === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;

      if (!isOwner && !isSupervisor && !isAdmin) {
        throw new ForbiddenException('You do not have permission to modify this project.');
      }
    }

    const {
      technologyIds,
      techStack,
      deploymentDate,
      expectedCompletionDate,
      actualCompletionDate,
      docsUrl,
      documentationUrl,
      imageUrl,
      thumbnail,
      ...rest
    } = updateProjectDto;

    let resolvedTechIds: string[] | undefined = technologyIds;
    if (!resolvedTechIds && techStack && techStack.length > 0) {
      resolvedTechIds = [];
      for (const techName of techStack) {
        let tech = await this.prisma.technology.findUnique({ where: { name: techName } });
        if (!tech) {
          tech = await this.prisma.technology.create({
            data: { name: techName, category: 'General' },
          });
        }
        resolvedTechIds.push(tech.id);
      }
    }

    const docUrlVal = documentationUrl ?? docsUrl;
    const imgUrlVal = imageUrl ?? thumbnail;

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(docUrlVal !== undefined ? { docsUrl: docUrlVal, documentationUrl: docUrlVal } : {}),
        ...(imgUrlVal !== undefined ? { imageUrl: imgUrlVal, thumbnail: imgUrlVal } : {}),
        deploymentDate: deploymentDate ? new Date(deploymentDate) : undefined,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : undefined,
        actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : undefined,
        ...(resolvedTechIds
          ? {
              technologies: {
                deleteMany: {},
                create: resolvedTechIds.map((techId) => ({
                  technology: { connect: { id: techId } },
                })),
              },
            }
          : {}),
      },
      include: {
        owner: true,
        supervisor: true,
        team: true,
        technologies: {
          include: {
            technology: true,
          },
        },
      },
    });

    return this.formatProject(updated);
  }

  async remove(id: string, currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    // Role-based permission check
    if (currentUser) {
      const isOwner = existing.ownerId === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Only project owners or administrators can delete projects.');
      }
    }

    await this.prisma.project.delete({ where: { id } });
    return { message: 'Project deleted successfully', id };
  }

  async submitForReview(id: string, currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (currentUser) {
      const isOwner = existing.ownerId === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('Only the project owner or admin can submit this project for review.');
      }
    }

    const allowedFromStatuses: ApprovalStatus[] = [ApprovalStatus.DRAFT, ApprovalStatus.PENDING_REVIEW];
    if (!allowedFromStatuses.includes(existing.approvalStatus as ApprovalStatus)) {
      throw new BadRequestException(
        `Cannot submit project from status "${existing.approvalStatus}". Status must be DRAFT or PENDING_REVIEW.`,
      );
    }

    const fromStatus = existing.approvalStatus as ApprovalStatus;
    const toStatus = ApprovalStatus.SUBMITTED;

    const updated = await this.prisma.project.update({
      where: { id },
      data: { approvalStatus: toStatus },
      include: {
        owner: true,
        supervisor: true,
        team: true,
        technologies: { include: { technology: true } },
      },
    });

    if (currentUser) {
      await this.prisma.approvalHistory.create({
        data: {
          projectId: id,
          actorId: currentUser.id,
          fromStatus,
          toStatus,
          notes: 'Project submitted for review',
        },
      });
      await this.prisma.activityLog.create({
        data: {
          projectId: id,
          actorId: currentUser.id,
          type: 'APPROVAL_CHANGE',
          description: `submitted project "${existing.name}" for review`,
          details: `Status: ${fromStatus} → ${toStatus}`,
        },
      });
    }

    return {
      message: 'Project submitted for review successfully',
      approvalStatus: updated.approvalStatus,
      project: this.formatProject(updated),
    };
  }

  async updateStatus(id: string, dto: UpdateProjectStatusDto, currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (currentUser) {
      const isOwner = existing.ownerId === currentUser.id;
      const isSupervisor = existing.supervisorId === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;

      if (!isOwner && !isSupervisor && !isAdmin) {
        throw new ForbiddenException('You do not have permission to update project status.');
      }
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.approvalStatus ? { approvalStatus: dto.approvalStatus } : {}),
      },
      include: {
        owner: true,
        supervisor: true,
        team: true,
        technologies: {
          include: {
            technology: true,
          },
        },
      },
    });

    return this.formatProject(updated);
  }

  async assignSupervisor(id: string, supervisorId: string, currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException('Only Supervisors or Admins can assign project supervisors.');
    }

    // Verify supervisor exists
    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor) {
      throw new NotFoundException(`Supervisor user with ID "${supervisorId}" not found.`);
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { supervisorId },
      include: {
        owner: true,
        supervisor: true,
        team: true,
        technologies: {
          include: {
            technology: true,
          },
        },
      },
    });

    if (supervisorId) {
      await this.notificationsService.createNotification({
        recipientId: supervisorId,
        actorId: currentUser?.id,
        type: NotificationType.ASSIGNMENT,
        title: 'Assigned as Project Supervisor',
        message: `You have been assigned as supervisor for project "${existing.name}".`,
        projectId: id,
      });
    }

    return this.formatProject(updated);
  }

  async assignTeam(id: string, teamId: string, currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (currentUser && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.SUPERVISOR) {
      throw new ForbiddenException('Only Supervisors or Admins can assign project teams.');
    }

    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with ID "${teamId}" not found.`);
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { teamId },
      include: {
        owner: true,
        supervisor: true,
        team: true,
        technologies: {
          include: {
            technology: true,
          },
        },
      },
    });

    return this.formatProject(updated);
  }

  async addTechnologies(id: string, technologyIds: string[], currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (currentUser) {
      const isOwner = existing.ownerId === currentUser.id;
      const isSupervisor = existing.supervisorId === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;

      if (!isOwner && !isSupervisor && !isAdmin) {
        throw new ForbiddenException('You do not have permission to modify project technologies.');
      }
    }

    for (const techId of technologyIds) {
      await this.prisma.projectTechnology.upsert({
        where: {
          projectId_technologyId: {
            projectId: id,
            technologyId: techId,
          },
        },
        create: {
          projectId: id,
          technologyId: techId,
        },
        update: {},
      });
    }

    return this.findOne(id);
  }

  async removeTechnology(id: string, techId: string, currentUser?: any) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    if (currentUser) {
      const isOwner = existing.ownerId === currentUser.id;
      const isSupervisor = existing.supervisorId === currentUser.id;
      const isAdmin = currentUser.role === UserRole.ADMIN;

      if (!isOwner && !isSupervisor && !isAdmin) {
        throw new ForbiddenException('You do not have permission to modify project technologies.');
      }
    }

    await this.prisma.projectTechnology.deleteMany({
      where: {
        projectId: id,
        technologyId: techId,
      },
    });

    return this.findOne(id);
  }
}

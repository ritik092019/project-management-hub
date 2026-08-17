import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { ProjectStatus, Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to build Prisma where clause based on AnalyticsFilterDto parameters
   */
  private buildWhereClause(filterDto: AnalyticsFilterDto): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {};

    // Date range filtering on deploymentDate
    const startDateStr = filterDto.startDate || filterDto.from;
    const endDateStr = filterDto.endDate || filterDto.to;

    if (startDateStr || endDateStr) {
      where.deploymentDate = {};
      if (startDateStr) {
        where.deploymentDate.gte = new Date(startDateStr);
      }
      if (endDateStr) {
        const endDate = new Date(endDateStr);
        if (endDateStr.length === 10) {
          endDate.setHours(23, 59, 59, 999);
        }
        where.deploymentDate.lte = endDate;
      }
    }

    // Status filter
    if (filterDto.status && filterDto.status.toString() !== 'ALL') {
      where.status = filterDto.status;
    }

    // Category filter
    if (filterDto.category) {
      where.category = filterDto.category;
    }

    // Priority filter
    if (filterDto.priority) {
      where.priority = filterDto.priority;
    }

    // Owner filter
    const ownerVal = filterDto.ownerId || filterDto.owner;
    if (ownerVal && ownerVal !== 'ALL') {
      where.OR = [
        { ownerId: ownerVal },
        { owner: { name: { contains: ownerVal } } },
        { owner: { email: { contains: ownerVal } } },
      ];
    }

    // Supervisor filter
    const superVal = filterDto.supervisorId || filterDto.supervisor;
    if (superVal && superVal !== 'ALL') {
      where.supervisorId = superVal;
    }

    // Team filter
    const teamVal = filterDto.teamId || filterDto.team;
    if (teamVal && teamVal !== 'ALL') {
      where.teamId = teamVal;
    }

    // Search filter
    if (filterDto.search && filterDto.search.trim() !== '') {
      const search = filterDto.search.trim();
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { summary: { contains: search } },
        { owner: { name: { contains: search } } },
      ];
    }

    // Technology filter
    const techVal = filterDto.tech || filterDto.techStack;
    if (techVal && techVal.trim() !== '' && techVal !== 'ALL') {
      const techNames = techVal.split(',').map((t) => t.trim());
      where.technologies = {
        some: {
          technology: {
            OR: techNames.map((t) => ({
              OR: [{ id: t }, { name: { contains: t } }],
            })),
          },
        },
      };
    }

    return where;
  }

  /**
   * Main Dashboard Overview Analytics
   */
  async getDashboardMetrics(filterDto: AnalyticsFilterDto = {}) {
    const where = this.buildWhereClause(filterDto);

    // Run parallel queries for overview KPIs
    const [
      totalProjects,
      developersCount,
      allProjects,
      statusCounts,
      technologiesWithProjects,
      teamsWithProjects,
      supervisorsWithProjects,
    ] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.user.count({ where: { role: 'DEVELOPER', isActive: true } }),
      this.prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          testCoverage: true,
          linesOfCode: true,
          createdAt: true,
          deploymentDate: true,
          expectedCompletionDate: true,
          actualCompletionDate: true,
          owner: { select: { id: true, name: true, avatar: true, department: true } },
          supervisor: { select: { id: true, name: true } },
          team: { select: { id: true, name: true, department: true } },
          technologies: { select: { technology: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.project.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      this.prisma.technology.findMany({
        select: {
          id: true,
          name: true,
          projectTechnologies: {
            where: { project: where },
            select: { projectId: true },
          },
        },
      }),
      this.prisma.team.findMany({
        select: {
          id: true,
          name: true,
          department: true,
          projects: {
            where,
            select: { id: true },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { role: 'SUPERVISOR', isActive: true },
        select: {
          id: true,
          name: true,
          supervisedProjects: {
            where,
            select: { id: true },
          },
        },
      }),
    ]);

    // Derive status breakdown directly from group-by query
    const statusMap = new Map(statusCounts.map((s) => [s.status, s._count.id]));
    const completedProjects = statusMap.get(ProjectStatus.DEPLOYED) || 0;
    const inProgressCount = statusMap.get(ProjectStatus.IN_PROGRESS) || 0;
    const testingCount = statusMap.get(ProjectStatus.TESTING) || 0;
    const maintenanceCount = statusMap.get(ProjectStatus.MAINTENANCE) || 0;
    const archivedCount = statusMap.get(ProjectStatus.ARCHIVED) || 0;
    const activeProjects = inProgressCount + testingCount + maintenanceCount;

    // Average test coverage
    const avgTestCoverage =
      allProjects.length > 0
        ? Number((allProjects.reduce((acc, p) => acc + p.testCoverage, 0) / allProjects.length).toFixed(1))
        : 0;

    // Total lines of code
    const totalLinesOfCode = allProjects.reduce((acc, p) => acc + p.linesOfCode, 0);

    // Average project completion time (in days)
    let totalCompletionDays = 0;
    let completionCount = 0;
    allProjects.forEach((p) => {
      const endDate = p.actualCompletionDate || p.deploymentDate;
      if (p.createdAt && endDate) {
        const createdMs = new Date(p.createdAt).getTime();
        const endMs = new Date(endDate).getTime();
        const diffDays = Math.round((endMs - createdMs) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          totalCompletionDays += diffDays;
          completionCount++;
        }
      }
    });
    const avgCompletionTimeDays = completionCount > 0 ? Math.round(totalCompletionDays / completionCount) : 14;

    // Monthly Deployments over time (grouped by YYYY-MM)
    const monthMap: Record<string, number> = {};
    allProjects.forEach((p) => {
      if (p.deploymentDate) {
        const monthKey = p.deploymentDate.toISOString().substring(0, 7);
        monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
      }
    });

    let runningCumulative = 0;
    const deploymentsOverTime = Object.keys(monthMap)
      .sort()
      .map((month) => {
        const [year, m] = month.split('-');
        const dateObj = new Date(parseInt(year), parseInt(m) - 1, 1);
        const monthName = dateObj.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        const monthCount = monthMap[month];
        runningCumulative += monthCount;
        return {
          date: month,
          monthName,
          count: monthCount,
          cumulativeCount: runningCumulative,
        };
      });

    // Deployment growth trends
    const deploymentTrends = deploymentsOverTime.map((item, idx) => {
      const prevCount = idx > 0 ? deploymentsOverTime[idx - 1].count : item.count;
      const growthRatePct = prevCount > 0 ? Math.round(((item.count - prevCount) / prevCount) * 100) : 0;
      return {
        monthName: item.monthName,
        count: item.count,
        growthRatePct,
      };
    });

    // Technology distribution
    const techDistribution = technologiesWithProjects
      .map((t) => ({
        tech: t.name,
        count: t.projectTechnologies.length,
        percentage:
          allProjects.length > 0 ? Math.round((t.projectTechnologies.length / allProjects.length) * 100) : 0,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count);

    const mostUsedTechStack = techDistribution.slice(0, 6);

    // Status distribution
    const statusDistribution = (
      [
        ProjectStatus.DEPLOYED,
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.TESTING,
        ProjectStatus.MAINTENANCE,
        ProjectStatus.ARCHIVED,
      ] as ProjectStatus[]
    ).map((status) => ({
      status,
      count: statusMap.get(status) || 0,
    }));

    // Top Contributors & Developer stats
    const devStatsMap = new Map<
      string,
      { name: string; avatar: string; department: string; projectCount: number; loc: number; coverageSum: number }
    >();

    allProjects.forEach((p) => {
      if (p.owner) {
        const existing = devStatsMap.get(p.owner.id) || {
          name: p.owner.name,
          avatar: p.owner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          department: p.owner.department || 'Engineering',
          projectCount: 0,
          loc: 0,
          coverageSum: 0,
        };
        existing.projectCount += 1;
        existing.loc += p.linesOfCode;
        existing.coverageSum += p.testCoverage;
        devStatsMap.set(p.owner.id, existing);
      }
    });

    const topContributors = Array.from(devStatsMap.values())
      .map((dev) => ({
        name: dev.name,
        avatar: dev.avatar,
        projectCount: dev.projectCount,
        linesOfCode: dev.loc,
        testCoverage: Math.round(dev.coverageSum / (dev.projectCount || 1)),
        department: dev.department,
      }))
      .sort((a, b) => b.projectCount - a.projectCount || b.linesOfCode - a.linesOfCode);

    const projectsPerDeveloper = topContributors.map((c) => ({
      developer: c.name,
      count: c.projectCount,
    }));

    // Projects per Supervisor
    const projectsPerSupervisor = supervisorsWithProjects
      .map((s) => ({
        supervisor: s.name,
        count: s.supervisedProjects.length,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);

    // Projects per Team / Department
    const deptMap: Record<string, number> = {};
    teamsWithProjects.forEach((t) => {
      const dept = t.department || t.name;
      deptMap[dept] = (deptMap[dept] || 0) + t.projects.length;
    });

    const projectsPerDepartment = Object.keys(deptMap)
      .map((dept) => ({
        department: dept,
        count: deptMap[dept],
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      inProgressCount,
      testingCount,
      maintenanceCount,
      archivedCount,
      activeDeployments: completedProjects,
      totalDevelopers: developersCount || topContributors.length,
      avgTestCoverage,
      totalLinesOfCode,
      avgCompletionTimeDays,
      deploymentsOverTime,
      deploymentTrends,
      techDistribution,
      mostUsedTechStack,
      statusDistribution,
      projectsPerDeveloper,
      projectsPerSupervisor,
      projectsPerDepartment,
      topContributors,
    };
  }

  /**
   * Dedicated Deployment Analytics
   */
  async getDeploymentsAnalytics(filterDto: AnalyticsFilterDto) {
    const where = this.buildWhereClause(filterDto);

    const projects = await this.prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        deploymentDate: true,
        actualCompletionDate: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyMap: Record<
      string,
      { month: string; monthName: string; created: number; completed: number; deployed: number }
    > = {};

    projects.forEach((p) => {
      if (p.createdAt) {
        const createdMonth = p.createdAt.toISOString().substring(0, 7);
        if (!monthlyMap[createdMonth]) {
          const [yr, m] = createdMonth.split('-');
          const d = new Date(parseInt(yr), parseInt(m) - 1, 1);
          monthlyMap[createdMonth] = {
            month: createdMonth,
            monthName: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
            created: 0,
            completed: 0,
            deployed: 0,
          };
        }
        monthlyMap[createdMonth].created += 1;
      }

      const end = p.actualCompletionDate || p.deploymentDate;
      if (end) {
        const endMonth = end.toISOString().substring(0, 7);
        if (!monthlyMap[endMonth]) {
          const [yr, m] = endMonth.split('-');
          const d = new Date(parseInt(yr), parseInt(m) - 1, 1);
          monthlyMap[endMonth] = {
            month: endMonth,
            monthName: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
            created: 0,
            completed: 0,
            deployed: 0,
          };
        }
        if (p.status === ProjectStatus.DEPLOYED) {
          monthlyMap[endMonth].deployed += 1;
          monthlyMap[endMonth].completed += 1;
        }
      }
    });

    const monthlyBreakdown = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalProjectsCount: projects.length,
      deployedProjectsCount: projects.filter((p) => p.status === ProjectStatus.DEPLOYED).length,
      monthlyBreakdown,
    };
  }

  /**
   * Dedicated Technology Analytics
   */
  async getTechnologiesAnalytics(filterDto: AnalyticsFilterDto) {
    const where = this.buildWhereClause(filterDto);

    const technologies = await this.prisma.technology.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        projectTechnologies: {
          where: { project: where },
          select: {
            project: { select: { id: true, testCoverage: true, linesOfCode: true } },
          },
        },
      },
    });

    const totalProjects = await this.prisma.project.count({ where });

    const techStats = technologies
      .map((t) => {
        const projectCount = t.projectTechnologies.length;
        const totalLoc = t.projectTechnologies.reduce((acc, p) => acc + p.project.linesOfCode, 0);
        const avgCov =
          projectCount > 0
            ? Math.round(t.projectTechnologies.reduce((acc, p) => acc + p.project.testCoverage, 0) / projectCount)
            : 0;

        return {
          id: t.id,
          name: t.name,
          category: t.category,
          projectCount,
          percentage: totalProjects > 0 ? Math.round((projectCount / totalProjects) * 100) : 0,
          totalLinesOfCode: totalLoc,
          avgTestCoverage: avgCov,
        };
      })
      .filter((t) => t.projectCount > 0)
      .sort((a, b) => b.projectCount - a.projectCount);

    return {
      totalTechnologiesUsed: techStats.length,
      techStats,
      mostPopular: techStats.slice(0, 5),
    };
  }

  /**
   * Dedicated Teams Analytics
   */
  async getTeamsAnalytics(filterDto: AnalyticsFilterDto) {
    const where = this.buildWhereClause(filterDto);

    const teams = await this.prisma.team.findMany({
      select: {
        id: true,
        name: true,
        department: true,
        members: { select: { id: true, name: true, role: true } },
        projects: {
          where,
          select: { id: true, status: true, testCoverage: true, linesOfCode: true },
        },
      },
    });

    const teamStats = teams.map((t) => {
      const count = t.projects.length;
      const completed = t.projects.filter((p) => p.status === ProjectStatus.DEPLOYED).length;
      const loc = t.projects.reduce((acc, p) => acc + p.linesOfCode, 0);
      const avgCov =
        count > 0 ? Math.round(t.projects.reduce((acc, p) => acc + p.testCoverage, 0) / count) : 0;

      return {
        id: t.id,
        name: t.name,
        department: t.department,
        memberCount: t.members.length,
        projectCount: count,
        completedProjectsCount: completed,
        totalLinesOfCode: loc,
        avgTestCoverage: avgCov,
      };
    });

    return {
      totalTeams: teams.length,
      teamStats: teamStats.sort((a, b) => b.projectCount - a.projectCount),
    };
  }

  /**
   * Dedicated Top Contributors Analytics
   */
  async getContributorsAnalytics(filterDto: AnalyticsFilterDto) {
    const where = this.buildWhereClause(filterDto);

    const developers = await this.prisma.user.findMany({
      where: { role: 'DEVELOPER', isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        department: true,
        ownedProjects: {
          where,
          select: { id: true, status: true, testCoverage: true, linesOfCode: true },
        },
      },
    });

    const contributors = developers
      .map((d) => {
        const count = d.ownedProjects.length;
        const loc = d.ownedProjects.reduce((acc, p) => acc + p.linesOfCode, 0);
        const avgCov =
          count > 0
            ? Math.round(d.ownedProjects.reduce((acc, p) => acc + p.testCoverage, 0) / count)
            : 0;

        return {
          id: d.id,
          name: d.name,
          email: d.email,
          avatar:
            d.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          department: d.department || 'Engineering',
          projectCount: count,
          linesOfCode: loc,
          testCoverage: avgCov,
        };
      })
      .filter((c) => c.projectCount > 0)
      .sort((a, b) => b.projectCount - a.projectCount || b.linesOfCode - a.linesOfCode);

    return {
      totalContributors: contributors.length,
      contributors,
    };
  }

  /**
   * Dedicated Completion Time Analytics
   */
  async getCompletionTimeAnalytics(filterDto: AnalyticsFilterDto) {
    const where = this.buildWhereClause(filterDto);

    const projects = await this.prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        priority: true,
        createdAt: true,
        deploymentDate: true,
        actualCompletionDate: true,
      },
    });

    const completionDurations: { id: string; name: string; category: string; priority: string; durationDays: number }[] = [];

    projects.forEach((p) => {
      const endDate = p.actualCompletionDate || p.deploymentDate;
      if (p.createdAt && endDate) {
        const diff = Math.round((new Date(endDate).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) {
          completionDurations.push({
            id: p.id,
            name: p.name,
            category: p.category,
            priority: p.priority,
            durationDays: diff,
          });
        }
      }
    });

    const totalDays = completionDurations.reduce((acc, d) => acc + d.durationDays, 0);
    const avgDurationDays = completionDurations.length > 0 ? Math.round(totalDays / completionDurations.length) : 0;
    const minDurationDays = completionDurations.length > 0 ? Math.min(...completionDurations.map((d) => d.durationDays)) : 0;
    const maxDurationDays = completionDurations.length > 0 ? Math.max(...completionDurations.map((d) => d.durationDays)) : 0;

    return {
      totalMeasuredProjects: completionDurations.length,
      avgDurationDays,
      minDurationDays,
      maxDurationDays,
      projectDurations: completionDurations.sort((a, b) => a.durationDays - b.durationDays),
    };
  }
}

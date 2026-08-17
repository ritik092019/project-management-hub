import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApprovalStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

// Valid state machine transitions
const ALLOWED_TRANSITIONS: Record<string, ApprovalStatus[]> = {
  // Students/Developers submit
  DRAFT: ['SUBMITTED'],
  PENDING_REVIEW: ['SUBMITTED'],
  CHANGES_REQUESTED: ['RESUBMITTED'],
  // Supervisors/Admins review
  SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
  RESUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
};

const SUPERVISOR_ONLY_TRANSITIONS: ApprovalStatus[] = [
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CHANGES_REQUESTED',
];

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private formatReview(r: any) {
    return {
      id: r.id,
      projectId: r.projectId,
      supervisorId: r.supervisorId,
      supervisorName: r.supervisor?.name || '',
      supervisorEmail: r.supervisor?.email || '',
      approvalStatus: r.approvalStatus,
      feedbackText: r.feedbackText,
      rating: r.rating,
      changesRequestedList: r.changesRequestedList
        ? JSON.parse(r.changesRequestedList)
        : [],
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    };
  }

  private formatHistory(h: any) {
    return {
      id: h.id,
      projectId: h.projectId,
      actorId: h.actorId,
      actorName: h.actor?.name || '',
      actorRole: h.actor?.role || '',
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      notes: h.notes || null,
      createdAt: h.createdAt.toISOString(),
    };
  }

  private formatActivity(a: any) {
    return {
      id: a.id,
      projectId: a.projectId,
      actorId: a.actorId,
      actorName: a.actor?.name || '',
      actorRole: a.actor?.role || '',
      actorAvatar: a.actor?.avatar || null,
      type: a.type,
      description: a.description,
      details: a.details || null,
      createdAt: a.createdAt.toISOString(),
    };
  }

  /**
   * Submit a project for review (DRAFT/PENDING_REVIEW → SUBMITTED)
   */
  async submitProject(projectId: string, user: any) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project "${projectId}" not found.`);

    const from = project.approvalStatus as ApprovalStatus;
    const to: ApprovalStatus = 'SUBMITTED';

    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(
        `Cannot submit project from status "${from}". Current status must be DRAFT or PENDING_REVIEW.`,
      );
    }

    // Only owner or admin can submit
    if (user.role !== 'ADMIN' && project.ownerId !== user.id) {
      throw new ForbiddenException('Only the project owner or admin can submit for review.');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { approvalStatus: to },
    });

    await this.prisma.approvalHistory.create({
      data: { projectId, actorId: user.id, fromStatus: from, toStatus: to, notes: 'Project submitted for review' },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId,
        actorId: user.id,
        type: 'APPROVAL_CHANGE',
        description: `submitted project "${project.name}" for review`,
        details: `Status: ${from} → ${to}`,
      },
    });

    // Notify supervisor if assigned
    if (project.supervisorId && project.supervisorId !== user.id) {
      await this.notificationsService.createNotification({
        recipientId: project.supervisorId,
        actorId: user.id,
        type: NotificationType.SUBMISSION,
        title: 'Project submitted for review',
        message: `${user.name || 'Owner'} submitted project "${project.name}" for review.`,
        projectId,
      });
    }

    return { message: 'Project submitted for review successfully', approvalStatus: updated.approvalStatus };
  }

  /**
   * Resubmit project after changes requested (CHANGES_REQUESTED → RESUBMITTED)
   */
  async resubmitProject(projectId: string, user: any, notes?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project "${projectId}" not found.`);

    const from = project.approvalStatus as ApprovalStatus;
    const to: ApprovalStatus = 'RESUBMITTED';

    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(
        `Cannot resubmit project from status "${from}". Status must be CHANGES_REQUESTED.`,
      );
    }

    if (user.role !== 'ADMIN' && project.ownerId !== user.id) {
      throw new ForbiddenException('Only the project owner or admin can resubmit the project.');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { approvalStatus: to },
    });

    await this.prisma.approvalHistory.create({
      data: { projectId, actorId: user.id, fromStatus: from, toStatus: to, notes: notes || 'Project resubmitted after changes' },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId,
        actorId: user.id,
        type: 'APPROVAL_CHANGE',
        description: `resubmitted project "${project.name}" after implementing requested changes`,
        details: `Status: ${from} → ${to}`,
      },
    });

    // Notify supervisor if assigned
    if (project.supervisorId && project.supervisorId !== user.id) {
      await this.notificationsService.createNotification({
        recipientId: project.supervisorId,
        actorId: user.id,
        type: NotificationType.RESUBMISSION,
        title: 'Project resubmitted for review',
        message: `${user.name || 'Owner'} resubmitted project "${project.name}" after updating requested changes.`,
        projectId,
      });
    }

    return { message: 'Project resubmitted successfully', approvalStatus: updated.approvalStatus };
  }

  /**
   * Supervisor creates a review note and transitions status
   */
  async createReview(projectId: string, user: any, dto: CreateReviewDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project "${projectId}" not found.`);

    // RBAC: only SUPERVISOR or ADMIN
    if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
      throw new ForbiddenException('Only supervisors or admins can submit project reviews.');
    }

    // Supervisors can only review assigned projects (unless Admin)
    if (user.role === 'SUPERVISOR' && project.supervisorId !== user.id) {
      throw new ForbiddenException('You can only review projects assigned to you.');
    }

    const from = project.approvalStatus as ApprovalStatus;
    const to = dto.approvalStatus;

    // Validate state machine transition
    if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from "${from}" to "${to}".`,
      );
    }

    // Ensure supervisor-only transitions
    if (!SUPERVISOR_ONLY_TRANSITIONS.includes(to)) {
      throw new BadRequestException(`Supervisors cannot transition project to "${to}".`);
    }

    const changesJson = dto.changesRequestedList
      ? JSON.stringify(dto.changesRequestedList)
      : null;

    const review = await this.prisma.projectReview.create({
      data: {
        projectId,
        supervisorId: user.id,
        approvalStatus: to,
        feedbackText: dto.feedbackText,
        rating: dto.rating ?? null,
        changesRequestedList: changesJson,
      },
      include: {
        supervisor: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Update project approval status
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { approvalStatus: to },
    });

    // Record approval history
    await this.prisma.approvalHistory.create({
      data: {
        projectId,
        actorId: user.id,
        fromStatus: from,
        toStatus: to,
        notes: dto.feedbackText.substring(0, 255),
      },
    });

    // Record activity
    const actionVerb =
      to === 'APPROVED'
        ? 'approved'
        : to === 'REJECTED'
        ? 'rejected'
        : to === 'CHANGES_REQUESTED'
        ? 'requested changes on'
        : 'started reviewing';

    await this.prisma.activityLog.create({
      data: {
        projectId,
        actorId: user.id,
        type: 'REVIEW',
        description: `${actionVerb} project "${project.name}"`,
        details: `Status: ${from} → ${to}`,
      },
    });

    // ─── Real-Time Notification to Owner ─────────────────────────────────
    if (project.ownerId && project.ownerId !== user.id) {
      let notifType: NotificationType = NotificationType.SUPERVISOR_FEEDBACK;
      let title = 'New supervisor feedback';

      if (to === 'APPROVED') {
        notifType = NotificationType.APPROVAL;
        title = '🎉 Project Approved!';
      } else if (to === 'REJECTED') {
        notifType = NotificationType.REJECTION;
        title = 'Project Review Status: Rejected';
      } else if (to === 'CHANGES_REQUESTED') {
        notifType = NotificationType.CHANGES_REQUESTED;
        title = 'Changes requested on your project';
      }

      await this.notificationsService.createNotification({
        recipientId: project.ownerId,
        actorId: user.id,
        type: notifType,
        title,
        message: `${user.name || 'Supervisor'} ${actionVerb} "${project.name}": "${dto.feedbackText.substring(0, 60)}..."`,
        projectId,
      });
    }

    return {
      message: `Review submitted. Project is now ${to}.`,
      review: this.formatReview(review),
      approvalStatus: updatedProject.approvalStatus,
    };
  }

  /**
   * Get all project reviews
   */
  async findReviewsByProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project "${projectId}" not found.`);

    const reviews = await this.prisma.projectReview.findMany({
      where: { projectId },
      include: {
        supervisor: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      reviews: reviews.map((r) => this.formatReview(r)),
      total: reviews.length,
      currentApprovalStatus: project.approvalStatus,
    };
  }

  /**
   * Get approval history / state transitions
   */
  async findApprovalHistory(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project "${projectId}" not found.`);

    const history = await this.prisma.approvalHistory.findMany({
      where: { projectId },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      history: history.map((h) => this.formatHistory(h)),
      total: history.length,
      currentApprovalStatus: project.approvalStatus,
    };
  }

  /**
   * Get activity timeline for a project
   */
  async findActivities(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project "${projectId}" not found.`);

    const activities = await this.prisma.activityLog.findMany({
      where: { projectId },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      activities: activities.map((a) => this.formatActivity(a)),
      total: activities.length,
    };
  }

  /**
   * Legacy alias: find approvals by project (backward compat)
   */
  async findByProject(projectId: string) {
    return this.findApprovalHistory(projectId);
  }
}

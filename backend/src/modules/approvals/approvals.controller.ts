import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Approvals & Reviews')
@Controller()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  // ─── Submit Project ────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('projects/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit project for review (DRAFT/PENDING_REVIEW → SUBMITTED)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project submitted for review' })
  async submitProject(@Param('id') projectId: string, @CurrentUser() user: any) {
    return this.approvalsService.submitProject(projectId, user);
  }

  // ─── Resubmit Project ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('projects/:id/resubmit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resubmit project after changes (CHANGES_REQUESTED → RESUBMITTED)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project resubmitted successfully' })
  async resubmitProject(
    @Param('id') projectId: string,
    @CurrentUser() user: any,
    @Body() body: { notes?: string },
  ) {
    return this.approvalsService.resubmitProject(projectId, user, body?.notes);
  }

  // ─── Create Review / Feedback ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('projects/:id/review')
  @ApiOperation({
    summary: 'Supervisor: add review feedback and update project approval status',
  })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  async createReview(
    @Param('id') projectId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.approvalsService.createReview(projectId, user, dto);
  }

  // ─── Get Reviews ──────────────────────────────────────────────────────────

  @Public()
  @Get('projects/:id/reviews')
  @ApiOperation({ summary: 'Get all supervisor reviews for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of project reviews' })
  async getReviews(@Param('id') projectId: string) {
    return this.approvalsService.findReviewsByProject(projectId);
  }

  // ─── Get Approval History ─────────────────────────────────────────────────

  @Public()
  @Get('projects/:id/approval-history')
  @ApiOperation({ summary: 'Get approval status transition history for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Approval transition history' })
  async getApprovalHistory(@Param('id') projectId: string) {
    return this.approvalsService.findApprovalHistory(projectId);
  }

  // ─── Get Activity Timeline ────────────────────────────────────────────────

  @Public()
  @Get('projects/:id/activities')
  @ApiOperation({ summary: 'Get activity timeline for a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project activity timeline' })
  async getActivities(@Param('id') projectId: string) {
    return this.approvalsService.findActivities(projectId);
  }

  // ─── Legacy: approvals by project ────────────────────────────────────────

  @Public()
  @Get('approvals/project/:projectId')
  @ApiOperation({ summary: 'Legacy: get approval records for project' })
  @ApiResponse({ status: 200, description: 'Approval records' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.approvalsService.findByProject(projectId);
  }
}

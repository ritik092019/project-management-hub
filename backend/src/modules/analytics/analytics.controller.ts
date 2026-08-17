import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get overall dashboard analytics overview (Backward compatible endpoint)' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics overview object' })
  async getDashboardMetrics(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getDashboardMetrics(filterDto);
  }

  @Public()
  @Get('overview')
  @ApiOperation({ summary: 'Get overview metrics with optional date range & parameter filtering' })
  @ApiResponse({ status: 200, description: 'Aggregated project metrics overview' })
  async getOverview(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getDashboardMetrics(filterDto);
  }

  @Public()
  @Get('deployments')
  @ApiOperation({ summary: 'Get deployment throughput & monthly volume metrics' })
  @ApiResponse({ status: 200, description: 'Monthly deployment metrics' })
  async getDeployments(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getDeploymentsAnalytics(filterDto);
  }

  @Public()
  @Get('technologies')
  @ApiOperation({ summary: 'Get technology usage stats & distribution' })
  @ApiResponse({ status: 200, description: 'Technology usage analytics' })
  async getTechnologies(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getTechnologiesAnalytics(filterDto);
  }

  @Public()
  @Get('teams')
  @ApiOperation({ summary: 'Get team performance & project distribution' })
  @ApiResponse({ status: 200, description: 'Team project distribution analytics' })
  async getTeams(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getTeamsAnalytics(filterDto);
  }

  @Public()
  @Get('contributors')
  @ApiOperation({ summary: 'Get developer contribution leaderboard' })
  @ApiResponse({ status: 200, description: 'Top developer contributor metrics' })
  async getContributors(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getContributorsAnalytics(filterDto);
  }

  @Public()
  @Get('completion-time')
  @ApiOperation({ summary: 'Get project completion duration metrics & averages' })
  @ApiResponse({ status: 200, description: 'Completion time statistics' })
  async getCompletionTime(@Query() filterDto: AnalyticsFilterDto) {
    return this.analyticsService.getCompletionTimeAnalytics(filterDto);
  }
}

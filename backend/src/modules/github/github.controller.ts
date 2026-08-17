import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { GithubService } from './github.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('GitHub Integration')
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Public()
  @Get('repo')
  @ApiOperation({ summary: 'Get repository metrics from a GitHub URL' })
  @ApiQuery({ name: 'url', description: 'GitHub repo URL or "owner/repo" string', example: 'https://github.com/facebook/react' })
  @ApiResponse({ status: 200, description: 'GitHub repository metadata, stats, languages, contributors, and latest commit' })
  @ApiResponse({ status: 400, description: 'Invalid GitHub URL format' })
  @ApiResponse({ status: 404, description: 'Repository not found on GitHub' })
  async getRepoInfo(@Query('url') url: string) {
    return this.githubService.getRepoInfo(url);
  }

  @Public()
  @Get('repo/:owner/:repo')
  @ApiOperation({ summary: 'Get repository metrics by owner and repo name' })
  @ApiResponse({ status: 200, description: 'GitHub repository metadata' })
  async getRepoInfoByOwnerAndRepo(
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    return this.githubService.getRepoInfo(`https://github.com/${owner}/${repo}`);
  }

  @ApiBearerAuth()
  @Get('projects/:projectId/repo')
  @ApiOperation({ summary: 'Get GitHub repository info connected to a specific project' })
  @ApiResponse({ status: 200, description: 'Project GitHub repository information' })
  @ApiResponse({ status: 400, description: 'Project has no GitHub URL connected' })
  async getRepoInfoByProject(@Param('projectId') projectId: string) {
    return this.githubService.getRepoInfoByProject(projectId);
  }
}

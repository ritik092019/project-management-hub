import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Comments & Discussions')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('projects/:id/comments')
  @ApiOperation({ summary: 'Get threaded discussion comments for a project' })
  @ApiResponse({ status: 200, description: 'List of project comments and replies' })
  async getProjectComments(@Param('id') projectId: string) {
    return this.commentsService.findByProject(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('projects/:id/comments')
  @ApiOperation({ summary: 'Add a new project comment or threaded reply' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async createComment(
    @Param('id') projectId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(projectId, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('comments/:commentId')
  @ApiOperation({ summary: 'Edit content of own comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  async updateComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete own comment or Admin delete' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  async deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.commentsService.remove(commentId, user);
  }
}

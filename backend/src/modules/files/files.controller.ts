import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UploadFileDto, UpdateFileMetadataDto } from './dto/file.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Project Resources')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('projects/:projectId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a project resource file (screenshot, architecture diagram, PDF, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size exceeded' })
  @ApiResponse({ status: 403, description: 'Forbidden resource access' })
  async uploadFile(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required in multipart form-data');
    }
    return this.filesService.uploadFile(projectId, user, file, dto);
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'List all resources for a specific project' })
  @ApiResponse({ status: 200, description: 'List of project resources' })
  async findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.filesService.findByProject(projectId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get metadata for a specific resource file' })
  @ApiResponse({ status: 200, description: 'File metadata details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.filesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resource metadata (type, description)' })
  @ApiResponse({ status: 200, description: 'Updated resource metadata' })
  async updateMetadata(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateFileMetadataDto,
  ) {
    return this.filesService.updateMetadata(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project resource file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.filesService.remove(id, user);
  }
}

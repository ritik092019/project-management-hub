import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface CloudinaryUploadResult {
  publicId: string;
  storageUrl: string;
  format: string;
  bytes: number;
  resourceType: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    this.isConfigured = !!(cloudName && apiKey && apiSecret);

    if (this.isConfigured) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.logger.warn('Cloudinary credentials missing — running in fallback/mock mode');
    }
  }

  /**
   * Upload a file buffer to Cloudinary (or mock if not configured)
   */
  async uploadBuffer(
    buffer: Buffer,
    options: { folder?: string; publicId?: string; resourceType?: 'image' | 'video' | 'raw' | 'auto' },
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      // Fallback: return a mock result
      const mockId = `mock/${options.folder || 'files'}/${Date.now()}`;
      return {
        publicId: mockId,
        storageUrl: `https://via.placeholder.com/800x600?text=Mock+Upload`,
        format: 'png',
        bytes: buffer.length,
        resourceType: options.resourceType || 'image',
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'project-hub',
          public_id: options.publicId,
          resource_type: options.resourceType || 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error('Cloudinary upload error:', error);
            reject(new Error(error?.message || 'Cloudinary upload failed'));
            return;
          }
          resolve({
            publicId: result.public_id,
            storageUrl: result.secure_url,
            format: result.format,
            bytes: result.bytes,
            resourceType: result.resource_type,
          });
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete a resource from Cloudinary by public_id
   */
  async deleteResource(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    if (!this.isConfigured || publicId.startsWith('mock/')) {
      this.logger.debug(`Skipping Cloudinary delete for publicId: ${publicId} (mock mode)`);
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err: any) {
      this.logger.error(`Failed to delete Cloudinary resource ${publicId}: ${err.message}`);
    }
  }
}

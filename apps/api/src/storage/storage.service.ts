import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export type UploadFolder = 'avatars' | 'salons' | 'services' | 'reviews';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly publicDomain: string;

    constructor(private readonly config: ConfigService) {
        const sanitize = (val: string | undefined) => val?.replace(/['"]/g, '').trim();

        const accountId = sanitize(this.config.get<string>('R2_ACCOUNT_ID'));
        const accessKeyId = sanitize(this.config.get<string>('R2_ACCESS_KEY'));
        const secretAccessKey = sanitize(this.config.get<string>('R2_SECRET_KEY'));
        
        this.bucketName = sanitize(this.config.get<string>('R2_BUCKET_NAME')) || 'reetro-barber-storage';
        this.publicDomain = sanitize(this.config.get<string>('R2_PUBLIC_DOMAIN')) || '';

        this.logger.debug(`R2 Config - AccountID length: ${accountId?.length}, AccessKey length: ${accessKeyId?.length}`);
        
        if (!accountId || !accessKeyId || !secretAccessKey) {
            this.logger.error('CRITICAL: R2 Credentials missing in Environment Variables!');
        }

        this.s3Client = new S3Client({
            region: 'auto', // Cloudflare R2 works best with 'auto'
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId || '',
                secretAccessKey: secretAccessKey || '',
            },
            forcePathStyle: true,
        });
    }

    async uploadFile(
        file: Express.Multer.File,
        folder: UploadFolder = 'avatars',
    ): Promise<{ url: string; publicId: string }> {
        // Technically this serves for both video and image as long as we validate based on mime
        if (file.mimetype.startsWith('video/')) {
            this.validateVideoFile(file);
        } else {
            this.validateImageFile(file);
        }

        const ext = path.extname(file.originalname);
        // Use a UUID to avoid collisions. 
        // publicId format similar to what Cloudinary had, including folder.
        const fileKey = `reetro/${folder}/${uuidv4()}${ext}`;

        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                })
            );

            // Construct public URL
            // Format: https://pub-xxx.r2.dev/reetro/avatars/xxxx.jpg
            const secureUrl = `${this.publicDomain}/${fileKey}`;
            
            this.logger.log(`Uploaded file: ${fileKey} → ${secureUrl}`);

            return {
                url: secureUrl,
                publicId: fileKey, // we use the full S3 key as publicId so we can delete it later
            };
        } catch (error) {
            this.logger.error(`Upload failed: ${error}`);
            throw new BadRequestException('File upload failed');
        }
    }

    async uploadMultiple(
        files: Express.Multer.File[],
        folder: UploadFolder = 'avatars',
    ): Promise<Array<{ url: string; publicId: string }>> {
        return Promise.all(files.map(file => this.uploadFile(file, folder)));
    }

    async deleteFile(publicId: string): Promise<void> {
        try {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: publicId,
                })
            );
            this.logger.log(`Deleted file: ${publicId}`);
        } catch (error) {
            this.logger.warn(`Failed to delete file ${publicId}: ${error}`);
        }
    }

    private validateImageFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (file.size > MAX_IMAGE_SIZE) {
            throw new BadRequestException(`File size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit`);
        }

        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
            );
        }
    }

    private validateVideoFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (file.size > MAX_VIDEO_SIZE) {
            throw new BadRequestException(`Video size exceeds ${MAX_VIDEO_SIZE / 1024 / 1024}MB limit`);
        }

        if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid video type: ${file.mimetype}. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
            );
        }
    }
}

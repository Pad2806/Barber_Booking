import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export type UploadFolder = 'avatars' | 'salons' | 'services' | 'reviews';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(private readonly config: ConfigService) {
        cloudinary.config({
            cloud_name: this.config.get<string>('cloudinary.cloudName'),
            api_key: this.config.get<string>('cloudinary.apiKey'),
            api_secret: this.config.get<string>('cloudinary.apiSecret'),
        });
    }

    async uploadImage(
        file: Express.Multer.File,
        folder: UploadFolder = 'avatars',
    ): Promise<{ url: string; publicId: string }> {
        this.validateFile(file);

        const result = await this.uploadToCloudinary(file, folder);

        this.logger.log(`Uploaded image: ${result.public_id} → ${result.secure_url}`);

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }

    async uploadMultiple(
        files: Express.Multer.File[],
        folder: UploadFolder = 'avatars',
    ): Promise<Array<{ url: string; publicId: string }>> {
        return Promise.all(files.map(file => this.uploadImage(file, folder)));
    }

    async deleteImage(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
            this.logger.log(`Deleted image: ${publicId}`);
        } catch (error) {
            this.logger.warn(`Failed to delete image ${publicId}: ${error}`);
        }
    }

    private validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }
    }

    private uploadToCloudinary(
        file: Express.Multer.File,
        folder: UploadFolder,
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `reetro/${folder}`,
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error || !result) {
                        this.logger.error(`Upload failed: ${error?.message}`);
                        return reject(new BadRequestException('Image upload failed'));
                    }
                    resolve(result);
                },
            );

            const stream = new Readable();
            stream.push(file.buffer);
            stream.push(null);
            stream.pipe(uploadStream);
        });
    }
}

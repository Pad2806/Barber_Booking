import {
    Controller,
    Post,
    Delete,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Query,
    Param,
    UseGuards,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService, UploadFolder } from './storage.service';

const MB = 1024 * 1024;

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
    private readonly logger = new Logger(UploadController.name);

    constructor(private readonly storageService: StorageService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * MB } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                folder: { type: 'string', enum: ['avatars', 'salons', 'services', 'reviews'] },
            },
        },
    })
    async uploadSingle(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder: UploadFolder = 'avatars',
    ) {
        if (!file) throw new BadRequestException('No file provided');
        this.logger.log(`Upload image: ${file.originalname} (${file.size} bytes) → ${folder}`);
        const result = await this.storageService.uploadFile(file, folder);
        return result; // returns { url, publicId }
    }

    @Post('multiple')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 10 * MB } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
                folder: { type: 'string', enum: ['avatars', 'salons', 'services', 'reviews'] },
            },
        },
    })
    async uploadMultiple(
        @UploadedFiles() files: Express.Multer.File[],
        @Query('folder') folder: UploadFolder = 'avatars',
    ) {
        if (!files?.length) throw new BadRequestException('No files provided');
        this.logger.log(`Upload ${files.length} images → ${folder}`);
        const results = await this.storageService.uploadMultiple(files, folder);
        return results;
    }

    @Post('video')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    // Allow up to 100MB at Multer level (StorageService validates the final 50MB cap)
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * MB } }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                folder: { type: 'string', enum: ['services'] },
            },
        },
    })
    async uploadVideo(
        @UploadedFile() file: Express.Multer.File,
        @Query('folder') folder: UploadFolder = 'services',
    ) {
        if (!file) throw new BadRequestException('No video file provided');
        this.logger.log(`Upload video: ${file.originalname} (${(file.size / MB).toFixed(1)}MB) → ${folder}`);
        const result = await this.storageService.uploadFile(file, folder);
        return result;
    }

    @Delete(':publicId(*)')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async deleteFile(@Param('publicId') publicId: string) {
        // publicId might need to be url-decoded if it contains slashes, but usually Nest router handles it if defined carefully, or we pass it differently.
        // Actually, Express param matching might stop at slash unless defined with wildcard.
        // Let's assume standard behavior as before.
        await this.storageService.deleteFile(publicId);
        return { message: 'File deleted successfully' };
    }
}

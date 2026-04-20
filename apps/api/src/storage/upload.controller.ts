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
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService, UploadFolder } from './storage.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
    constructor(private readonly storageService: StorageService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
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
        const result = await this.storageService.uploadFile(file, folder);
        return result; // returns { url, publicId }
    }

    @Post('multiple')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 10 * 1024 * 1024 } }))
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
        const results = await this.storageService.uploadMultiple(files, folder);
        return results;
    }

    @Post('video')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
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

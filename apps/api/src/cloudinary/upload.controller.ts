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
import { CloudinaryService, UploadFolder } from './cloudinary.service';

@ApiTags('Upload')
@Controller('api/upload')
export class UploadController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

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
        const result = await this.cloudinaryService.uploadImage(file, folder);
        return result;
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
        const results = await this.cloudinaryService.uploadMultiple(files, folder);
        return results;
    }

    @Delete(':publicId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async deleteImage(@Param('publicId') publicId: string) {
        await this.cloudinaryService.deleteImage(publicId);
        return { message: 'Image deleted successfully' };
    }
}

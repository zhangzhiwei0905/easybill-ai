import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdatePreferencesDto, ChangePasswordDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('用户')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @ApiOperation({ summary: '获取用户资料' })
    async getProfile(@CurrentUser() user: { id: string }) {
        return this.usersService.getProfile(user.id);
    }

    @Post('avatar')
    @UseInterceptors(
        FileInterceptor('avatar', {
            limits: { fileSize: 2 * 1024 * 1024 },
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    cb(
                        new BadRequestException(
                            '只支持 JPG、PNG、GIF、WebP 格式的图片',
                        ),
                        false,
                    );
                    return;
                }
                cb(null, true);
            },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: '上传头像' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                avatar: { type: 'string', format: 'binary' },
            },
        },
    })
    async uploadAvatar(
        @CurrentUser() user: { id: string },
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('请选择图片文件');
        }
        const avatarUrl = await this.usersService.uploadAvatar(user.id, file);
        return { avatarUrl };
    }

    @Put('profile')
    @ApiOperation({ summary: '更新用户资料' })
    async updateProfile(
        @CurrentUser() user: { id: string },
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.id, dto);
    }

    @Get('preferences')
    @ApiOperation({ summary: '获取用户偏好设置' })
    async getPreferences(@CurrentUser() user: { id: string }) {
        return this.usersService.getPreferences(user.id);
    }

    @Put('preferences')
    @ApiOperation({ summary: '更新用户偏好设置' })
    async updatePreferences(
        @CurrentUser() user: { id: string },
        @Body() dto: UpdatePreferencesDto,
    ) {
        return this.usersService.updatePreferences(user.id, dto);
    }

    @Patch('password')
    @ApiOperation({ summary: '修改密码' })
    async changePassword(
        @CurrentUser() user: { id: string },
        @Body() dto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(user.id, dto);
    }
}

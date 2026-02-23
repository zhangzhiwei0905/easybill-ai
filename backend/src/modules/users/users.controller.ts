import {
    Controller,
    Get,
    Put,
    Patch,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

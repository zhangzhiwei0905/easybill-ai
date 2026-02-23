import {
    Injectable,
    NotFoundException,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto, UpdatePreferencesDto, ChangePasswordDto } from './dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // ── Get Profile ───────────────────────────────────────
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { preferences: true },
        });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }
        return this.formatUser(user);
    }

    // ── Update Profile ────────────────────────────────────
    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
            },
            include: { preferences: true },
        });
        return this.formatUser(user);
    }

    // ── Get Preferences ───────────────────────────────────
    async getPreferences(userId: string) {
        let prefs = await this.prisma.userPreference.findUnique({
            where: { userId },
        });
        if (!prefs) {
            prefs = await this.prisma.userPreference.create({
                data: { userId },
            });
        }
        return {
            currency: prefs.currency,
            language: prefs.language,
            theme: prefs.theme,
        };
    }

    // ── Update Preferences ────────────────────────────────
    async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
        const prefs = await this.prisma.userPreference.upsert({
            where: { userId },
            update: {
                ...(dto.currency !== undefined && { currency: dto.currency }),
                ...(dto.language !== undefined && { language: dto.language }),
                ...(dto.theme !== undefined && { theme: dto.theme }),
            },
            create: {
                userId,
                currency: dto.currency || 'CNY',
                language: dto.language || 'zh',
                theme: dto.theme || 'light',
            },
        });
        return {
            currency: prefs.currency,
            language: prefs.language,
            theme: prefs.theme,
        };
    }

    // ── Change Password ───────────────────────────────────
    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.passwordHash) {
            throw new NotFoundException('用户不存在');
        }

        const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
        if (!isOldPasswordValid) {
            throw new UnauthorizedException('原密码错误');
        }

        if (dto.oldPassword === dto.newPassword) {
            throw new BadRequestException('新密码不能与旧密码相同');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return { message: '密码修改成功' };
    }

    // ── Helper ────────────────────────────────────────────
    private formatUser(user: any) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatarUrl,
            isPro: user.isPro,
            preferences: user.preferences
                ? {
                    currency: user.preferences.currency,
                    language: user.preferences.language,
                    theme: user.preferences.theme,
                }
                : null,
        };
    }
}

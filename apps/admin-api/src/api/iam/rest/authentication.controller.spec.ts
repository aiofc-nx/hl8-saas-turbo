import { BadRequestException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyRequest } from 'fastify';

import { PasswordIdentifierDTO } from '@/lib/bounded-contexts/iam/authentication/application/dto/password-identifier.dto';
import { RefreshTokenDTO } from '@/lib/bounded-contexts/iam/authentication/application/dto/refresh-token.dto';
import { AuthenticationService } from '@/lib/bounded-contexts/iam/authentication/application/service/authentication.service';
import { UserCreateCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-create.command';
import { UserReadRepoPortToken } from '@/lib/bounded-contexts/iam/authentication/constants';
import type { UserReadRepoPort } from '@/lib/bounded-contexts/iam/authentication/ports/user.read.repo-port';

import { USER_AGENT } from '@hl8/constants';
import { Ip2regionService } from '@hl8/ip2region';
import { MailService } from '@hl8/mail';
import { RedisUtility } from '@hl8/redis';
import { ApiRes } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
// Mock @repo/constants/app
jest.mock('@repo/constants/app', () => ({
  APP_NAME: 'Test App',
  APP_URL: 'https://test.example.com',
}));

// Mock @hl8/utils
jest.mock('@hl8/utils', () => ({
  getClientIpAndPort: jest.fn().mockReturnValue({
    ip: '192.168.1.1',
    port: 8080,
  }),
}));

import { ConfirmEmailDto } from '../dto/confirm-email.dto';
import { PasswordLoginDto } from '../dto/password-login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResendConfirmationEmailDto } from '../dto/resend-confirmation-email.dto';
import { SignOutDto } from '../dto/sign-out.dto';
import { AuthenticationController } from './authentication.controller';

/**
 * AuthenticationController 单元测试
 *
 * @description
 * 测试认证控制器的实现，验证登录、注册、刷新令牌、获取用户信息、确认邮箱等功能。
 */
describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let authenticationService: jest.Mocked<AuthenticationService>;
  let commandBus: jest.Mocked<CommandBus>;
  let userReadRepoPort: jest.Mocked<UserReadRepoPort>;
  let mailService: jest.Mocked<MailService>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // 创建 Mock 服务
    const mockAuthenticationService = {
      execPasswordLogin: jest.fn(),
      refreshToken: jest.fn(),
      verifyEmailAndLogin: jest.fn(),
      signOut: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationService>;

    const mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    const mockUserReadRepoPort = {
      findUserByIdentifier: jest.fn(),
      getUserByUsername: jest.fn(),
      findUserById: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepoPort>;

    const mockMailService = {
      sendEmail: jest.fn(),
    } as unknown as jest.Mocked<MailService>;

    // Mock RedisUtility
    const mockRedisInstance = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      smembers: jest.fn(),
    };
    jest
      .spyOn(RedisUtility, 'instance', 'get')
      .mockReturnValue(mockRedisInstance as any);

    // Mock Ip2regionService
    const mockIp2regionSearcher = {
      search: jest.fn(),
    };
    jest
      .spyOn(Ip2regionService, 'getSearcher')
      .mockReturnValue(mockIp2regionSearcher as any);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockAuthenticationService,
        },
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: UserReadRepoPortToken,
          useValue: mockUserReadRepoPort,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
    authenticationService = module.get(AuthenticationService);
    commandBus = module.get(CommandBus);
    userReadRepoPort = module.get(UserReadRepoPortToken);
    mailService = module.get(MailService);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('login', () => {
    /**
     * 应该成功进行密码登录
     *
     * 验证能够正确执行密码登录并返回令牌。
     */
    it('应该成功进行密码登录', async () => {
      const dto = new PasswordLoginDto();
      dto.identifier = 'testuser@example.com';
      dto.password = 'password123';

      const mockRequest = {
        headers: {
          [USER_AGENT]: 'Mozilla/5.0',
        },
        ip: '192.168.1.1',
        socket: {
          remotePort: 8080,
        },
      } as unknown as FastifyRequest;

      const mockToken = {
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      (authenticationService.execPasswordLogin as jest.Mock).mockResolvedValue(
        mockToken,
      );

      // Mock Ip2regionService
      const mockSearcher = {
        search: jest.fn().mockResolvedValue({ region: '北京市' }),
      };
      jest
        .spyOn(Ip2regionService, 'getSearcher')
        .mockReturnValue(mockSearcher as any);

      const result = await controller.login(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockToken);
      expect(authenticationService.execPasswordLogin).toHaveBeenCalledWith(
        expect.any(PasswordIdentifierDTO),
      );
    });

    /**
     * 应该正确处理登录异常
     *
     * 验证当登录失败时，能够正确传播异常。
     */
    it('应该正确处理登录异常', async () => {
      const dto = new PasswordLoginDto();
      dto.identifier = 'testuser@example.com';
      dto.password = 'wrong-password';

      const mockRequest = {
        headers: {
          [USER_AGENT]: 'Mozilla/5.0',
        },
        ip: '192.168.1.1',
        socket: {
          remotePort: 8080,
        },
      } as unknown as FastifyRequest;

      const error = new Error('用户名或密码错误');
      (authenticationService.execPasswordLogin as jest.Mock).mockRejectedValue(
        error,
      );

      const mockSearcher = {
        search: jest.fn().mockResolvedValue({ region: '北京市' }),
      };
      jest
        .spyOn(Ip2regionService, 'getSearcher')
        .mockReturnValue(mockSearcher as any);

      await expect(controller.login(dto, mockRequest)).rejects.toThrow(
        '用户名或密码错误',
      );
    });
  });

  describe('refreshToken', () => {
    /**
     * 应该成功刷新访问令牌
     *
     * 验证能够正确刷新令牌并返回新的访问令牌和刷新令牌。
     */
    it('应该成功刷新访问令牌', async () => {
      const refreshToken = 'refresh-token-123';

      const mockRequest = {
        headers: {
          [USER_AGENT]: 'Mozilla/5.0',
        },
        ip: '192.168.1.1',
        socket: {
          remotePort: 8080,
        },
      } as unknown as FastifyRequest;

      const mockToken = {
        token: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123',
      };

      (authenticationService.refreshToken as jest.Mock).mockResolvedValue(
        mockToken,
      );

      const mockSearcher = {
        search: jest.fn().mockResolvedValue({ region: '北京市' }),
      };
      jest
        .spyOn(Ip2regionService, 'getSearcher')
        .mockReturnValue(mockSearcher as any);

      const result = await controller.refreshToken(refreshToken, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockToken);
      expect(authenticationService.refreshToken).toHaveBeenCalledWith(
        expect.any(RefreshTokenDTO),
      );
    });
  });

  describe('register', () => {
    /**
     * 应该成功注册新用户
     *
     * 验证能够正确注册新用户并返回成功消息。
     */
    it('应该成功注册新用户', async () => {
      const dto = new RegisterDto();
      dto.email = 'newuser@example.com';
      dto.password = 'password123';
      dto.username = 'newuser';
      dto.nickName = '新用户';

      (userReadRepoPort.findUserByIdentifier as jest.Mock).mockResolvedValue(
        null,
      );
      (userReadRepoPort.getUserByUsername as jest.Mock).mockResolvedValue(null);
      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.register(dto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data?.message).toContain('注册成功');
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UserCreateCommand),
      );
    });

    /**
     * 应该抛出异常当邮箱已存在时
     *
     * 验证当邮箱已被注册时，能够正确抛出异常。
     */
    it('应该抛出异常当邮箱已存在时', async () => {
      const dto = new RegisterDto();
      dto.email = 'existing@example.com';
      dto.password = 'password123';

      (userReadRepoPort.findUserByIdentifier as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'existing@example.com',
      });

      await expect(controller.register(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.register(dto)).rejects.toThrow('该邮箱已被注册');
    });
  });

  describe('getProfile', () => {
    /**
     * 应该成功获取当前用户信息
     *
     * 验证能够正确获取当前登录用户的信息。
     */
    it('应该成功获取当前用户信息', async () => {
      const mockRequest = {
        user: {
          uid: 'user-123',
          username: 'testuser',
          domain: 'example.com',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const mockUserInfo = {
        id: 'user-123',
        username: 'testuser',
        nickName: '测试用户',
        avatar: 'https://example.com/avatar.jpg',
        email: 'testuser@example.com',
        phoneNumber: '13800138000',
        isEmailVerified: true,
      };

      (userReadRepoPort.findUserById as jest.Mock).mockResolvedValue(
        mockUserInfo,
      );

      const mockRedisInstance = {
        smembers: jest.fn().mockResolvedValue(['admin', 'user']),
      };
      jest
        .spyOn(RedisUtility, 'instance', 'get')
        .mockReturnValue(mockRedisInstance as any);

      const result = await controller.getProfile(mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data?.userId).toBe('user-123');
      expect(result.data?.userName).toBe('testuser');
      expect(result.data?.roles).toEqual(['admin', 'user']);
    });
  });

  describe('confirmEmail', () => {
    /**
     * 应该成功确认邮箱
     *
     * 验证能够正确验证邮箱并自动登录。
     */
    it('应该成功确认邮箱', async () => {
      const dto = new ConfirmEmailDto();
      dto.email = 'user@example.com';
      dto.token = '123456';

      const mockRequest = {
        headers: {
          [USER_AGENT]: 'Mozilla/5.0',
        },
        ip: '192.168.1.1',
        socket: {
          remotePort: 8080,
        },
      } as unknown as FastifyRequest;

      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'user@example.com',
        domain: 'example.com',
      };

      const mockToken = {
        token: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      const mockRedisInstance = {
        get: jest.fn().mockResolvedValue('123456'),
        del: jest.fn().mockResolvedValue(1),
      };
      jest
        .spyOn(RedisUtility, 'instance', 'get')
        .mockReturnValue(mockRedisInstance as any);

      (userReadRepoPort.findUserByIdentifier as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (commandBus.execute as jest.Mock).mockResolvedValue(undefined);
      (
        authenticationService.verifyEmailAndLogin as jest.Mock
      ).mockResolvedValue(mockToken);

      const mockSearcher = {
        search: jest.fn().mockResolvedValue({ region: '北京市' }),
      };
      jest
        .spyOn(Ip2regionService, 'getSearcher')
        .mockReturnValue(mockSearcher as any);

      const result = await controller.confirmEmail(dto, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data?.message).toBe('邮箱验证成功');
      expect(result.data?.tokens).toBeDefined();
    });

    /**
     * 应该抛出异常当验证码不存在时
     *
     * 验证当验证码已过期或不存在时，能够正确抛出异常。
     */
    it('应该抛出异常当验证码不存在时', async () => {
      const dto = new ConfirmEmailDto();
      dto.email = 'user@example.com';
      dto.token = '123456';

      const mockRequest = {
        headers: {},
        ip: '192.168.1.1',
      } as unknown as FastifyRequest;

      const mockRedisInstance = {
        get: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(RedisUtility, 'instance', 'get')
        .mockReturnValue(mockRedisInstance as any);

      await expect(controller.confirmEmail(dto, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.confirmEmail(dto, mockRequest)).rejects.toThrow(
        '验证码已过期或不存在',
      );
    });
  });

  describe('resendConfirmationEmail', () => {
    /**
     * 应该成功重发确认邮件
     *
     * 验证能够正确重新发送确认邮件。
     */
    it('应该成功重发确认邮件', async () => {
      const dto = new ResendConfirmationEmailDto();
      dto.email = 'user@example.com';

      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'user@example.com',
        nickName: '测试用户',
      };

      (userReadRepoPort.findUserByIdentifier as jest.Mock).mockResolvedValue(
        mockUser,
      );

      const mockRedisInstance = {
        setex: jest.fn().mockResolvedValue('OK'),
      };
      jest
        .spyOn(RedisUtility, 'instance', 'get')
        .mockReturnValue(mockRedisInstance as any);

      (mailService.sendEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.resendConfirmationEmail(dto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data?.message).toContain('验证码已重新发送');
      expect(mailService.sendEmail).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当用户不存在时
     *
     * 验证当用户不存在时，能够正确抛出异常。
     */
    it('应该抛出异常当用户不存在时', async () => {
      const dto = new ResendConfirmationEmailDto();
      dto.email = 'nonexistent@example.com';

      (userReadRepoPort.findUserByIdentifier as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(controller.resendConfirmationEmail(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.resendConfirmationEmail(dto)).rejects.toThrow(
        '用户不存在',
      );
    });
  });

  describe('signOut', () => {
    /**
     * 应该成功退出登录
     *
     * 验证能够正确执行退出登录操作。
     */
    it('应该成功退出登录', async () => {
      const dto = new SignOutDto();
      dto.refreshToken = 'refresh-token-123';

      (authenticationService.signOut as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.signOut(dto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data?.message).toBe('退出成功');
      expect(authenticationService.signOut).toHaveBeenCalledWith(
        'refresh-token-123',
      );
    });
  });
});

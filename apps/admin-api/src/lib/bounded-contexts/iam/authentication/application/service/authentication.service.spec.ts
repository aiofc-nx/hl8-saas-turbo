import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventPublisher, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { SecurityConfig, type ISecurityConfig } from '@hl8/config';
import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';

import { TokenStatus } from '../../../tokens/constants';
import { TokensEntity } from '../../../tokens/domain/tokens.entity';
import { TokensReadModel } from '../../../tokens/domain/tokens.read.model';
import { TokensByRefreshTokenQuery } from '../../../tokens/queries/tokens.by-refresh_token.query';

import { Status } from '@/lib/shared/enums/status.enum';

import { UserReadRepoPortToken } from '../../constants';
import { User } from '../../domain/user';
import type { UserReadRepoPort } from '../../ports/user.read.repo-port';
import { PasswordIdentifierDTO } from '../dto/password-identifier.dto';
import { RefreshTokenDTO } from '../dto/refresh-token.dto';
import { AuthenticationService } from './authentication.service';

// Mock TokensEntity
jest.mock('../../../tokens/domain/tokens.entity');
// Mock User
jest.mock('../../domain/user');

/**
 * AuthenticationService 单元测试
 *
 * @description
 * 测试认证服务的业务逻辑，包括密码登录、刷新令牌、邮箱验证登录和退出登录。
 */
describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let jwtService: jest.Mocked<JwtService>;
  let publisher: jest.Mocked<EventPublisher>;
  let repository: jest.Mocked<UserReadRepoPort>;
  let queryBus: jest.Mocked<QueryBus>;
  let securityConfig: ISecurityConfig;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock 所有依赖服务。
   */
  beforeEach(async () => {
    // Mock JwtService
    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    // Mock EventPublisher
    const mockPublisher = {
      mergeObjectContext: jest.fn().mockReturnThis(),
    };

    // Mock UserReadRepoPort
    const mockRepository: UserReadRepoPort = {
      findUserById: jest.fn(),
      findUserByIdentifier: jest.fn(),
      findRolesByUserId: jest.fn(),
      pageUsers: jest.fn(),
      findUsersByIds: jest.fn(),
      getUserByUsername: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepoPort>;

    // Mock QueryBus
    const mockQueryBus = {
      execute: jest.fn(),
    };

    // Mock SecurityConfig
    const mockSecurityConfig: ISecurityConfig = {
      jwtExpiresIn: 3600,
      refreshJwtSecret: 'refresh-secret',
      refreshJwtExpiresIn: 7200,
    };

    // Mock RedisUtility
    const mockRedisInstance = {
      del: jest.fn().mockResolvedValue(1),
      sadd: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    };
    jest
      .spyOn(RedisUtility, 'instance', 'get')
      .mockReturnValue(mockRedisInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EventPublisher,
          useValue: mockPublisher,
        },
        {
          provide: UserReadRepoPortToken,
          useValue: mockRepository,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: SecurityConfig.KEY,
          useValue: mockSecurityConfig,
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    jwtService = module.get(JwtService);
    publisher = module.get(EventPublisher);
    repository = module.get(UserReadRepoPortToken);
    queryBus = module.get(QueryBus);
    securityConfig = module.get(SecurityConfig.KEY);
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

  describe('execPasswordLogin', () => {
    /**
     * 应该成功执行密码登录
     *
     * 验证当提供有效的标识符和密码时，服务能够正确生成令牌并缓存角色信息。
     */
    it('应该成功执行密码登录', async () => {
      const dto = new PasswordIdentifierDTO(
        'testuser@example.com',
        'password123',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'request-123',
        'web',
      );

      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        status: Status.ENABLED,
        email: 'testuser@example.com',
        isEmailVerified: true,
        password: '$2b$10$hashedpassword',
      } as any;

      const mockUserAggregate = {
        loginUser: jest.fn().mockResolvedValue({
          success: true,
          message: 'Login successful',
        }),
        apply: jest.fn(),
        commit: jest.fn(),
      };

      (User as jest.MockedClass<typeof User>).mockImplementation(
        () => mockUserAggregate as any,
      );

      (repository.findUserByIdentifier as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (repository.findRolesByUserId as jest.Mock).mockResolvedValue(
        new Set(['admin', 'user']),
      );
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.execPasswordLogin(dto);

      expect(result).toEqual({
        token: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(repository.findUserByIdentifier).toHaveBeenCalledWith(
        'testuser@example.com',
      );
      expect(mockUserAggregate.loginUser).toHaveBeenCalledWith('password123');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(RedisUtility.instance.del).toHaveBeenCalled();
      expect(RedisUtility.instance.sadd).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当用户不存在时
     *
     * 验证当用户不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当用户不存在时', async () => {
      const dto = new PasswordIdentifierDTO(
        'nonexistent@example.com',
        'password123',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'request-123',
        'web',
      );

      (repository.findUserByIdentifier as jest.Mock).mockResolvedValue(null);

      await expect(service.execPasswordLogin(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.execPasswordLogin(dto)).rejects.toThrow(
        'User not found.',
      );
    });

    /**
     * 应该抛出异常当密码验证失败时
     *
     * 验证当密码验证失败时，服务能够正确抛出异常。
     */
    it('应该抛出异常当密码验证失败时', async () => {
      const dto = new PasswordIdentifierDTO(
        'testuser@example.com',
        'wrongpassword',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'request-123',
        'web',
      );

      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        nickName: '测试用户',
        status: Status.ENABLED,
        email: 'testuser@example.com',
        isEmailVerified: true,
        password: '$2b$10$hashedpassword',
      } as any;

      const mockUserAggregate = {
        loginUser: jest.fn().mockResolvedValue({
          success: false,
          message: 'Invalid credentials.',
        }),
      };

      (User as jest.MockedClass<typeof User>).mockImplementation(
        () => mockUserAggregate as any,
      );

      (repository.findUserByIdentifier as jest.Mock).mockResolvedValue(
        mockUser,
      );

      await expect(service.execPasswordLogin(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.execPasswordLogin(dto)).rejects.toThrow(
        'Invalid credentials.',
      );
    });
  });

  describe('refreshToken', () => {
    /**
     * 应该成功刷新令牌
     *
     * 验证当提供有效的刷新令牌时，服务能够正确生成新的访问令牌和刷新令牌。
     */
    it('应该成功刷新令牌', async () => {
      const dto = new RefreshTokenDTO(
        'refresh-token-123',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'request-123',
        'web',
      );

      const mockTokenDetails: TokensReadModel = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token-123',
        status: TokenStatus.UNUSED,
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        ip: '192.168.1.1',
        address: '北京市',
        userAgent: 'Mozilla/5.0',
        requestId: 'request-123',
        type: 'web',
        createdBy: 'system',
      } as TokensReadModel;

      const mockTokensAggregate = {
        refreshTokenCheck: jest.fn().mockResolvedValue(undefined),
        apply: jest.fn(),
        commit: jest.fn(),
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
      };

      (
        TokensEntity as jest.MockedClass<typeof TokensEntity>
      ).mockImplementation(() => mockTokensAggregate as any);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockTokenDetails);
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue(undefined);
      (jwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshToken(dto);

      expect(result).toEqual({
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(TokensByRefreshTokenQuery),
      );
      expect(jwtService.verifyAsync).toHaveBeenCalled();
      expect(mockTokensAggregate.refreshTokenCheck).toHaveBeenCalled();
    });

    /**
     * 应该抛出异常当刷新令牌不存在时
     *
     * 验证当刷新令牌不存在时，服务能够正确抛出异常。
     */
    it('应该抛出异常当刷新令牌不存在时', async () => {
      const dto = new RefreshTokenDTO(
        'invalid-refresh-token',
        '192.168.1.1',
        '北京市',
        'Mozilla/5.0',
        'request-123',
        'web',
      );

      (queryBus.execute as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshToken(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.refreshToken(dto)).rejects.toThrow(
        'Refresh token not found.',
      );
    });
  });

  describe('signOut', () => {
    /**
     * 应该成功退出登录
     *
     * 验证当提供有效的刷新令牌时，服务能够正确清除缓存。
     */
    it('应该成功退出登录', async () => {
      const refreshToken = 'refresh-token-123';

      const mockTokenDetails: TokensReadModel = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token-123',
        status: TokenStatus.UNUSED,
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        ip: '192.168.1.1',
        address: '北京市',
        userAgent: 'Mozilla/5.0',
        requestId: 'request-123',
        type: 'web',
        createdBy: 'system',
      } as TokensReadModel;

      const mockTokensAggregate = {
        refreshTokenCheck: jest.fn().mockResolvedValue(undefined),
        commit: jest.fn(),
      };

      (
        TokensEntity as jest.MockedClass<typeof TokensEntity>
      ).mockImplementation(() => mockTokensAggregate as any);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockTokenDetails);

      await service.signOut(refreshToken);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(TokensByRefreshTokenQuery),
      );
      expect(RedisUtility.instance.del).toHaveBeenCalledWith(
        `${CacheConstant.AUTH_TOKEN_PREFIX}user-123`,
      );
    });

    /**
     * 应该正确处理令牌不存在的情况
     *
     * 验证当刷新令牌不存在时，服务能够优雅地处理（不抛出异常）。
     */
    it('应该正确处理令牌不存在的情况', async () => {
      const refreshToken = 'invalid-refresh-token';

      (queryBus.execute as jest.Mock).mockResolvedValue(null);

      await expect(service.signOut(refreshToken)).resolves.not.toThrow();
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(TokensByRefreshTokenQuery),
      );
    });
  });
});

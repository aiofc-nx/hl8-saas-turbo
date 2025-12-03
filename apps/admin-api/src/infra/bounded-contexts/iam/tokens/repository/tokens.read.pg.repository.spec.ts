import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { TokensReadModel } from '@/lib/bounded-contexts/iam/tokens/domain/tokens.read.model';

import { TokensReadRepository } from './tokens.read.pg.repository';

/**
 * TokensReadRepository 单元测试
 *
 * @description
 * 测试令牌读取仓储的实现，验证根据刷新令牌查找令牌的功能。
 */
describe('TokensReadRepository', () => {
  let repository: TokensReadRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensReadRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<TokensReadRepository>(TokensReadRepository);
    entityManager = module.get(EntityManager);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findTokensByRefreshToken', () => {
    /**
     * 应该成功根据刷新令牌查找令牌
     *
     * 验证当刷新令牌存在时，能够正确返回令牌读取模型。
     */
    it('应该成功根据刷新令牌查找令牌', async () => {
      const refreshToken = 'refresh-token-123';
      const mockTokens: TokensReadModel = {
        accessToken: 'access-token-123',
        refreshToken: refreshToken,
        status: 'ACTIVE',
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        loginTime: new Date(),
        ip: '192.168.1.1',
        port: 8080,
        address: '测试地址',
        userAgent: 'Mozilla/5.0',
        requestId: 'request-123',
        type: 'LOGIN',
        createdAt: new Date(),
        createdBy: 'system',
      } as TokensReadModel;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockTokens);

      const result = await repository.findTokensByRefreshToken(refreshToken);

      expect(result).toEqual(mockTokens);
      expect(result?.refreshToken).toBe(refreshToken);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysTokens', {
        refreshToken,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当刷新令牌不存在时
     *
     * 验证当刷新令牌不存在时，方法返回 null。
     */
    it('应该返回 null 当刷新令牌不存在时', async () => {
      const refreshToken = 'non-existent-refresh-token';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.findTokensByRefreshToken(refreshToken);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith('SysTokens', {
        refreshToken,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const refreshToken = 'refresh-token-123';
      const error = new Error('数据库连接失败');

      (entityManager.findOne as jest.Mock).mockRejectedValue(error);

      await expect(
        repository.findTokensByRefreshToken(refreshToken),
      ).rejects.toThrow('数据库连接失败');
      expect(entityManager.findOne).toHaveBeenCalledWith('SysTokens', {
        refreshToken,
      });
    });

    /**
     * 应该使用正确的查询参数
     *
     * 验证方法使用正确的刷新令牌参数进行查询。
     */
    it('应该使用正确的查询参数', async () => {
      const refreshToken = 'refresh-token-456';
      const mockTokens: TokensReadModel = {
        accessToken: 'access-token-456',
        refreshToken: refreshToken,
        status: 'ACTIVE',
        userId: 'user-456',
        username: 'testuser2',
        domain: 'example.com',
        loginTime: new Date(),
        ip: '192.168.1.2',
        port: null,
        address: '测试地址2',
        userAgent: 'Mozilla/5.0',
        requestId: 'request-456',
        type: 'LOGIN',
        createdAt: new Date(),
        createdBy: 'system',
      } as TokensReadModel;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockTokens);

      await repository.findTokensByRefreshToken(refreshToken);

      expect(entityManager.findOne).toHaveBeenCalledWith('SysTokens', {
        refreshToken,
      });
      expect(entityManager.findOne).not.toHaveBeenCalledWith('SysTokens', {
        refreshToken: 'wrong-token',
      });
    });
  });
});

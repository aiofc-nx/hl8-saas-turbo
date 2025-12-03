import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { TokenStatus } from '@/lib/bounded-contexts/iam/tokens/constants';
import { TokensEntity } from '@/lib/bounded-contexts/iam/tokens/domain/tokens.entity';

import { TokensWriteRepository } from './tokens.write.pg.repository';

/**
 * TokensWriteRepository 单元测试
 *
 * @description
 * 测试令牌写入仓储的实现，验证保存令牌和更新令牌状态的功能。
 */
describe('TokensWriteRepository', () => {
  let repository: TokensWriteRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      create: jest.fn(),
      persistAndFlush: jest.fn(),
      nativeUpdate: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensWriteRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<TokensWriteRepository>(TokensWriteRepository);
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

  describe('save', () => {
    /**
     * 应该成功保存令牌
     *
     * 验证能够正确创建并持久化令牌，使用 refreshToken 作为主键 ID。
     */
    it('应该成功保存令牌', async () => {
      const tokens = new TokensEntity({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        status: TokenStatus.UNUSED,
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        ip: '192.168.1.1',
        address: '北京市',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123',
        type: 'password',
        createdBy: 'user-123',
        port: 8080,
      });

      const mockTokensEntity = {
        id: tokens.refreshToken,
        ...tokens,
        createdAt: new Date(),
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockTokensEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(tokens);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysTokens',
        expect.objectContaining({
          id: tokens.refreshToken,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          status: tokens.status,
          userId: tokens.userId,
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockTokensEntity,
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const tokens = new TokensEntity({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        status: TokenStatus.UNUSED,
        userId: 'user-123',
        username: 'testuser',
        domain: 'example.com',
        ip: '192.168.1.1',
        address: '北京市',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123',
        type: 'password',
        createdBy: 'user-123',
      });

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(tokens)).rejects.toThrow('数据库保存失败');
    });
  });

  describe('updateTokensStatus', () => {
    /**
     * 应该成功更新令牌状态
     *
     * 验证能够正确更新指定刷新令牌的状态。
     */
    it('应该成功更新令牌状态', async () => {
      const refreshToken = 'refresh-token-123';
      const newStatus = TokenStatus.USED;

      (entityManager.nativeUpdate as jest.Mock).mockResolvedValue(1);

      await repository.updateTokensStatus(refreshToken, newStatus);

      expect(entityManager.nativeUpdate).toHaveBeenCalledWith(
        'SysTokens',
        { refreshToken },
        { status: newStatus },
      );
      expect(entityManager.nativeUpdate).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新操作失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const refreshToken = 'refresh-token-123';
      const newStatus = TokenStatus.USED;
      const error = new Error('数据库更新失败');

      (entityManager.nativeUpdate as jest.Mock).mockRejectedValue(error);

      await expect(
        repository.updateTokensStatus(refreshToken, newStatus),
      ).rejects.toThrow('数据库更新失败');
    });
  });
});

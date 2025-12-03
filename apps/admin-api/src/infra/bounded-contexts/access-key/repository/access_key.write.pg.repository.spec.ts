import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { AccessKey } from '@/lib/bounded-contexts/access-key/domain/access_key.model';
import { Status } from '@/lib/shared/enums/status.enum';

import { AccessKeyWritePostgresRepository } from './access_key.write.pg.repository';

/**
 * AccessKeyWritePostgresRepository 单元测试
 *
 * @description
 * 测试访问密钥写入仓储的实现，验证保存和删除访问密钥的功能。
 */
describe('AccessKeyWritePostgresRepository', () => {
  let repository: AccessKeyWritePostgresRepository;
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
      nativeDelete: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessKeyWritePostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<AccessKeyWritePostgresRepository>(
      AccessKeyWritePostgresRepository,
    );
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
     * 应该成功保存访问密钥
     *
     * 验证能够正确创建并持久化访问密钥。
     */
    it('应该成功保存访问密钥', async () => {
      const accessKey = AccessKey.fromProp({
        id: 'key-123',
        domain: 'example.com',
        AccessKeyID: 'AK-123',
        AccessKeySecret: 'secret-123',
        status: Status.ENABLED,
        description: '测试密钥',
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const mockAccessKeyEntity = {
        id: 'key-123',
        ...accessKey,
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockAccessKeyEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(accessKey);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysAccessKey',
        expect.objectContaining({
          domain: 'example.com',
          AccessKeyID: 'AK-123',
          AccessKeySecret: 'secret-123',
          status: Status.ENABLED,
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockAccessKeyEntity,
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const accessKey = AccessKey.fromProp({
        id: 'key-123',
        domain: 'example.com',
        AccessKeyID: 'AK-123',
        AccessKeySecret: 'secret-123',
        status: Status.ENABLED,
        description: '测试密钥',
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(accessKey)).rejects.toThrow(
        '数据库保存失败',
      );
    });
  });

  describe('deleteById', () => {
    /**
     * 应该成功根据 ID 删除访问密钥
     *
     * 验证能够正确删除指定 ID 的访问密钥。
     */
    it('应该成功根据 ID 删除访问密钥', async () => {
      const accessKeyId = 'key-123';

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(1);

      await repository.deleteById(accessKeyId);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysAccessKey', {
        id: accessKeyId,
      });
      expect(entityManager.nativeDelete).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除操作失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const accessKeyId = 'key-123';
      const error = new Error('数据库删除失败');

      (entityManager.nativeDelete as jest.Mock).mockRejectedValue(error);

      await expect(repository.deleteById(accessKeyId)).rejects.toThrow(
        '数据库删除失败',
      );
    });
  });
});

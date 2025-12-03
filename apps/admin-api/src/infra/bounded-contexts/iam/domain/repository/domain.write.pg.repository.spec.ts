import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Domain } from '@/lib/bounded-contexts/iam/domain/domain/domain.model';
import { Status } from '@/lib/shared/enums/status.enum';

import { DomainWriteRepository } from './domain.write.pg.repository';

/**
 * DomainWriteRepository 单元测试
 *
 * @description
 * 测试域写入仓储的实现，验证保存、更新和删除域的功能。
 */
describe('DomainWriteRepository', () => {
  let repository: DomainWriteRepository;
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
      nativeUpdate: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainWriteRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<DomainWriteRepository>(DomainWriteRepository);
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
     * 应该成功保存域
     *
     * 验证能够正确创建并持久化域。
     */
    it('应该成功保存域', async () => {
      const domain = Domain.fromCreate({
        code: 'example',
        name: '示例域',
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const mockDomainEntity = {
        id: 'domain-123',
        ...domain,
      };

      (entityManager.create as jest.Mock).mockReturnValue(mockDomainEntity);
      (entityManager.persistAndFlush as jest.Mock).mockResolvedValue(undefined);

      await repository.save(domain);

      expect(entityManager.create).toHaveBeenCalledWith(
        'SysDomain',
        expect.objectContaining({
          code: 'example',
          name: '示例域',
          status: Status.ENABLED,
        }),
      );
      expect(entityManager.persistAndFlush).toHaveBeenCalledWith(
        mockDomainEntity,
      );
    });

    /**
     * 应该正确处理保存异常
     *
     * 验证当保存操作失败时，能够正确传播异常。
     */
    it('应该正确处理保存异常', async () => {
      const domain = Domain.fromCreate({
        code: 'example',
        name: '示例域',
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const error = new Error('数据库保存失败');
      (entityManager.create as jest.Mock).mockReturnValue({});
      (entityManager.persistAndFlush as jest.Mock).mockRejectedValue(error);

      await expect(repository.save(domain)).rejects.toThrow('数据库保存失败');
    });
  });

  describe('update', () => {
    /**
     * 应该成功更新域
     *
     * 验证能够正确更新域的信息，排除创建时间和创建者字段。
     */
    it('应该成功更新域', async () => {
      const domain = Domain.fromUpdate({
        id: 'domain-123',
        code: 'example',
        name: '更新后的域名',
        status: Status.DISABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-2',
      });

      (entityManager.nativeUpdate as jest.Mock).mockResolvedValue(1);

      await repository.update(domain);

      expect(entityManager.nativeUpdate).toHaveBeenCalledWith(
        'SysDomain',
        { id: domain.id },
        expect.objectContaining({
          code: 'example',
          name: '更新后的域名',
          status: Status.DISABLED,
        }),
      );
      expect(entityManager.nativeUpdate).not.toHaveBeenCalledWith(
        'SysDomain',
        { id: domain.id },
        expect.objectContaining({
          createdAt: expect.anything(),
          createdBy: expect.anything(),
        }),
      );
    });

    /**
     * 应该正确处理更新异常
     *
     * 验证当更新操作失败时，能够正确传播异常。
     */
    it('应该正确处理更新异常', async () => {
      const domain = Domain.fromUpdate({
        id: 'domain-123',
        code: 'example',
        name: '示例域',
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-2',
      });

      const error = new Error('数据库更新失败');
      (entityManager.nativeUpdate as jest.Mock).mockRejectedValue(error);

      await expect(repository.update(domain)).rejects.toThrow('数据库更新失败');
    });
  });

  describe('delete', () => {
    /**
     * 应该成功删除域
     *
     * 验证能够正确删除指定 ID 的域。
     */
    it('应该成功删除域', async () => {
      const domain = Domain.fromProp({
        id: 'domain-123',
        code: 'example',
        name: '示例域',
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      (entityManager.nativeDelete as jest.Mock).mockResolvedValue(1);

      await repository.delete(domain);

      expect(entityManager.nativeDelete).toHaveBeenCalledWith('SysDomain', {
        id: domain.id,
      });
      expect(entityManager.nativeDelete).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理删除异常
     *
     * 验证当删除操作失败时，能够正确传播异常。
     */
    it('应该正确处理删除异常', async () => {
      const domain = Domain.fromProp({
        id: 'domain-123',
        code: 'example',
        name: '示例域',
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
      });

      const error = new Error('数据库删除失败');

      (entityManager.nativeDelete as jest.Mock).mockRejectedValue(error);

      await expect(repository.delete(domain)).rejects.toThrow('数据库删除失败');
    });
  });
});

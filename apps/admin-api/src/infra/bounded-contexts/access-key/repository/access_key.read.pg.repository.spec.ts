import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import {
  AccessKeyProperties,
  AccessKeyReadModel,
} from '@/lib/bounded-contexts/access-key/domain/access_key.read.model';
import { PageAccessKeysQuery } from '@/lib/bounded-contexts/access-key/queries/page-access_key.query';
import { Status } from '@/lib/shared/enums/status.enum';

import { PaginationResult } from '@hl8/rest';

import { AccessKeyReadPostgresRepository } from './access_key.read.pg.repository';

/**
 * AccessKeyReadPostgresRepository 单元测试
 *
 * @description
 * 测试访问密钥读取仓储的实现，验证分页查询、按 ID 查询和查询所有访问密钥的功能。
 */
describe('AccessKeyReadPostgresRepository', () => {
  let repository: AccessKeyReadPostgresRepository;
  let entityManager: jest.Mocked<EntityManager>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock EntityManager 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock EntityManager
    const mockEntityManager = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessKeyReadPostgresRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<AccessKeyReadPostgresRepository>(
      AccessKeyReadPostgresRepository,
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

  describe('pageAccessKeys', () => {
    /**
     * 应该成功分页查询访问密钥（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询访问密钥（无筛选条件）', async () => {
      const query = new PageAccessKeysQuery({
        current: 1,
        size: 10,
      });

      const mockAccessKeys: AccessKeyReadModel[] = [
        {
          id: 'key-1',
          domain: 'example.com',
          AccessKeyID: 'AK-001',
          status: Status.ENABLED,
          description: '测试密钥1',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as AccessKeyReadModel,
        {
          id: 'key-2',
          domain: 'example.com',
          AccessKeyID: 'AK-002',
          status: Status.ENABLED,
          description: '测试密钥2',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as AccessKeyReadModel,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockAccessKeys,
        2,
      ]);

      const result = await repository.pageAccessKeys(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toEqual(mockAccessKeys);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysAccessKey',
        {},
        {
          limit: 10,
          offset: 0,
          fields: [
            'id',
            'domain',
            'AccessKeyID',
            'status',
            'description',
            'createdAt',
            'createdBy',
          ],
        },
      );
    });

    /**
     * 应该成功分页查询访问密钥（按域筛选）
     *
     * 验证当提供域筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询访问密钥（按域筛选）', async () => {
      const query = new PageAccessKeysQuery({
        current: 1,
        size: 10,
        domain: 'example',
      });

      const mockAccessKeys: AccessKeyReadModel[] = [
        {
          id: 'key-1',
          domain: 'example.com',
          AccessKeyID: 'AK-001',
          status: Status.ENABLED,
          description: '测试密钥',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as AccessKeyReadModel,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockAccessKeys,
        1,
      ]);

      const result = await repository.pageAccessKeys(query);

      expect(result.total).toBe(1);
      expect(result.records).toEqual(mockAccessKeys);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysAccessKey',
        { domain: { $like: '%example%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询访问密钥（按状态筛选）
     *
     * 验证当提供状态筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询访问密钥（按状态筛选）', async () => {
      const query = new PageAccessKeysQuery({
        current: 1,
        size: 10,
        status: Status.ENABLED,
      });

      const mockAccessKeys: AccessKeyReadModel[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockAccessKeys,
        0,
      ]);

      const result = await repository.pageAccessKeys(query);

      expect(result.total).toBe(0);
      expect(result.records).toEqual([]);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysAccessKey',
        { status: Status.ENABLED },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询访问密钥（同时按域和状态筛选）
     *
     * 验证当同时提供域和状态筛选条件时，能够正确构建复合查询条件。
     */
    it('应该成功分页查询访问密钥（同时按域和状态筛选）', async () => {
      const query = new PageAccessKeysQuery({
        current: 2,
        size: 5,
        domain: 'test',
        status: Status.DISABLED,
      });

      const mockAccessKeys: AccessKeyReadModel[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockAccessKeys,
        0,
      ]);

      const result = await repository.pageAccessKeys(query);

      expect(result.current).toBe(2);
      expect(result.size).toBe(5);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysAccessKey',
        {
          domain: { $like: '%test%' },
          status: Status.DISABLED,
        },
        expect.objectContaining({
          limit: 5,
          offset: 5, // (2 - 1) * 5
        }),
      );
    });

    /**
     * 应该正确处理分页偏移量计算
     *
     * 验证分页偏移量的计算是否正确，确保不同页码的查询使用正确的 offset。
     */
    it('应该正确处理分页偏移量计算', async () => {
      const query = new PageAccessKeysQuery({
        current: 3,
        size: 20,
      });

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      await repository.pageAccessKeys(query);

      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysAccessKey',
        {},
        expect.objectContaining({
          limit: 20,
          offset: 40, // (3 - 1) * 20
        }),
      );
    });
  });

  describe('getAccessKeyById', () => {
    /**
     * 应该成功根据 ID 获取访问密钥
     *
     * 验证当访问密钥存在时，能够正确返回访问密钥属性。
     */
    it('应该成功根据 ID 获取访问密钥', async () => {
      const accessKeyId = 'key-123';
      const mockAccessKey: AccessKeyProperties = {
        id: accessKeyId,
        domain: 'example.com',
        AccessKeyID: 'AK-123',
        AccessKeySecret: 'secret-123',
        status: Status.ENABLED,
        description: '测试密钥',
        createdAt: new Date(),
        createdBy: 'user-1',
      } as AccessKeyProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockAccessKey);

      const result = await repository.getAccessKeyById(accessKeyId);

      expect(result).toEqual(mockAccessKey);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysAccessKey', {
        id: accessKeyId,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当访问密钥不存在时
     *
     * 验证当访问密钥不存在时，方法返回 null。
     */
    it('应该返回 null 当访问密钥不存在时', async () => {
      const accessKeyId = 'non-existent-key';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getAccessKeyById(accessKeyId);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith('SysAccessKey', {
        id: accessKeyId,
      });
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const accessKeyId = 'key-123';
      const error = new Error('数据库连接失败');

      (entityManager.findOne as jest.Mock).mockRejectedValue(error);

      await expect(repository.getAccessKeyById(accessKeyId)).rejects.toThrow(
        '数据库连接失败',
      );
      expect(entityManager.findOne).toHaveBeenCalledWith('SysAccessKey', {
        id: accessKeyId,
      });
    });
  });

  describe('findAll', () => {
    /**
     * 应该成功查询所有访问密钥
     *
     * 验证能够正确查询并返回所有访问密钥的属性数组。
     */
    it('应该成功查询所有访问密钥', async () => {
      const mockAccessKeys: AccessKeyProperties[] = [
        {
          id: 'key-1',
          domain: 'example.com',
          AccessKeyID: 'AK-001',
          AccessKeySecret: 'secret-1',
          status: Status.ENABLED,
          description: '密钥1',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as AccessKeyProperties,
        {
          id: 'key-2',
          domain: 'test.com',
          AccessKeyID: 'AK-002',
          AccessKeySecret: 'secret-2',
          status: Status.DISABLED,
          description: '密钥2',
          createdAt: new Date(),
          createdBy: 'user-1',
        } as AccessKeyProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockAccessKeys);

      const result = await repository.findAll();

      expect(result).toEqual(mockAccessKeys);
      expect(result).toHaveLength(2);
      expect(entityManager.find).toHaveBeenCalledWith('SysAccessKey', {});
      expect(entityManager.find).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回空数组当没有访问密钥时
     *
     * 验证当数据库中没有访问密钥时，方法返回空数组。
     */
    it('应该返回空数组当没有访问密钥时', async () => {
      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(entityManager.find).toHaveBeenCalledWith('SysAccessKey', {});
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const error = new Error('数据库查询失败');

      (entityManager.find as jest.Mock).mockRejectedValue(error);

      await expect(repository.findAll()).rejects.toThrow('数据库查询失败');
      expect(entityManager.find).toHaveBeenCalledWith('SysAccessKey', {});
    });
  });
});

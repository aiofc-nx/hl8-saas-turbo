import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import type { DomainProperties } from '@/lib/bounded-contexts/iam/domain/domain/domain.read.model';
import { PageDomainsQuery } from '@/lib/bounded-contexts/iam/domain/queries/page-domains.query';
import { Status } from '@/lib/shared/enums/status.enum';

import { PaginationResult } from '@hl8/rest';

import { DomainReadRepository } from './domain.read.pg.repository';

/**
 * DomainReadRepository 单元测试
 *
 * @description
 * 测试域读取仓储的实现，验证根据 ID 查询、分页查询和根据代码查询的功能。
 */
describe('DomainReadRepository', () => {
  let repository: DomainReadRepository;
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
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainReadRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<DomainReadRepository>(DomainReadRepository);
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

  describe('getDomainById', () => {
    /**
     * 应该成功根据 ID 获取域
     *
     * 验证当域存在时，能够正确返回域属性。
     */
    it('应该成功根据 ID 获取域', async () => {
      const domainId = 'domain-123';
      const mockDomain: DomainProperties = {
        id: domainId,
        code: 'example',
        name: '示例域',
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
      } as DomainProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockDomain);

      const result = await repository.getDomainById(domainId);

      expect(result).toEqual(mockDomain);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysDomain', {
        id: domainId,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当域不存在时
     *
     * 验证当域不存在时，方法返回 null。
     */
    it('应该返回 null 当域不存在时', async () => {
      const domainId = 'non-existent-domain';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getDomainById(domainId);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith('SysDomain', {
        id: domainId,
      });
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const domainId = 'domain-123';
      const error = new Error('数据库连接失败');

      (entityManager.findOne as jest.Mock).mockRejectedValue(error);

      await expect(repository.getDomainById(domainId)).rejects.toThrow(
        '数据库连接失败',
      );
    });
  });

  describe('pageDomains', () => {
    /**
     * 应该成功分页查询域（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询域（无筛选条件）', async () => {
      const query = new PageDomainsQuery({
        current: 1,
        size: 10,
      });

      const mockDomains: DomainProperties[] = [
        {
          id: 'domain-1',
          code: 'example',
          name: '示例域',
          status: Status.ENABLED,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as DomainProperties,
        {
          id: 'domain-2',
          code: 'test',
          name: '测试域',
          status: Status.ENABLED,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as DomainProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockDomains,
        2,
      ]);

      const result = await repository.pageDomains(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toEqual(mockDomains);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysDomain',
        {},
        {
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        },
      );
    });

    /**
     * 应该成功分页查询域（按名称筛选）
     *
     * 验证当提供名称筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询域（按名称筛选）', async () => {
      const query = new PageDomainsQuery({
        current: 1,
        size: 10,
        name: '示例',
      });

      const mockDomains: DomainProperties[] = [
        {
          id: 'domain-1',
          code: 'example',
          name: '示例域',
          status: Status.ENABLED,
          createdAt: new Date(),
          createdBy: 'user-1',
        } as DomainProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockDomains,
        1,
      ]);

      const result = await repository.pageDomains(query);

      expect(result.total).toBe(1);
      expect(result.records).toEqual(mockDomains);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysDomain',
        { name: { $like: '%示例%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询域（按状态筛选）
     *
     * 验证当提供状态筛选条件时，能够正确构建查询条件并返回结果。
     */
    it('应该成功分页查询域（按状态筛选）', async () => {
      const query = new PageDomainsQuery({
        current: 1,
        size: 10,
        status: Status.DISABLED,
      });

      const mockDomains: DomainProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockDomains,
        0,
      ]);

      const result = await repository.pageDomains(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysDomain',
        { status: Status.DISABLED },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询域（同时按名称和状态筛选）
     *
     * 验证当同时提供名称和状态筛选条件时，能够正确构建复合查询条件。
     */
    it('应该成功分页查询域（同时按名称和状态筛选）', async () => {
      const query = new PageDomainsQuery({
        current: 2,
        size: 5,
        name: '测试',
        status: Status.ENABLED,
      });

      const mockDomains: DomainProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockDomains,
        0,
      ]);

      const result = await repository.pageDomains(query);

      expect(result.current).toBe(2);
      expect(result.size).toBe(5);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysDomain',
        {
          name: { $like: '%测试%' },
          status: Status.ENABLED,
        },
        expect.objectContaining({
          limit: 5,
          offset: 5, // (2 - 1) * 5
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });
  });

  describe('getDomainByCode', () => {
    /**
     * 应该成功根据代码获取域
     *
     * 验证当域存在时，能够正确返回域属性。
     */
    it('应该成功根据代码获取域', async () => {
      const domainCode = 'example';
      const mockDomain: DomainProperties = {
        id: 'domain-123',
        code: domainCode,
        name: '示例域',
        status: Status.ENABLED,
        createdAt: new Date(),
        createdBy: 'user-1',
      } as DomainProperties;

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockDomain);

      const result = await repository.getDomainByCode(domainCode);

      expect(result).toEqual(mockDomain);
      expect(result?.code).toBe(domainCode);
      expect(entityManager.findOne).toHaveBeenCalledWith('SysDomain', {
        code: domainCode,
      });
      expect(entityManager.findOne).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该返回 null 当域不存在时
     *
     * 验证当域不存在时，方法返回 null。
     */
    it('应该返回 null 当域不存在时', async () => {
      const domainCode = 'non-existent-code';

      (entityManager.findOne as jest.Mock).mockResolvedValue(null);

      const result = await repository.getDomainByCode(domainCode);

      expect(result).toBeNull();
      expect(entityManager.findOne).toHaveBeenCalledWith('SysDomain', {
        code: domainCode,
      });
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当数据库查询抛出异常时，方法能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const domainCode = 'example';
      const error = new Error('数据库连接失败');

      (entityManager.findOne as jest.Mock).mockRejectedValue(error);

      await expect(repository.getDomainByCode(domainCode)).rejects.toThrow(
        '数据库连接失败',
      );
    });
  });
});

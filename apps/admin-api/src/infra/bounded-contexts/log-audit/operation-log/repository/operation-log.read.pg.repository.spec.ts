import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import type { OperationLogProperties } from '@/lib/bounded-contexts/log-audit/operation-log/domain/operation-log.read.model';
import { PageOperationLogsQuery } from '@/lib/bounded-contexts/log-audit/operation-log/queries/page-operation-logs.query';

import { PaginationResult } from '@hl8/rest';

import { OperationLogReadRepository } from './operation-log.read.pg.repository';

/**
 * OperationLogReadRepository 单元测试
 *
 * @description
 * 测试操作日志读取仓储的实现，验证分页查询操作日志的功能。
 */
describe('OperationLogReadRepository', () => {
  let repository: OperationLogReadRepository;
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
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperationLogReadRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<OperationLogReadRepository>(
      OperationLogReadRepository,
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

  describe('pageOperationLogs', () => {
    /**
     * 应该成功分页查询操作日志（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询操作日志（无筛选条件）', async () => {
      const query = new PageOperationLogsQuery({
        current: 1,
        size: 10,
      });

      const mockLogs: OperationLogProperties[] = [
        {
          id: 'log-1',
          username: 'testuser',
          domain: 'example.com',
          moduleName: 'user-management',
          method: 'POST',
          path: '/api/users',
          requestId: 'req-1',
          createdAt: new Date(),
        } as OperationLogProperties,
        {
          id: 'log-2',
          username: 'admin',
          domain: 'example.com',
          moduleName: 'role-management',
          method: 'GET',
          path: '/api/roles',
          requestId: 'req-2',
          createdAt: new Date(),
        } as OperationLogProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLogs,
        2,
      ]);

      const result = await repository.pageOperationLogs(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toEqual(mockLogs);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysOperationLog',
        {},
        {
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        },
      );
    });

    /**
     * 应该成功分页查询操作日志（按用户名筛选）
     *
     * 验证当提供用户名筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询操作日志（按用户名筛选）', async () => {
      const query = new PageOperationLogsQuery({
        current: 1,
        size: 10,
        username: 'test',
      });

      const mockLogs: OperationLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLogs,
        0,
      ]);

      const result = await repository.pageOperationLogs(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysOperationLog',
        { username: { $like: '%test%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询操作日志（按域名筛选）
     *
     * 验证当提供域名筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询操作日志（按域名筛选）', async () => {
      const query = new PageOperationLogsQuery({
        current: 1,
        size: 10,
        domain: 'example.com',
      });

      const mockLogs: OperationLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLogs,
        0,
      ]);

      const result = await repository.pageOperationLogs(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysOperationLog',
        { domain: 'example.com' },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询操作日志（按模块名筛选）
     *
     * 验证当提供模块名筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询操作日志（按模块名筛选）', async () => {
      const query = new PageOperationLogsQuery({
        current: 1,
        size: 10,
        moduleName: 'user',
      });

      const mockLogs: OperationLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLogs,
        0,
      ]);

      const result = await repository.pageOperationLogs(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysOperationLog',
        { moduleName: { $like: '%user%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询操作日志（按方法筛选）
     *
     * 验证当提供 HTTP 方法筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询操作日志（按方法筛选）', async () => {
      const query = new PageOperationLogsQuery({
        current: 1,
        size: 10,
        method: 'POST',
      });

      const mockLogs: OperationLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLogs,
        0,
      ]);

      const result = await repository.pageOperationLogs(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysOperationLog',
        { method: 'POST' },
        expect.objectContaining({
          limit: 10,
          offset: 0,
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });

    /**
     * 应该成功分页查询操作日志（复合筛选条件）
     *
     * 验证当同时提供多个筛选条件时，能够正确构建复合查询条件。
     */
    it('应该成功分页查询操作日志（复合筛选条件）', async () => {
      const query = new PageOperationLogsQuery({
        current: 2,
        size: 5,
        username: 'test',
        domain: 'example.com',
        moduleName: 'user',
        method: 'POST',
      });

      const mockLogs: OperationLogProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockLogs,
        0,
      ]);

      const result = await repository.pageOperationLogs(query);

      expect(result.current).toBe(2);
      expect(result.size).toBe(5);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysOperationLog',
        {
          username: { $like: '%test%' },
          domain: 'example.com',
          moduleName: { $like: '%user%' },
          method: 'POST',
        },
        expect.objectContaining({
          limit: 5,
          offset: 5, // (2 - 1) * 5
          orderBy: [{ createdAt: 'DESC' }],
        }),
      );
    });
  });
});

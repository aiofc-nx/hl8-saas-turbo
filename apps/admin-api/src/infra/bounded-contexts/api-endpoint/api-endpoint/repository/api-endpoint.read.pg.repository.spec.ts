import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';

import type { EndpointProperties } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/domain/endpoint.read.model';
import { PageEndpointsQuery } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/queries/page-endpoints.query';

import { PaginationResult } from '@hl8/rest';

import { ApiEndpointReadRepository } from './api-endpoint.read.pg.repository';

/**
 * ApiEndpointReadRepository 单元测试
 *
 * @description
 * 测试 API 端点读取仓储的实现，验证分页查询、批量查询、查询所有端点和查询需要权限的端点等功能。
 */
describe('ApiEndpointReadRepository', () => {
  let repository: ApiEndpointReadRepository;
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
      find: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiEndpointReadRepository,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    repository = module.get<ApiEndpointReadRepository>(
      ApiEndpointReadRepository,
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

  describe('pageEndpoints', () => {
    /**
     * 应该成功分页查询 API 端点（无筛选条件）
     *
     * 验证当没有筛选条件时，能够正确返回分页结果。
     */
    it('应该成功分页查询 API 端点（无筛选条件）', async () => {
      const query = new PageEndpointsQuery({
        current: 1,
        size: 10,
      });

      const mockEndpoints: EndpointProperties[] = [
        {
          id: 'endpoint-1',
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
          controller: 'UserController',
          summary: '获取用户列表',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
        {
          id: 'endpoint-2',
          path: '/api/roles',
          method: 'POST',
          action: 'create',
          resource: 'role',
          controller: 'RoleController',
          summary: '创建角色',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
      ];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockEndpoints,
        2,
      ]);

      const result = await repository.pageEndpoints(query);

      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.current).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(2);
      expect(result.records).toEqual(mockEndpoints);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysEndpoint',
        {},
        {
          limit: 10,
          offset: 0,
          orderBy: [
            { createdAt: 'ASC' },
            { controller: 'ASC' },
            { path: 'ASC' },
            { method: 'ASC' },
            { action: 'ASC' },
          ],
        },
      );
    });

    /**
     * 应该成功分页查询 API 端点（按路径筛选）
     *
     * 验证当提供路径筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询 API 端点（按路径筛选）', async () => {
      const query = new PageEndpointsQuery({
        current: 1,
        size: 10,
        path: '/api/users',
      });

      const mockEndpoints: EndpointProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockEndpoints,
        0,
      ]);

      const result = await repository.pageEndpoints(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysEndpoint',
        { path: { $like: '%/api/users%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询 API 端点（按方法筛选）
     *
     * 验证当提供 HTTP 方法筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询 API 端点（按方法筛选）', async () => {
      const query = new PageEndpointsQuery({
        current: 1,
        size: 10,
        method: 'GET',
      });

      const mockEndpoints: EndpointProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockEndpoints,
        0,
      ]);

      const result = await repository.pageEndpoints(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysEndpoint',
        { method: 'GET' },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询 API 端点（按操作筛选）
     *
     * 验证当提供操作筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询 API 端点（按操作筛选）', async () => {
      const query = new PageEndpointsQuery({
        current: 1,
        size: 10,
        action: 'read',
      });

      const mockEndpoints: EndpointProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockEndpoints,
        0,
      ]);

      const result = await repository.pageEndpoints(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysEndpoint',
        { action: 'read' },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询 API 端点（按资源筛选）
     *
     * 验证当提供资源筛选条件时，能够正确构建查询条件。
     */
    it('应该成功分页查询 API 端点（按资源筛选）', async () => {
      const query = new PageEndpointsQuery({
        current: 1,
        size: 10,
        resource: 'user',
      });

      const mockEndpoints: EndpointProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockEndpoints,
        0,
      ]);

      const result = await repository.pageEndpoints(query);

      expect(result.total).toBe(0);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysEndpoint',
        { resource: { $like: '%user%' } },
        expect.objectContaining({
          limit: 10,
          offset: 0,
        }),
      );
    });

    /**
     * 应该成功分页查询 API 端点（复合筛选条件）
     *
     * 验证当同时提供多个筛选条件时，能够正确构建复合查询条件。
     */
    it('应该成功分页查询 API 端点（复合筛选条件）', async () => {
      const query = new PageEndpointsQuery({
        current: 2,
        size: 5,
        path: '/api',
        method: 'POST',
        action: 'create',
        resource: 'user',
      });

      const mockEndpoints: EndpointProperties[] = [];

      (entityManager.findAndCount as jest.Mock).mockResolvedValue([
        mockEndpoints,
        0,
      ]);

      const result = await repository.pageEndpoints(query);

      expect(result.current).toBe(2);
      expect(result.size).toBe(5);
      expect(entityManager.findAndCount).toHaveBeenCalledWith(
        'SysEndpoint',
        {
          path: { $like: '%/api%' },
          method: 'POST',
          action: 'create',
          resource: { $like: '%user%' },
        },
        expect.objectContaining({
          limit: 5,
          offset: 5, // (2 - 1) * 5
        }),
      );
    });
  });

  describe('findEndpointsByIds', () => {
    /**
     * 应该成功根据 ID 列表查找 API 端点
     *
     * 验证能够正确返回指定 ID 列表的端点。
     */
    it('应该成功根据 ID 列表查找 API 端点', async () => {
      const endpointIds = ['endpoint-1', 'endpoint-2', 'endpoint-3'];
      const mockEndpoints: EndpointProperties[] = [
        {
          id: 'endpoint-1',
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
          controller: 'UserController',
          summary: '获取用户列表',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
        {
          id: 'endpoint-2',
          path: '/api/roles',
          method: 'POST',
          action: 'create',
          resource: 'role',
          controller: 'RoleController',
          summary: '创建角色',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockEndpoints);

      const result = await repository.findEndpointsByIds(endpointIds);

      expect(result).toEqual(mockEndpoints);
      expect(result.length).toBe(2);
      expect(entityManager.find).toHaveBeenCalledWith('SysEndpoint', {
        id: { $in: endpointIds },
      });
    });

    /**
     * 应该返回空数组当端点不存在时
     *
     * 验证当端点不存在时，方法返回空数组。
     */
    it('应该返回空数组当端点不存在时', async () => {
      const endpointIds = ['non-existent-1', 'non-existent-2'];

      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findEndpointsByIds(endpointIds);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('findAll', () => {
    /**
     * 应该成功查询所有 API 端点
     *
     * 验证能够正确返回所有端点。
     */
    it('应该成功查询所有 API 端点', async () => {
      const mockEndpoints: EndpointProperties[] = [
        {
          id: 'endpoint-1',
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
          controller: 'UserController',
          summary: '获取用户列表',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
        {
          id: 'endpoint-2',
          path: '/api/roles',
          method: 'POST',
          action: 'create',
          resource: 'role',
          controller: 'RoleController',
          summary: '创建角色',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockEndpoints);

      const result = await repository.findAll();

      expect(result).toEqual(mockEndpoints);
      expect(result.length).toBe(2);
      expect(entityManager.find).toHaveBeenCalledWith('SysEndpoint', {});
    });

    /**
     * 应该返回空数组当没有端点时
     *
     * 验证当数据库中没有端点时，方法返回空数组。
     */
    it('应该返回空数组当没有端点时', async () => {
      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('findAllPermissionApi', () => {
    /**
     * 应该成功查询所有需要权限的 API 端点
     *
     * 验证能够正确返回所有 action 和 resource 都不为空字符串的端点。
     */
    it('应该成功查询所有需要权限的 API 端点', async () => {
      const mockEndpoints: EndpointProperties[] = [
        {
          id: 'endpoint-1',
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
          controller: 'UserController',
          summary: '获取用户列表',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
        {
          id: 'endpoint-2',
          path: '/api/roles',
          method: 'POST',
          action: 'create',
          resource: 'role',
          controller: 'RoleController',
          summary: '创建角色',
          createdAt: new Date(),
          updatedAt: null,
        } as EndpointProperties,
      ];

      (entityManager.find as jest.Mock).mockResolvedValue(mockEndpoints);

      const result = await repository.findAllPermissionApi();

      expect(result).toEqual(mockEndpoints);
      expect(result.length).toBe(2);
      expect(entityManager.find).toHaveBeenCalledWith('SysEndpoint', {
        $and: [{ action: { $ne: '' } }, { resource: { $ne: '' } }],
      });
    });

    /**
     * 应该返回空数组当没有需要权限的端点时
     *
     * 验证当没有符合条件的端点时，方法返回空数组。
     */
    it('应该返回空数组当没有需要权限的端点时', async () => {
      (entityManager.find as jest.Mock).mockResolvedValue([]);

      const result = await repository.findAllPermissionApi();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
      expect(entityManager.find).toHaveBeenCalledWith('SysEndpoint', {
        $and: [{ action: { $ne: '' } }, { resource: { $ne: '' } }],
      });
    });
  });
});

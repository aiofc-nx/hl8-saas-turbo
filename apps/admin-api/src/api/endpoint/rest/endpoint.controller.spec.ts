import { QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { CasbinRuleApiEndpointService } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/application/service/casbin-rule-api-endpoint.service';
import {
  EndpointProperties,
  EndpointTreeProperties,
} from '@/lib/bounded-contexts/api-endpoint/api-endpoint/domain/endpoint.read.model';
import { EndpointsQuery } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/queries/endpoints.query';
import { PageEndpointsQuery } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/queries/page-endpoints.query';

import { AuthZGuard } from '@hl8/casbin';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PageEndpointsQueryDto } from '../dto/page-endpoint.dto';
import { EndpointController } from './endpoint.controller';

/**
 * EndpointController 单元测试
 *
 * @description
 * 测试 API 端点控制器的实现，验证分页查询、获取端点树和获取授权端点的功能。
 */
describe('EndpointController', () => {
  let controller: EndpointController;
  let queryBus: jest.Mocked<QueryBus>;
  let casbinRuleApiEndpointService: jest.Mocked<CasbinRuleApiEndpointService>;

  /**
   * 测试前准备
   *
   * 创建测试模块，Mock QueryBus 和 CasbinRuleApiEndpointService 依赖。
   */
  beforeEach(async () => {
    // 创建 Mock QueryBus 和 CasbinRuleApiEndpointService
    const mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const mockCasbinRuleApiEndpointService = {
      authApiEndpoint: jest.fn(),
    } as unknown as jest.Mocked<CasbinRuleApiEndpointService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EndpointController],
      providers: [
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: CasbinRuleApiEndpointService,
          useValue: mockCasbinRuleApiEndpointService,
        },
      ],
    })
      .overrideGuard(AuthZGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

    controller = module.get<EndpointController>(EndpointController);
    queryBus = module.get(QueryBus);
    casbinRuleApiEndpointService = module.get(CasbinRuleApiEndpointService);
  });

  /**
   * 测试后清理
   *
   * 重置所有 Mock 函数。
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('page', () => {
    /**
     * 应该成功分页查询 API 端点列表
     *
     * 验证能够正确执行分页查询并返回结果。
     */
    it('应该成功分页查询 API 端点列表', async () => {
      const queryDto = new PageEndpointsQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;
      queryDto.path = '/api/users';
      queryDto.method = 'GET';
      queryDto.action = 'read';
      queryDto.resource = 'user';

      const mockResult = new PaginationResult<EndpointProperties>(1, 10, 2, [
        {
          id: 'endpoint-1',
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
          controller: 'UserController',
          summary: '获取用户列表',
        } as EndpointProperties,
        {
          id: 'endpoint-2',
          path: '/api/users',
          method: 'POST',
          action: 'write',
          resource: 'user',
          controller: 'UserController',
          summary: '创建用户',
        } as EndpointProperties,
      ]);

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.page(queryDto);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PageEndpointsQuery),
      );
      expect(queryBus.execute).toHaveBeenCalledTimes(1);

      // 验证查询参数
      const query = (queryBus.execute as jest.Mock).mock.calls[0][0];
      expect(query.path).toBe('/api/users');
      expect(query.method).toBe('GET');
      expect(query.action).toBe('read');
      expect(query.resource).toBe('user');
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const queryDto = new PageEndpointsQueryDto();
      queryDto.current = 1;
      queryDto.size = 10;

      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.page(queryDto)).rejects.toThrow('查询失败');
    });
  });

  describe('treeEndpoint', () => {
    /**
     * 应该成功获取 API 端点树
     *
     * 验证能够正确获取所有 API 端点的树形结构。
     */
    it('应该成功获取 API 端点树', async () => {
      const mockResult: EndpointTreeProperties[] = [
        {
          id: 'resource-user',
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
          controller: 'UserController',
          summary: '用户资源',
          children: [
            {
              id: 'endpoint-1',
              path: '/api/users',
              method: 'GET',
              action: 'read',
              resource: 'user',
              controller: 'UserController',
              summary: '获取用户列表',
            } as EndpointTreeProperties,
          ],
        } as EndpointTreeProperties,
      ];

      (queryBus.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.treeEndpoint();

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(EndpointsQuery));
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理查询异常
     *
     * 验证当查询失败时，能够正确传播异常。
     */
    it('应该正确处理查询异常', async () => {
      const error = new Error('查询失败');
      (queryBus.execute as jest.Mock).mockRejectedValue(error);

      await expect(controller.treeEndpoint()).rejects.toThrow('查询失败');
    });
  });

  describe('authApiEndpoint', () => {
    /**
     * 应该成功获取角色的授权 API 端点
     *
     * 验证能够正确获取指定角色在指定域下已授权的 API 端点列表。
     */
    it('应该成功获取角色的授权 API 端点', async () => {
      const roleCode = 'admin';
      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: 'example.com',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const mockResult = [
        {
          id: 'endpoint-1',
          path: '/api/users',
          method: 'GET',
          action: 'read',
          resource: 'user',
          controller: 'UserController',
        },
        {
          id: 'endpoint-2',
          path: '/api/users',
          method: 'POST',
          action: 'write',
          resource: 'user',
          controller: 'UserController',
        },
      ];

      (
        casbinRuleApiEndpointService.authApiEndpoint as jest.Mock
      ).mockResolvedValue(mockResult);

      const result = await controller.authApiEndpoint(roleCode, mockRequest);

      expect(result).toBeInstanceOf(ApiRes);
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockResult);
      expect(casbinRuleApiEndpointService.authApiEndpoint).toHaveBeenCalledWith(
        roleCode,
        'example.com',
      );
      expect(
        casbinRuleApiEndpointService.authApiEndpoint,
      ).toHaveBeenCalledTimes(1);
    });

    /**
     * 应该正确处理服务异常
     *
     * 验证当服务调用失败时，能够正确传播异常。
     */
    it('应该正确处理服务异常', async () => {
      const roleCode = 'admin';
      const mockRequest = {
        user: {
          uid: 'user-123',
          domain: 'example.com',
        } as IAuthentication,
      } as FastifyRequest & { user: IAuthentication };

      const error = new Error('服务调用失败');
      (
        casbinRuleApiEndpointService.authApiEndpoint as jest.Mock
      ).mockRejectedValue(error);

      await expect(
        controller.authApiEndpoint(roleCode, mockRequest),
      ).rejects.toThrow('服务调用失败');
    });
  });
});

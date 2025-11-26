import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as casbin from 'casbin';

import { CacheConstant } from '@hl8/constants';
import { RedisUtility } from '@hl8/redis';
import { IAuthentication } from '@hl8/typings';

import { PERMISSIONS_METADATA } from '../constants/authz.constants';
import { AuthZModuleOptions, Permission } from '../interfaces';
import { AuthZGuard } from './authz.guard';

/**
 * AuthZGuard 单元测试
 *
 * @description 验证授权守卫的功能，包括权限验证、用户认证检查和错误处理
 */
describe('AuthZGuard', () => {
  let guard: AuthZGuard;
  let reflector: Reflector;
  let mockEnforcer: jest.Mocked<casbin.Enforcer>;
  let mockOptions: AuthZModuleOptions;
  let mockExecutionContext: ExecutionContext;
  let mockRedisService: jest.Mocked<{ smembers: jest.Mock }>;

  const mockUser: IAuthentication = {
    uid: 'user-123',
    username: 'testuser',
    domain: 'test-domain',
  };

  beforeEach(() => {
    // 创建模拟的 Reflector
    reflector = new Reflector();

    // 创建模拟的 Casbin Enforcer
    mockEnforcer = {
      enforce: jest.fn(),
    } as unknown as jest.Mocked<casbin.Enforcer>;

    // 创建模拟的 Redis 服务
    mockRedisService = {
      smembers: jest.fn(),
    } as unknown as jest.Mocked<{ smembers: jest.Mock }>;

    // Mock RedisUtility.instance
    jest
      .spyOn(RedisUtility, 'instance', 'get')
      .mockReturnValue(mockRedisService as never);

    // 创建模拟的模块选项
    mockOptions = {
      userFromContext: jest.fn().mockReturnValue(mockUser),
    };

    // 创建模拟的执行上下文
    mockExecutionContext = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: mockUser }),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getType: jest.fn().mockReturnValue('http'),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;

    // 创建守卫实例
    guard = new AuthZGuard(reflector, mockEnforcer, mockOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('应该在无权限要求时返回 true', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith(
        PERMISSIONS_METADATA,
        mockExecutionContext.getHandler(),
      );
    });

    it('应该在用户未认证时抛出 UnauthorizedException', async () => {
      const permissions: Permission[] = [{ resource: 'data1', action: 'read' }];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockOptions.userFromContext = jest.fn().mockReturnValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('应该在用户角色列表为空时返回 false', async () => {
      const permissions: Permission[] = [{ resource: 'data1', action: 'read' }];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockResolvedValue([]);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockRedisService.smembers).toHaveBeenCalledWith(
        `${CacheConstant.AUTH_TOKEN_PREFIX}${mockUser.uid}`,
      );
    });

    it('应该在用户角色列表为 null 时返回 false', async () => {
      const permissions: Permission[] = [{ resource: 'data1', action: 'read' }];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockResolvedValue(null);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('应该在用户拥有所有必需权限时返回 true', async () => {
      const permissions: Permission[] = [
        { resource: 'data1', action: 'read' },
        { resource: 'data2', action: 'write' },
      ];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockResolvedValue(['admin', 'user']);
      mockEnforcer.enforce
        .mockResolvedValueOnce(true) // 第一个权限：admin 有权限
        .mockResolvedValueOnce(true); // 第二个权限：admin 有权限

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockEnforcer.enforce).toHaveBeenCalledTimes(2);
    });

    it('应该在用户缺少任一权限时返回 false', async () => {
      const permissions: Permission[] = [
        { resource: 'data1', action: 'read' },
        { resource: 'data2', action: 'write' },
      ];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockResolvedValue(['user']);
      mockEnforcer.enforce
        .mockResolvedValueOnce(true) // 第一个权限：有权限
        .mockResolvedValueOnce(false); // 第二个权限：无权限

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('应该在 Redis 查询失败时抛出异常', async () => {
      const permissions: Permission[] = [{ resource: 'data1', action: 'read' }];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Redis connection failed',
      );
    });

    it('应该正确调用 userFromContext 函数', async () => {
      const permissions: Permission[] = [{ resource: 'data1', action: 'read' }];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockResolvedValue(['admin']);
      mockEnforcer.enforce.mockResolvedValue(true);

      await guard.canActivate(mockExecutionContext);

      expect(mockOptions.userFromContext).toHaveBeenCalledWith(
        mockExecutionContext,
      );
    });
  });

  describe('hasPermission', () => {
    it('应该在任一角色拥有权限时返回 true', async () => {
      const roles = new Set(['admin', 'user']);
      const permission: Permission = { resource: 'data1', action: 'read' };

      mockEnforcer.enforce
        .mockResolvedValueOnce(false) // user 角色无权限
        .mockResolvedValueOnce(true); // admin 角色有权限

      const result = await guard.hasPermission(
        roles,
        'test-domain',
        permission,
        mockExecutionContext,
        mockEnforcer,
      );

      expect(result).toBe(true);
      expect(mockEnforcer.enforce).toHaveBeenCalledWith(
        'admin',
        'data1',
        'read',
        'test-domain',
      );
    });

    it('应该在所有角色都无权限时返回 false', async () => {
      const roles = new Set(['user', 'guest']);
      const permission: Permission = { resource: 'data1', action: 'read' };

      mockEnforcer.enforce
        .mockResolvedValueOnce(false) // user 角色无权限
        .mockResolvedValueOnce(false); // guest 角色无权限

      const result = await guard.hasPermission(
        roles,
        'test-domain',
        permission,
        mockExecutionContext,
        mockEnforcer,
      );

      expect(result).toBe(false);
      expect(mockEnforcer.enforce).toHaveBeenCalledTimes(2);
    });

    it('应该正确处理空角色集合', async () => {
      const roles = new Set<string>();
      const permission: Permission = { resource: 'data1', action: 'read' };

      const result = await guard.hasPermission(
        roles,
        'test-domain',
        permission,
        mockExecutionContext,
        mockEnforcer,
      );

      expect(result).toBe(false);
      expect(mockEnforcer.enforce).not.toHaveBeenCalled();
    });

    it('应该使用正确的参数调用 enforcer.enforce', async () => {
      const roles = new Set(['admin']);
      const permission: Permission = { resource: 'data1', action: 'write' };

      mockEnforcer.enforce.mockResolvedValue(true);

      await guard.hasPermission(
        roles,
        'custom-domain',
        permission,
        mockExecutionContext,
        mockEnforcer,
      );

      expect(mockEnforcer.enforce).toHaveBeenCalledWith(
        'admin',
        'data1',
        'write',
        'custom-domain',
      );
    });
  });

  describe('asyncSome', () => {
    it('应该在至少一个元素满足条件时返回 true', async () => {
      const array = [1, 2, 3, 4, 5];
      const callback = jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true); // 第三个元素满足条件

      const result = await AuthZGuard.asyncSome(array, callback);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(3); // 在找到 true 后停止
    });

    it('应该在所有元素都不满足条件时返回 false', async () => {
      const array = [1, 2, 3];
      const callback = jest.fn().mockResolvedValue(false);

      const result = await AuthZGuard.asyncSome(array, callback);

      expect(result).toBe(false);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('应该正确处理空数组', async () => {
      const array: number[] = [];
      const callback = jest.fn();

      const result = await AuthZGuard.asyncSome(array, callback);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    it('应该传递正确的参数给回调函数', async () => {
      const array = ['a', 'b', 'c'];
      const callback = jest.fn().mockResolvedValue(false);

      await AuthZGuard.asyncSome(array, callback);

      expect(callback).toHaveBeenCalledWith('a', 0, array);
      expect(callback).toHaveBeenCalledWith('b', 1, array);
      expect(callback).toHaveBeenCalledWith('c', 2, array);
    });

    it('应该在找到第一个满足条件的元素后立即返回', async () => {
      const array = [1, 2, 3, 4, 5];
      const callback = jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true); // 第二个元素满足条件

      await AuthZGuard.asyncSome(array, callback);

      expect(callback).toHaveBeenCalledTimes(2); // 在找到 true 后停止
    });
  });

  describe('asyncEvery', () => {
    it('应该在所有元素都满足条件时返回 true', async () => {
      const array = [1, 2, 3];
      const callback = jest.fn().mockResolvedValue(true);

      const result = await AuthZGuard.asyncEvery(array, callback);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('应该在任一元素不满足条件时返回 false', async () => {
      const array = [1, 2, 3, 4, 5];
      const callback = jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false); // 第三个元素不满足条件

      const result = await AuthZGuard.asyncEvery(array, callback);

      expect(result).toBe(false);
      expect(callback).toHaveBeenCalledTimes(3); // 在找到 false 后停止
    });

    it('应该正确处理空数组', async () => {
      const array: number[] = [];
      const callback = jest.fn();

      const result = await AuthZGuard.asyncEvery(array, callback);

      expect(result).toBe(true); // 空数组的 every 返回 true
      expect(callback).not.toHaveBeenCalled();
    });

    it('应该传递正确的参数给回调函数', async () => {
      const array = ['a', 'b', 'c'];
      const callback = jest.fn().mockResolvedValue(true);

      await AuthZGuard.asyncEvery(array, callback);

      expect(callback).toHaveBeenCalledWith('a', 0, array);
      expect(callback).toHaveBeenCalledWith('b', 1, array);
      expect(callback).toHaveBeenCalledWith('c', 2, array);
    });

    it('应该在找到第一个不满足条件的元素后立即返回', async () => {
      const array = [1, 2, 3, 4, 5];
      const callback = jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false); // 第二个元素不满足条件

      await AuthZGuard.asyncEvery(array, callback);

      expect(callback).toHaveBeenCalledTimes(2); // 在找到 false 后停止
    });
  });

  describe('边界情况', () => {
    it('应该处理多个权限要求', async () => {
      const permissions: Permission[] = [
        { resource: 'data1', action: 'read' },
        { resource: 'data2', action: 'write' },
        { resource: 'data3', action: 'delete' },
      ];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockResolvedValue(['admin']);
      mockEnforcer.enforce
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockEnforcer.enforce).toHaveBeenCalledTimes(3);
    });

    it('应该处理大量角色', async () => {
      const permissions: Permission[] = [{ resource: 'data1', action: 'read' }];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      const manyRoles = Array.from({ length: 100 }, (_, i) => `role-${i}`);
      mockRedisService.smembers.mockResolvedValue(manyRoles);
      mockEnforcer.enforce.mockResolvedValue(false);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockEnforcer.enforce).toHaveBeenCalledTimes(100);
    });

    it('应该处理自定义 action 类型', async () => {
      const permissions: Permission[] = [
        { resource: 'data1', action: 'custom-action' },
      ];
      jest.spyOn(reflector, 'get').mockReturnValue(permissions);
      mockRedisService.smembers.mockResolvedValue(['admin']);
      mockEnforcer.enforce.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockEnforcer.enforce).toHaveBeenCalledWith(
        'admin',
        'data1',
        'custom-action',
        'test-domain',
      );
    });
  });
});

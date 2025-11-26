import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '@hl8/decorators';
import { IAuthentication } from '@hl8/typings';

import { JwtAuthGuard } from './jwt.auth.guard';

/**
 * JwtAuthGuard 单元测试
 *
 * @description 验证 JWT 认证守卫的功能，包括公开路由跳过、认证流程和错误处理
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);

    // 创建模拟的执行上下文
    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
        getResponse: jest.fn().mockReturnValue({}),
        getNext: jest.fn(),
      }),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;
  });

  describe('canActivate', () => {
    it('应该允许访问标记为公开的路由', () => {
      // 模拟 Reflector 返回 true（表示路由是公开的）
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('应该对未标记公开的路由执行认证', () => {
      // 模拟 Reflector 返回 undefined（表示路由不是公开的）
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // 由于 AuthGuard 的 canActivate 需要实际的 JWT 策略，我们在单元测试中只验证逻辑
      // 验证 Reflector 被正确调用，并且会尝试调用父类方法
      // 为了避免实际调用父类（需要 JWT 策略），我们 mock 父类方法
      const superCanActivate = jest.fn().mockReturnValue(true);
      jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockImplementation(superCanActivate as never);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalled();
      // 由于路由不是公开的，应该调用父类的 canActivate
      expect(superCanActivate).toHaveBeenCalledWith(mockExecutionContext);
    });

    it('应该检查方法和类级别的公开标记', () => {
      const mockHandler = {};
      const mockClass = {};

      jest
        .spyOn(mockExecutionContext, 'getHandler')
        .mockReturnValue(mockHandler);
      jest.spyOn(mockExecutionContext, 'getClass').mockReturnValue(mockClass);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
    });
  });

  describe('handleRequest', () => {
    const mockUser: IAuthentication = {
      uid: 'user-123',
      username: 'testuser',
      domain: 'test-domain',
    };

    it('应该在认证成功时返回用户对象', () => {
      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toEqual(mockUser);
    });

    it('应该在认证失败时抛出 UnauthorizedException', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it('应该在存在错误时抛出原始错误', () => {
      const error = new Error('Authentication failed');

      expect(() => {
        guard.handleRequest(error, null, null);
      }).toThrow(error);
    });

    it('应该在存在错误但无用户时优先抛出原始错误', () => {
      const error = new Error('Token expired');
      const mockUser2: IAuthentication = {
        uid: 'user-456',
        username: 'testuser2',
        domain: 'test-domain',
      };

      // 如果有错误，即使有用户也应该抛出错误
      expect(() => {
        guard.handleRequest(error, mockUser2, null);
      }).toThrow(error);
    });

    it('应该处理认证信息对象', () => {
      const info = { message: 'Token invalid' };

      expect(() => {
        guard.handleRequest(null, null, info);
      }).toThrow(UnauthorizedException);
    });
  });
});

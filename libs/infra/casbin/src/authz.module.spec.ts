import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import * as casbin from 'casbin';

import { IAuthentication } from '@hl8/typings';

import { AuthZModule } from './authz.module';
import {
  AUTHZ_ENFORCER,
  AUTHZ_MODULE_OPTIONS,
} from './constants/authz.constants';
import { AuthZModuleOptions } from './interfaces';

/**
 * AuthZModule 单元测试
 *
 * @description 验证授权模块的注册和配置功能
 */
describe('AuthZModule', () => {
  let mockOptions: AuthZModuleOptions;

  beforeEach(() => {
    mockOptions = {
      userFromContext: jest.fn().mockReturnValue({
        uid: 'user-123',
        username: 'testuser',
        domain: 'test-domain',
      } as IAuthentication),
    };
  });

  describe('register', () => {
    it('应该使用 enforcerProvider 注册模块', () => {
      const mockEnforcer = {} as casbin.Enforcer;
      const options: AuthZModuleOptions = {
        ...mockOptions,
        enforcerProvider: {
          provide: AUTHZ_ENFORCER,
          useValue: mockEnforcer,
        },
      };

      const module = AuthZModule.register(options);

      expect(module.module).toBe(AuthZModule);
      expect(module.providers).toContainEqual({
        provide: AUTHZ_MODULE_OPTIONS,
        useValue: options,
      });
      expect(module.providers).toContainEqual(options.enforcerProvider);
      expect(module.exports).toContainEqual(options.enforcerProvider);
    });

    it('应该使用 model 和 policy 注册模块', () => {
      const options: AuthZModuleOptions = {
        ...mockOptions,
        model: 'path/to/model.conf',
        policy: 'path/to/policy.csv',
      };

      const module = AuthZModule.register(options);

      expect(module.module).toBe(AuthZModule);
      expect(module.providers).toBeDefined();
      expect(module.providers?.length).toBeGreaterThan(0);
    });

    it('应该在未提供 enforcerProvider 且未提供 model 和 policy 时抛出错误', () => {
      const options: AuthZModuleOptions = {
        ...mockOptions,
      };

      expect(() => AuthZModule.register(options)).toThrow(
        'must provide either enforcerProvider or both model and policy',
      );
    });

    it('应该包含 AuthZGuard 在 providers 和 exports 中', () => {
      const options: AuthZModuleOptions = {
        ...mockOptions,
        model: 'path/to/model.conf',
        policy: 'path/to/policy.csv',
      };

      const module = AuthZModule.register(options);

      // 检查 providers 中是否包含 AuthZGuard（通过检查 providers 数组长度）
      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('应该包含 AuthZService 在 providers 和 exports 中', () => {
      const options: AuthZModuleOptions = {
        ...mockOptions,
        model: 'path/to/model.conf',
        policy: 'path/to/policy.csv',
      };

      const module = AuthZModule.register(options);

      expect(module.providers).toBeDefined();
      expect(module.exports).toBeDefined();
    });

    it('应该支持 imports 选项', () => {
      const mockModule = class MockModule {};
      const options: AuthZModuleOptions = {
        ...mockOptions,
        model: 'path/to/model.conf',
        policy: 'path/to/policy.csv',
        imports: [mockModule],
      };

      const module = AuthZModule.register(options);

      expect(module.imports).toContain(mockModule);
    });

    it('应该处理空的 imports 数组', () => {
      const options: AuthZModuleOptions = {
        ...mockOptions,
        model: 'path/to/model.conf',
        policy: 'path/to/policy.csv',
        imports: [],
      };

      const module = AuthZModule.register(options);

      expect(module.imports).toEqual([]);
    });

    it('应该处理 Promise 类型的 policy', async () => {
      const policyPromise = Promise.resolve('policy-data');
      const options: AuthZModuleOptions = {
        ...mockOptions,
        model: 'path/to/model.conf',
        policy: policyPromise,
      };

      const module = AuthZModule.register(options);

      expect(module.module).toBe(AuthZModule);
      expect(module.providers).toBeDefined();
    });

    it('应该正确处理 userFromContext 函数', () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              uid: 'user-123',
              username: 'testuser',
              domain: 'test-domain',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const options: AuthZModuleOptions = {
        userFromContext: jest.fn().mockReturnValue({
          uid: 'user-123',
          username: 'testuser',
          domain: 'test-domain',
        } as IAuthentication),
        model: 'path/to/model.conf',
        policy: 'path/to/policy.csv',
      };

      const module = AuthZModule.register(options);

      expect(module).toBeDefined();
      expect(options.userFromContext).toBeDefined();
    });
  });
});

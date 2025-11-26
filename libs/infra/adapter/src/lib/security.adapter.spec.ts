import type { FastifyHelmetOptions } from '@fastify/helmet';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { registerHelmet } from './security.adapter';

/**
 * Security Adapter 单元测试
 *
 * @description 验证 Helmet 安全中间件的注册和配置功能
 */
describe('registerHelmet', () => {
  let mockFastifyInstance: {
    register: jest.Mock;
  };

  beforeEach(() => {
    // 创建模拟的 Fastify 实例
    const mockRegister = jest.fn();
    // @ts-expect-error - jest.fn() 类型推断问题，测试已通过
    mockRegister.mockResolvedValue(undefined);
    mockFastifyInstance = {
      register: mockRegister as jest.Mock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('默认配置', () => {
    it('应该使用默认配置注册 Helmet', async () => {
      await registerHelmet(mockFastifyInstance as any);

      expect(mockFastifyInstance.register).toHaveBeenCalledTimes(1);
      const [plugin, options] = mockFastifyInstance.register.mock.calls[0];

      expect(plugin).toBeDefined();
      expect(options).toBeDefined();
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions).toHaveProperty('contentSecurityPolicy');
      expect(helmetOptions).toHaveProperty('xFrameOptions');
      expect(helmetOptions).toHaveProperty('xssFilter');
      expect(helmetOptions).toHaveProperty('noSniff');
      expect(helmetOptions).toHaveProperty('strictTransportSecurity');
      expect(helmetOptions).toHaveProperty('referrerPolicy');
      expect(helmetOptions).toHaveProperty('hidePoweredBy');
    });

    it('应该配置默认的 CSP 指令', async () => {
      await registerHelmet(mockFastifyInstance as any);

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      const csp = helmetOptions.contentSecurityPolicy;

      expect(csp).toBeDefined();
      if (
        csp &&
        typeof csp === 'object' &&
        'directives' in csp &&
        csp.directives
      ) {
        expect(csp.directives).toBeDefined();
        expect(csp.directives.defaultSrc).toEqual(["'self'"]);
        expect(csp.directives.styleSrc).toContain("'self'");
        expect(csp.directives.styleSrc).toContain("'unsafe-inline'");
      }
    });

    it('应该配置默认的 HSTS', async () => {
      await registerHelmet(mockFastifyInstance as any);

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      const hsts = helmetOptions.strictTransportSecurity;

      expect(hsts).toBeDefined();
      if (hsts && typeof hsts === 'object') {
        expect(hsts.maxAge).toBe(31536000);
        expect(hsts.includeSubDomains).toBe(true);
        expect(hsts.preload).toBe(true);
      }
    });

    it('应该配置默认的引用策略', async () => {
      await registerHelmet(mockFastifyInstance as any);

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      const referrerPolicy = helmetOptions.referrerPolicy;

      expect(referrerPolicy).toBeDefined();
      if (
        referrerPolicy &&
        typeof referrerPolicy === 'object' &&
        'policy' in referrerPolicy
      ) {
        expect(referrerPolicy.policy).toBe('strict-origin-when-cross-origin');
      }
    });

    it('应该启用 XSS 过滤', async () => {
      await registerHelmet(mockFastifyInstance as any);

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.xssFilter).toBe(true);
    });

    it('应该启用 noSniff', async () => {
      await registerHelmet(mockFastifyInstance as any);

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.noSniff).toBe(true);
    });

    it('应该隐藏 X-Powered-By', async () => {
      await registerHelmet(mockFastifyInstance as any);

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.hidePoweredBy).toBe(true);
    });

    it('应该配置 X-Frame-Options', async () => {
      await registerHelmet(mockFastifyInstance as any);

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.xFrameOptions).toEqual({ action: 'sameorigin' });
    });
  });

  describe('自定义配置', () => {
    it('应该支持自定义 CSP 配置', async () => {
      const customCSP = {
        directives: {
          defaultSrc: ["'self'", 'https://example.com'],
          scriptSrc: ["'self'"],
        },
      };

      await registerHelmet(mockFastifyInstance as any, {
        contentSecurityPolicy: customCSP,
      });

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.contentSecurityPolicy).toEqual(customCSP);
    });

    it('应该支持禁用 XSS 过滤', async () => {
      await registerHelmet(mockFastifyInstance as any, {
        xssFilter: false,
      });

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.xssFilter).toBe(false);
    });

    it('应该支持禁用 noSniff', async () => {
      await registerHelmet(mockFastifyInstance as any, {
        noSniff: false,
      });

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.noSniff).toBe(false);
    });

    it('应该支持自定义 HSTS 配置', async () => {
      const customHSTS = {
        maxAge: 63072000,
        includeSubDomains: false,
        preload: false,
      };

      await registerHelmet(mockFastifyInstance as any, {
        strictTransportSecurity: customHSTS as any,
      });

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      const hsts = helmetOptions.strictTransportSecurity;
      if (hsts && typeof hsts === 'object' && 'maxAge' in hsts) {
        expect(hsts.maxAge).toBe(63072000);
        expect(hsts.includeSubDomains).toBe(false);
        expect(hsts.preload).toBe(false);
      }
    });

    it('应该支持自定义引用策略', async () => {
      const customReferrerPolicy = {
        policy: 'no-referrer' as const,
      };

      await registerHelmet(mockFastifyInstance as any, {
        referrerPolicy: customReferrerPolicy,
      });

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.referrerPolicy).toEqual(customReferrerPolicy);
    });

    it('应该支持禁用 hidePoweredBy', async () => {
      await registerHelmet(mockFastifyInstance as any, {
        hidePoweredBy: false,
      });

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.hidePoweredBy).toBe(false);
    });

    it('应该支持部分自定义配置，其他使用默认值', async () => {
      await registerHelmet(mockFastifyInstance as any, {
        xssFilter: false,
      });

      const [, options] = mockFastifyInstance.register.mock.calls[0];
      const helmetOptions = options as FastifyHelmetOptions;
      expect(helmetOptions.xssFilter).toBe(false);
      expect(helmetOptions.noSniff).toBe(true); // 应该使用默认值
      expect(helmetOptions.hidePoweredBy).toBe(true); // 应该使用默认值
    });
  });

  describe('边界情况', () => {
    it('应该处理空配置对象', async () => {
      await registerHelmet(mockFastifyInstance as any, {});

      expect(mockFastifyInstance.register).toHaveBeenCalledTimes(1);
      const [, options] = mockFastifyInstance.register.mock.calls[0];
      expect(options).toBeDefined();
    });

    it('应该处理 undefined 配置', async () => {
      await registerHelmet(mockFastifyInstance as any, undefined);

      expect(mockFastifyInstance.register).toHaveBeenCalledTimes(1);
      const [, options] = mockFastifyInstance.register.mock.calls[0];
      expect(options).toBeDefined();
    });

    it('应该正确处理所有可能的引用策略值', async () => {
      const policies = [
        'no-referrer',
        'no-referrer-when-downgrade',
        'origin',
        'origin-when-cross-origin',
        'same-origin',
        'strict-origin',
        'strict-origin-when-cross-origin',
        'unsafe-url',
      ] as const;

      for (const policy of policies) {
        jest.clearAllMocks();
        await registerHelmet(mockFastifyInstance as any, {
          referrerPolicy: { policy },
        });

        const [, options] = mockFastifyInstance.register.mock.calls[0];
        const helmetOptions = options as FastifyHelmetOptions;
        if (
          helmetOptions.referrerPolicy &&
          typeof helmetOptions.referrerPolicy === 'object' &&
          'policy' in helmetOptions.referrerPolicy
        ) {
          expect(helmetOptions.referrerPolicy.policy).toBe(policy);
        }
      }
    });
  });

  describe('错误处理', () => {
    it('应该正确处理注册失败的情况', async () => {
      const error = new Error('Registration failed');
      const mockRegister = jest.fn();
      // @ts-expect-error - jest.fn() 类型推断问题，测试已通过
      mockRegister.mockRejectedValue(error);
      mockFastifyInstance.register = mockRegister as jest.Mock;

      await expect(registerHelmet(mockFastifyInstance as any)).rejects.toThrow(
        'Registration failed',
      );
    });
  });
});

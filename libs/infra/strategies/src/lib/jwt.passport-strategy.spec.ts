import { beforeEach, describe, expect, it } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

import * as config from '@hl8/config';
import { IAuthentication } from '@hl8/typings';

import { JwtStrategy } from './jwt.passport-strategy';

/**
 * JwtStrategy 单元测试
 *
 * @description 验证 JWT 认证策略的功能，包括载荷验证、类型检查和错误处理
 */
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockSecurityConfig: config.ISecurityConfig;

  beforeEach(() => {
    // 创建模拟的安全配置
    mockSecurityConfig = {
      jwtSecret: 'test-secret-key',
      jwtExpiresIn: 7200,
      casbinModel: 'model.conf',
      refreshJwtSecret: 'refresh-secret-key',
      refreshJwtExpiresIn: 43200,
      signReqTimestampDisparity: 300000,
      signReqNonceTTL: 300,
    };

    // 创建策略实例
    strategy = new JwtStrategy(mockSecurityConfig);
  });

  describe('构造函数', () => {
    it('应该正确初始化策略并注入配置', () => {
      expect(strategy).toBeInstanceOf(JwtStrategy);
      // 验证配置已注入（通过后续的验证测试间接验证）
    });

    it('应该使用配置中的 JWT 密钥', () => {
      // 策略内部使用 securityConfig.jwtSecret，这里通过创建实例验证配置注入成功
      const newStrategy = new JwtStrategy(mockSecurityConfig);
      expect(newStrategy).toBeDefined();
    });
  });

  describe('validate', () => {
    const validPayload: IAuthentication = {
      uid: 'user-123',
      username: 'testuser',
      domain: 'test-domain',
    };

    it('应该验证并返回有效的载荷', async () => {
      const result = await strategy.validate(validPayload);

      expect(result).toEqual(validPayload);
      expect(result.uid).toBe('user-123');
      expect(result.username).toBe('testuser');
      expect(result.domain).toBe('test-domain');
    });

    it('应该对无效的载荷抛出 UnauthorizedException', async () => {
      const invalidPayload = {
        uid: 123, // 应该是字符串
        username: 'testuser',
        domain: 'test-domain',
      };

      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('应该处理 null 载荷', async () => {
      await expect(strategy.validate(null)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('应该处理 undefined 载荷', async () => {
      await expect(strategy.validate(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('应该处理空对象载荷', async () => {
      await expect(strategy.validate({})).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateAuthenticationPayload', () => {
    const validPayload: IAuthentication = {
      uid: 'user-123',
      username: 'testuser',
      domain: 'test-domain',
    };

    it('应该验证并返回有效的认证载荷', async () => {
      const result = await strategy.validateAuthenticationPayload(validPayload);

      expect(result).toEqual(validPayload);
      expect(result).toHaveProperty('uid');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('domain');
    });

    describe('无效的 UID', () => {
      it('应该在 UID 为数字时抛出异常', async () => {
        const invalidPayload = {
          uid: 123,
          username: 'testuser',
          domain: 'test-domain',
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('应该在 UID 缺失时抛出异常', async () => {
        const invalidPayload = {
          username: 'testuser',
          domain: 'test-domain',
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('应该在 UID 为 null 时抛出异常', async () => {
        const invalidPayload = {
          uid: null,
          username: 'testuser',
          domain: 'test-domain',
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('无效的 username', () => {
      it('应该在 username 为数字时抛出异常', async () => {
        const invalidPayload = {
          uid: 'user-123',
          username: 123,
          domain: 'test-domain',
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('应该在 username 缺失时抛出异常', async () => {
        const invalidPayload = {
          uid: 'user-123',
          domain: 'test-domain',
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('应该在 username 为 null 时抛出异常', async () => {
        const invalidPayload = {
          uid: 'user-123',
          username: null,
          domain: 'test-domain',
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('无效的 domain', () => {
      it('应该在 domain 为数字时抛出异常', async () => {
        const invalidPayload = {
          uid: 'user-123',
          username: 'testuser',
          domain: 123,
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('应该在 domain 缺失时抛出异常', async () => {
        const invalidPayload = {
          uid: 'user-123',
          username: 'testuser',
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('应该在 domain 为 null 时抛出异常', async () => {
        const invalidPayload = {
          uid: 'user-123',
          username: 'testuser',
          domain: null,
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('多个字段无效', () => {
      it('应该在多个字段无效时抛出包含所有错误的异常', async () => {
        const invalidPayload = {
          uid: 123,
          username: 456,
          domain: 789,
        };

        await expect(
          strategy.validateAuthenticationPayload(invalidPayload),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('应该提供详细的错误消息', async () => {
        const invalidPayload = {
          uid: 123,
          username: 'testuser',
          domain: 'test-domain',
        };

        try {
          await strategy.validateAuthenticationPayload(invalidPayload);
          fail('应该抛出异常');
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
          expect((error as UnauthorizedException).message).toContain(
            'JWT 载荷验证失败',
          );
        }
      });
    });

    describe('边界情况', () => {
      it('应该处理空字符串值', async () => {
        const payloadWithEmptyStrings = {
          uid: '',
          username: '',
          domain: '',
        };

        // 空字符串在 class-validator 中仍然被认为是字符串类型，所以应该通过验证
        const result = await strategy.validateAuthenticationPayload(
          payloadWithEmptyStrings,
        );

        expect(result.uid).toBe('');
        expect(result.username).toBe('');
        expect(result.domain).toBe('');
      });

      it('应该处理包含特殊字符的值', async () => {
        const payloadWithSpecialChars = {
          uid: 'user-123@example.com',
          username: 'test_user-123',
          domain: 'test.domain.com',
        };

        const result = await strategy.validateAuthenticationPayload(
          payloadWithSpecialChars,
        );

        expect(result.uid).toBe('user-123@example.com');
        expect(result.username).toBe('test_user-123');
        expect(result.domain).toBe('test.domain.com');
      });
    });
  });
});

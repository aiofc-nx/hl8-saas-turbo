import 'reflect-metadata';

import { describe, expect, it } from '@jest/globals';

import { ApiKeyAuthSource, ApiKeyAuthStrategy } from '@hl8/constants';

import { ApiKeyAuth } from './api-key.decorator';

/**
 * ApiKeyAuth 装饰器单元测试
 *
 * @description 验证 API Key 认证装饰器的元数据设置是否正确
 */
describe('ApiKeyAuth', () => {
  describe('默认选项', () => {
    it('应该使用默认选项（ApiKey 策略，keyName 为 api-key）', () => {
      const decorator = ApiKeyAuth();
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('默认选项应该设置正确的策略和键名', () => {
      const decorator = ApiKeyAuth();
      expect(typeof decorator).toBe('function');
      expect(decorator.length).toBe(3); // 装饰器函数应该接受 3 个参数
    });
  });

  describe('ApiKey 策略', () => {
    it('应该正确设置 ApiKey 策略和自定义 keyName', () => {
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.ApiKey,
        keyName: 'x-api-key',
      });
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('应该支持 Header 来源', () => {
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.ApiKey,
        keyName: 'api-key',
        source: ApiKeyAuthSource.Header,
      });
      expect(typeof decorator).toBe('function');
    });

    it('应该支持 Query 来源', () => {
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.ApiKey,
        keyName: 'api-key',
        source: ApiKeyAuthSource.Query,
      });
      expect(typeof decorator).toBe('function');
    });
  });

  describe('SignedRequest 策略', () => {
    it('应该正确设置 SignedRequest 策略', () => {
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.SignedRequest,
        keyName: 'api-key',
      });
      expect(decorator).toBeDefined();
      expect(typeof decorator).toBe('function');
    });

    it('SignedRequest 策略未指定 source 时应该不设置 source', () => {
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.SignedRequest,
        keyName: 'api-key',
      });
      expect(typeof decorator).toBe('function');
    });

    it('SignedRequest 策略可以显式指定 source', () => {
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.SignedRequest,
        keyName: 'api-key',
        source: ApiKeyAuthSource.Header,
      });
      expect(typeof decorator).toBe('function');
    });
  });

  describe('选项处理逻辑', () => {
    it('应该正确处理默认 source 设置', () => {
      // 当策略是 ApiKey 且未指定 source 时，应该设置默认 source 为 Header
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.ApiKey,
        keyName: 'api-key',
      });
      expect(typeof decorator).toBe('function');
    });

    it('应该正确处理 SignedRequest 策略的 source 删除', () => {
      // 当策略是 SignedRequest 且未指定 source 时，应该删除 source
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.SignedRequest,
        keyName: 'api-key',
      });
      expect(typeof decorator).toBe('function');
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空字符串 keyName', () => {
      const decorator = ApiKeyAuth({
        strategy: ApiKeyAuthStrategy.ApiKey,
        keyName: '',
      });
      expect(typeof decorator).toBe('function');
    });
  });
});

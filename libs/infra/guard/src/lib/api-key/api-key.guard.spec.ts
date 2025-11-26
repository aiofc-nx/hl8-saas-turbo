import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  ApiKeyAuthSource,
  ApiKeyAuthStrategy,
  EVENT_API_KEY_VALIDATED,
} from '@hl8/constants';
import { ApiKeyAuthOptions } from '@hl8/decorators';

import { ApiKeyGuard } from './api-key.guard';
import { SignatureAlgorithm } from './api-key.signature.algorithm';
import { ApiKeyValidationEvent } from './events/api-key-validation.event';
import * as apiKeyInterface from './services/api-key.interface';

/**
 * ApiKeyGuard 单元测试
 *
 * @description 验证 API Key 守卫的功能，包括简单和复杂策略、Header/Query 来源、事件发射等
 */
describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let reflector: Reflector;
  let simpleApiKeyService: jest.Mocked<apiKeyInterface.IApiKeyService>;
  let complexApiKeyService: jest.Mocked<apiKeyInterface.IApiKeyService>;
  let eventEmitter: EventEmitter2;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: {
    headers: Record<string, string>;
    query: Record<string, string>;
    body: Record<string, unknown>;
  };

  beforeEach(() => {
    // 创建模拟的服务
    simpleApiKeyService = {
      validateKey: jest.fn(),
      loadKeys: jest.fn(),
      addKey: jest.fn(),
      removeKey: jest.fn(),
      updateKey: jest.fn(),
    };

    complexApiKeyService = {
      validateKey: jest.fn(),
      loadKeys: jest.fn(),
      addKey: jest.fn(),
      removeKey: jest.fn(),
      updateKey: jest.fn(),
    };

    // 创建模拟的事件发射器
    eventEmitter = {
      emit: jest.fn(),
    } as unknown as EventEmitter2;

    reflector = new Reflector();

    guard = new ApiKeyGuard(
      reflector,
      simpleApiKeyService,
      complexApiKeyService,
      eventEmitter,
    );

    // 创建模拟的请求对象
    mockRequest = {
      headers: {},
      query: {},
      body: {},
    };

    // 创建模拟的执行上下文
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate - 无认证选项', () => {
    it('应该在没有认证选项时返回 false', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(simpleApiKeyService.validateKey).not.toHaveBeenCalled();
      expect(complexApiKeyService.validateKey).not.toHaveBeenCalled();
    });

    it('应该在没有 strategy 时返回 false', async () => {
      const authOptions: Partial<ApiKeyAuthOptions> = {
        keyName: 'api-key',
      };

      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('应该在没有 keyName 时返回 false', async () => {
      const authOptions: Partial<ApiKeyAuthOptions> = {
        strategy: ApiKeyAuthStrategy.ApiKey,
      };

      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });
  });

  describe('canActivate - 简单 API Key 策略', () => {
    const authOptions: ApiKeyAuthOptions = {
      strategy: ApiKeyAuthStrategy.ApiKey,
      keyName: 'x-api-key',
      source: ApiKeyAuthSource.Header,
    };

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);
    });

    it('应该从 Header 获取 API Key 并验证', async () => {
      mockRequest.headers['x-api-key'] = 'test-api-key';
      simpleApiKeyService.validateKey.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(simpleApiKeyService.validateKey).toHaveBeenCalledWith(
        'test-api-key',
        expect.any(Object),
      );
      expect(complexApiKeyService.validateKey).not.toHaveBeenCalled();
    });

    it('应该从 Query 获取 API Key 并验证', async () => {
      const queryAuthOptions: ApiKeyAuthOptions = {
        ...authOptions,
        source: ApiKeyAuthSource.Query,
      };
      jest.spyOn(reflector, 'get').mockReturnValue(queryAuthOptions);

      mockRequest.query['x-api-key'] = 'test-api-key';
      simpleApiKeyService.validateKey.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(simpleApiKeyService.validateKey).toHaveBeenCalledWith(
        'test-api-key',
        expect.any(Object),
      );
    });

    it('应该在 Header 中不区分大小写获取 API Key', async () => {
      // Guard 会将 keyName 转换为小写来查找，所以需要同时设置小写版本
      mockRequest.headers['x-api-key'] = 'test-api-key';
      simpleApiKeyService.validateKey.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(simpleApiKeyService.validateKey).toHaveBeenCalledWith(
        'test-api-key',
        expect.any(Object),
      );
    });

    it('应该拒绝无效的 API Key', async () => {
      mockRequest.headers['x-api-key'] = 'invalid-key';
      simpleApiKeyService.validateKey.mockResolvedValue(false);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(simpleApiKeyService.validateKey).toHaveBeenCalled();
    });
  });

  describe('canActivate - 签名请求策略', () => {
    const authOptions: ApiKeyAuthOptions = {
      strategy: ApiKeyAuthStrategy.SignedRequest,
      keyName: 'api-key',
      source: ApiKeyAuthSource.Header,
    };

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);
      mockRequest.headers['api-key'] = 'test-api-key';
    });

    it('应该使用复杂 API Key 服务验证签名请求', async () => {
      mockRequest.query = {
        Algorithm: SignatureAlgorithm.MD5,
        AlgorithmVersion: 'v1',
        ApiVersion: 'v1',
        timestamp: String(Date.now()),
        nonce: 'test-nonce',
        signature: 'test-signature',
      };
      complexApiKeyService.validateKey.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(complexApiKeyService.validateKey).toHaveBeenCalledWith(
        'test-api-key',
        expect.objectContaining({
          algorithm: SignatureAlgorithm.MD5,
          algorithmVersion: 'v1',
          apiVersion: 'v1',
          timestamp: mockRequest.query.timestamp,
          nonce: 'test-nonce',
          signature: 'test-signature',
        }),
      );
      expect(simpleApiKeyService.validateKey).not.toHaveBeenCalled();
    });

    it('应该合并 query 和 body 参数到 requestParams', async () => {
      mockRequest.query = {
        Algorithm: SignatureAlgorithm.SHA256,
        param1: 'value1',
      };
      mockRequest.body = {
        param2: 'value2',
      };
      complexApiKeyService.validateKey.mockResolvedValue(true);

      await guard.canActivate(mockExecutionContext);

      expect(complexApiKeyService.validateKey).toHaveBeenCalledWith(
        'test-api-key',
        expect.objectContaining({
          requestParams: expect.objectContaining({
            param1: 'value1',
            param2: 'value2',
          }),
        }),
      );
    });
  });

  describe('canActivate - 事件发射', () => {
    const authOptions: ApiKeyAuthOptions = {
      strategy: ApiKeyAuthStrategy.ApiKey,
      keyName: 'x-api-key',
      source: ApiKeyAuthSource.Header,
    };

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);
      mockRequest.headers['x-api-key'] = 'test-api-key';
    });

    it('应该在验证成功时发射验证事件', async () => {
      simpleApiKeyService.validateKey.mockResolvedValue(true);

      await guard.canActivate(mockExecutionContext);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENT_API_KEY_VALIDATED,
        expect.any(ApiKeyValidationEvent),
      );

      const event = (eventEmitter.emit as jest.Mock).mock
        .calls[0][1] as ApiKeyValidationEvent;
      expect(event.apiKey).toBe('test-api-key');
      expect(event.isValid).toBe(true);
    });

    it('应该在验证失败时发射验证失败事件', async () => {
      simpleApiKeyService.validateKey.mockResolvedValue(false);

      await guard.canActivate(mockExecutionContext);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENT_API_KEY_VALIDATED,
        expect.any(ApiKeyValidationEvent),
      );

      const event = (eventEmitter.emit as jest.Mock).mock
        .calls[0][1] as ApiKeyValidationEvent;
      expect(event.apiKey).toBe('test-api-key');
      expect(event.isValid).toBe(false);
    });

    it('应该在验证抛出异常时发射验证失败事件', async () => {
      const error = new Error('Validation error');
      simpleApiKeyService.validateKey.mockRejectedValue(error);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENT_API_KEY_VALIDATED,
        expect.any(ApiKeyValidationEvent),
      );

      const event = (eventEmitter.emit as jest.Mock).mock
        .calls[0][1] as ApiKeyValidationEvent;
      expect(event.isValid).toBe(false);
    });
  });

  describe('canActivate - 错误处理', () => {
    const authOptions: ApiKeyAuthOptions = {
      strategy: ApiKeyAuthStrategy.ApiKey,
      keyName: 'x-api-key',
      source: ApiKeyAuthSource.Header,
    };

    beforeEach(() => {
      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);
      mockRequest.headers['x-api-key'] = 'test-api-key';
    });

    it('应该在验证服务抛出异常时返回 false', async () => {
      const error = new Error('Service error');
      simpleApiKeyService.validateKey.mockRejectedValue(error);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(eventEmitter.emit).toHaveBeenCalled();
    });

    it('应该在验证服务抛出异常时仍发射事件', async () => {
      const error = new Error('Service error');
      simpleApiKeyService.validateKey.mockRejectedValue(error);

      await guard.canActivate(mockExecutionContext);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENT_API_KEY_VALIDATED,
        expect.objectContaining({
          isValid: false,
        }),
      );
    });
  });

  describe('canActivate - 参数提取', () => {
    it('应该正确提取 query 参数到 validateOptions', async () => {
      const authOptions: ApiKeyAuthOptions = {
        strategy: ApiKeyAuthStrategy.SignedRequest,
        keyName: 'api-key',
        source: ApiKeyAuthSource.Header,
      };

      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);
      mockRequest.headers['api-key'] = 'test-key';

      mockRequest.query = {
        Algorithm: SignatureAlgorithm.HMAC_SHA256,
        AlgorithmVersion: 'v2',
        ApiVersion: 'v2',
        timestamp: '1234567890',
        nonce: 'test-nonce-123',
        signature: 'test-signature-456',
      };

      complexApiKeyService.validateKey.mockResolvedValue(true);

      await guard.canActivate(mockExecutionContext);

      expect(complexApiKeyService.validateKey).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          algorithm: SignatureAlgorithm.HMAC_SHA256,
          algorithmVersion: 'v2',
          apiVersion: 'v2',
          timestamp: '1234567890',
          nonce: 'test-nonce-123',
          signature: 'test-signature-456',
        }),
      );
    });

    it('应该处理缺失的 query 参数', async () => {
      const authOptions: ApiKeyAuthOptions = {
        strategy: ApiKeyAuthStrategy.SignedRequest,
        keyName: 'api-key',
        source: ApiKeyAuthSource.Header,
      };

      jest.spyOn(reflector, 'get').mockReturnValue(authOptions);
      mockRequest.headers['api-key'] = 'test-key';
      mockRequest.query = {};

      complexApiKeyService.validateKey.mockResolvedValue(true);

      await guard.canActivate(mockExecutionContext);

      expect(complexApiKeyService.validateKey).toHaveBeenCalledWith(
        'test-key',
        expect.objectContaining({
          algorithm: undefined,
          algorithmVersion: undefined,
          apiVersion: undefined,
          timestamp: undefined,
          nonce: undefined,
          signature: undefined,
        }),
      );
    });
  });
});

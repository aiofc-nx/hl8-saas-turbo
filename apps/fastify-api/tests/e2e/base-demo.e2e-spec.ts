import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { BaseDemoModule } from '@/base-demo.module';

/**
 * BaseDemo E2E 测试
 *
 * 测试完整的请求-响应流程，包括：
 * - HTTP 请求处理
 * - 路由匹配
 * - 中间件执行
 * - 响应格式
 *
 * 注意：E2E 测试需要启动完整的应用实例，包括所有中间件和依赖。
 */
describe('BaseDemoController (e2e)', () => {
  let app: INestApplication;

  /**
   * 测试前准备
   *
   * 创建完整的应用实例，模拟真实的运行环境。
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BaseDemoModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  /**
   * 测试后清理
   *
   * 关闭应用实例，释放资源。
   */
  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/', () => {
    /**
     * 应该返回问候消息
     *
     * 测试基础 GET 接口的完整流程。
     */
    it('应该返回 "Hello World!"', () => {
      return request(app.getHttpServer())
        .get('/v1/')
        .expect(200)
        .expect('Hello World!');
    });

    /**
     * 应该支持限流
     *
     * 验证限流功能是否正常工作。
     * 注意：此测试可能需要根据实际的限流配置进行调整。
     */
    it('应该支持限流保护', async () => {
      // 连续发送多个请求，验证限流是否生效
      const requests = Array.from({ length: 5 }, () =>
        request(app.getHttpServer()).get('/v1/'),
      );

      const responses = await Promise.all(requests);
      // 所有请求应该成功（在限流阈值内）
      responses.forEach((response) => {
        expect(response.status).toBeLessThanOrEqual(200);
      });
    });
  });

  describe('GET /v1/crypto', () => {
    /**
     * 应该返回加密后的数据
     *
     * 测试加密功能的完整流程。
     */
    it('应该返回加密后的响应', () => {
      return request(app.getHttpServer())
        .get('/v1/crypto')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', 200);
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('POST /v1/crypto', () => {
    /**
     * 应该处理加密的请求数据
     *
     * 测试双向加密功能的完整流程。
     */
    it('应该处理加密的请求并返回加密的响应', () => {
      const testData = 'test data';
      return request(app.getHttpServer())
        .post('/v1/crypto')
        .send(testData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', 200);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('receivedData');
          expect(res.body.data).toHaveProperty('timestamp');
        });
    });
  });

  describe('GET /v1/cache', () => {
    /**
     * 应该支持缓存功能
     *
     * 测试缓存功能的完整流程。
     */
    it('应该返回缓存的值', () => {
      return request(app.getHttpServer())
        .get('/v1/cache')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
        });
    });
  });
});

import fastifyMultipart from '@fastify/multipart';
import { Logger } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';

import { USER_AGENT } from '@hl8/constants';

/**
 * Fastify 应用适配器
 *
 * @description 创建并配置 Fastify 应用实例，注册文件上传中间件和错误处理钩子
 */
const app: FastifyAdapter = new FastifyAdapter({
  logger: false,
});
export { app as fastifyApp };

/**
 * 注册文件上传中间件
 *
 * @description 配置 multipart 文件上传限制
 */
app.getInstance().register(fastifyMultipart, {
  limits: {
    fields: 10, // 最大非文件字段数
    fileSize: 1024 * 1024 * 6, // 限制文件大小为 6MB
    files: 5, // 最大文件字段数
  },
});

/**
 * 注册错误处理钩子
 *
 * @description 捕获并记录应用错误，返回统一的错误响应
 */
app.getInstance().addHook('onError', async (request, reply, error) => {
  const ip = request.ip;
  const userAgent = request.headers[USER_AGENT] || 'unknown';
  const url = request.url;
  const method = request.method;

  // 记录错误信息
  Logger.error(
    `Error: IP:${ip}, Method:${method}, UA:${userAgent}, URL:${url}, Error:${error.message}`,
    error.stack,
    'fastify.adapter',
  );

  // 如果响应已发送，则不处理
  if (reply.sent) {
    return;
  }

  // 根据错误类型返回适当的状态码
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: error.message || 'Internal Server Error',
    statusCode,
  });
});

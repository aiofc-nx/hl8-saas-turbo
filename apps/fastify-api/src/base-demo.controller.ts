import { createHash } from 'crypto';
import * as fs from 'fs/promises';

import { Cache, CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest } from 'fastify';

import { Crypto, CryptoDirection, CryptoMethod } from '@hl8/crypto';
import { ApiResponseDoc, Public } from '@hl8/decorators';
import { ApiRes } from '@hl8/rest';

import { BaseDemoService } from './base-demo.service';

/**
 * 基础演示控制器
 *
 * 提供一系列演示接口，用于展示应用的基础功能：
 * - 基础问候接口
 * - 加密/解密功能演示
 * - 文件上传功能演示
 * - 缓存功能演示
 *
 * 所有接口均标记为公开访问（@Public），实际业务中应根据需要添加认证和授权。
 *
 * @example
 * ```typescript
 * // GET /v1/ - 获取问候消息
 * // GET /v1/crypto - 获取加密后的问候消息
 * // POST /v1/crypto - 发送加密数据并接收解密后的响应
 * // POST /v1/upload - 上传文件
 * // GET /v1/cache - 测试缓存功能
 * ```
 */
@Controller()
export class BaseDemoController {
  /**
   * 构造函数
   *
   * @param {BaseDemoService} baseDemoService - 基础演示服务实例
   * @param {Cache} cacheManager - 缓存管理器实例，用于缓存操作
   */
  constructor(
    private readonly baseDemoService: BaseDemoService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * 获取问候消息
   *
   * 返回一个简单的问候字符串。此接口配置了限流策略：
   * - 限制：每分钟最多 3 次请求
   * - 时间窗口：60 秒
   *
   * @returns {string} 问候消息字符串
   *
   * @example
   * ```typescript
   * // GET /v1/
   * // 响应: "Hello World!"
   * ```
   */
  @Get()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Public()
  getHello(): string {
    return this.baseDemoService.getHello();
  }

  /**
   * 获取加密后的问候消息
   *
   * 返回经过 AES 加密的问候消息。响应数据会自动加密。
   *
   * @returns {ApiRes<string>} 包含加密后问候消息的响应对象
   *
   * @example
   * ```typescript
   * // GET /v1/crypto
   * // 响应: { code: 200, data: "<加密后的字符串>", message: "success" }
   * ```
   */
  @Get('/crypto')
  @Public()
  @Crypto(CryptoMethod.AES, CryptoDirection.ENCRYPT)
  getCrypto(): ApiRes<string> {
    return ApiRes.success(this.baseDemoService.getHello());
  }

  /**
   * 处理加密数据的 POST 请求
   *
   * 接收加密的请求数据，自动解密后处理，并返回加密的响应数据。
   * 使用 @Crypto 装饰器实现双向加密（请求解密 + 响应加密）。
   *
   * @param {string} data - 加密后的请求数据（会自动解密）
   * @returns {ApiRes<any>} 包含接收到的数据和时间戳的响应对象（会自动加密）
   *
   * @example
   * ```typescript
   * // POST /v1/crypto
   * // 请求体: "<加密后的字符串>"
   * // 响应: { code: 200, data: { receivedData: "<解密后的数据>", timestamp: "2024-01-01T00:00:00.000Z" }, message: "success" }
   * ```
   */
  @Post('/crypto')
  @Public()
  @Crypto(CryptoMethod.AES, CryptoDirection.BOTH)
  postCrypto(@Body() data: string): ApiRes<any> {
    // 由于使用了 @Crypto 装饰器，data 已经被自动解密
    return ApiRes.success({
      receivedData: data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 文件上传接口
   *
   * 支持多文件上传和表单字段提交。使用 fastify/multipart 处理 multipart/form-data 请求。
   *
   * 文件处理流程：
   * 1. 解析 multipart 请求，分离表单字段和文件
   * 2. 为每个文件生成唯一文件名（MD5 + 时间戳 + 随机字符串）
   * 3. 按日期组织文件存储目录（.file/pic/application/YYYYMMDD/）
   * 4. 将文件保存到本地文件系统
   * 5. 返回上传成功的文件路径列表和表单字段
   *
   * 注意事项：
   * - fastify 有多种文件上传中间件，但都不够完善
   * - 此处使用最简单的 fastify/multipart 实现
   * - 具体业务逻辑需要根据实际需求进行扩展
   * - 生产环境建议使用对象存储服务（如 AWS S3）替代本地存储
   *
   * @param {FastifyRequest} req - Fastify 请求对象，包含 multipart 数据
   * @returns {Promise<ApiRes<{ files: string[], fields: Record<string, string> }>>} 包含上传文件路径和表单字段的响应对象
   *
   * @throws {Error} 如果文件上传过程中发生错误，将抛出异常
   *
   * @see {@link https://github.com/fastify/fastify-multipart fastify-multipart 文档}
   *
   * @example
   * ```typescript
   * // POST /v1/upload
   * // Content-Type: multipart/form-data
   * // FormData: { file1: File, file2: File, field1: "value1" }
   * // 响应: { code: 200, data: { files: [".file/pic/application/20240101/xxx.jpg"], fields: { field1: "value1" } }, message: "success" }
   * ```
   */
  @Post('upload')
  @Public()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '文件上传' })
  @ApiResponseDoc({ type: String, isArray: true })
  async uploadFiles(@Req() req: FastifyRequest) {
    // fastify-multipart 扩展了 FastifyRequest，添加了 parts() 方法
    // 类型定义可能不完整，需要类型断言
    type FastifyRequestWithMultipart = FastifyRequest & {
      parts: () => AsyncIterableIterator<
        | { type: 'field'; fieldname: string; value: string }
        | { type: 'file'; filename: string; toBuffer: () => Promise<Buffer> }
      >;
    };

    const parts = (req as unknown as FastifyRequestWithMultipart).parts();
    const formFields: Record<string, string> = {};
    const uploadPromises: Array<Promise<{ path: string }>> = [];

    // 按日期组织文件存储目录，格式：.file/pic/application/YYYYMMDD/
    const today = new Date();
    const date = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const baseDir = '.file';
    const targetDir = `${baseDir}/pic/application/${date}`;
    // 确保目标目录存在
    await fs.mkdir(targetDir, { recursive: true });

    // 遍历 multipart 请求的所有部分（字段和文件）
    for await (const part of parts) {
      // 处理表单字段
      if ('type' in part && part.type === 'field') {
        const fieldValue = part.value;
        if (typeof fieldValue === 'string') {
          formFields[part.fieldname] = fieldValue;
        }
        continue;
      }

      // 处理文件
      if (!('filename' in part) || !part.filename) {
        continue;
      }

      // 读取文件内容到 Buffer
      const fileBuffer = await part.toBuffer();

      // 生成文件唯一标识：MD5 哈希值
      const md5 = createHash('md5')
        .update(new Uint8Array(fileBuffer))
        .digest('hex');

      // 提取文件扩展名
      const extension = part.filename.split('.').pop() || 'bin';

      // 生成唯一文件名：MD5-时间戳-随机字符串.扩展名
      const timestamp = new Date().getTime();
      const random = Math.random().toString(36).substring(2, 15);
      const fileName = `${md5}-${timestamp}-${random}.${extension}`;
      const filePath = `${targetDir}/${fileName}`;
      const relativePath = filePath;

      // 异步保存文件
      uploadPromises.push(
        fs.writeFile(filePath, fileBuffer).then(() => ({ path: relativePath })),
      );
    }

    // 等待所有文件上传完成
    const results = await Promise.all(uploadPromises);

    // 如果没有上传任何文件，返回错误
    if (results.length === 0) {
      return ApiRes.error(400, 'No files uploaded.');
    }

    // 记录表单字段（生产环境应使用日志系统而非 console.log）
    console.log('Form fields:', formFields);

    // 提取所有文件路径
    const paths = results.map((result) => result.path);
    return ApiRes.success({
      files: paths,
      fields: formFields,
    });
  }

  /**
   * 缓存功能测试接口
   *
   * 演示缓存的基本使用：设置缓存值和获取缓存值。
   * 此接口使用了 CacheInterceptor，响应会被自动缓存。
   *
   * @returns {Promise<string | undefined>} 缓存的值，如果不存在则返回 undefined
   *
   * @example
   * ```typescript
   * // GET /v1/cache
   * // 第一次请求：设置缓存并返回 "hello cache"
   * // 后续请求（在缓存有效期内）：直接返回缓存的 "hello cache"
   * ```
   */
  @Get('cache')
  @UseInterceptors(CacheInterceptor)
  @Public()
  @ApiOperation({ summary: '缓存测试' })
  @ApiResponseDoc({ type: String })
  async cache() {
    // 设置缓存值
    await this.cacheManager.set('key', 'hello cache');
    // 获取缓存值
    return this.cacheManager.get('key');
  }
}

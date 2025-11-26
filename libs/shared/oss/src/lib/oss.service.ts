import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import OSS from 'ali-oss';

import { OssConfigService } from './oss.config.service';

/**
 * OSS 服务
 *
 * @description 提供阿里云 OSS 对象存储服务的封装，支持多实例配置、文件上传、下载、删除等操作
 * 使用客户端缓存机制，避免重复创建 OSS 客户端实例
 *
 * @example
 * ```typescript
 * // 在控制器或服务中注入使用
 * constructor(private readonly ossService: OssService) {}
 *
 * // 上传文件
 * const result = await this.ossService.uploadFile('default', fileBuffer, 'path/to/file.jpg');
 * console.log(result.url); // 输出文件访问 URL
 *
 * // 获取文件 URL
 * const url = await this.ossService.getFileUrl('default', 'path/to/file.jpg');
 *
 * // 删除文件
 * await this.ossService.deleteFile('default', 'path/to/file.jpg');
 * ```
 *
 * @note 此服务使用 Map 缓存多个 OSS 客户端实例，支持多配置场景
 * @note 在模块销毁时会自动清理所有客户端缓存
 */
@Injectable()
export class OssService implements OnModuleDestroy {
  /** OSS 客户端缓存，键为配置键，值为 OSS 客户端实例 */
  private readonly ossClients: Map<string, OSS> = new Map();

  /**
   * 构造函数
   *
   * @param ossConfigService - OSS 配置服务
   */
  constructor(private readonly ossConfigService: OssConfigService) {}

  /**
   * 获取 OSS 客户端实例
   *
   * @description 根据配置键获取对应的 OSS 客户端实例，如果不存在则创建并缓存
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @returns Promise<OSS> 返回 OSS 客户端实例
   *
   * @throws {Error} 如果客户端获取失败，抛出错误
   *
   * @internal 此方法为私有方法，仅供内部使用
   */
  private async getClient(key: string): Promise<OSS> {
    if (!this.ossClients.has(key)) {
      const config = this.ossConfigService.getOssConfig(key);
      const client = new OSS(config);
      this.ossClients.set(key, client);
      Logger.log(`已创建 OSS 客户端实例，配置键: ${key}`, 'OssService');
      return client;
    }
    const client = this.ossClients.get(key);
    if (!client) {
      throw new Error(`未找到键为 '${key}' 的 OSS 客户端`);
    }
    return client;
  }

  /**
   * 上传文件
   *
   * @description 将文件上传到 OSS 存储桶
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @param file - 文件内容（Buffer）
   * @param name - 文件在 OSS 中的路径/名称
   * @param options - 上传选项（可选）
   * @param options.contentType - 文件 MIME 类型
   * @param options.meta - 文件元数据
   * @param options.headers - 自定义请求头
   * @returns Promise<OSS.PutObjectResult> 返回上传结果，包含 URL、ETag 等信息
   *
   * @throws {Error} 如果上传失败，抛出错误
   *
   * @example
   * ```typescript
   * const fileBuffer = Buffer.from('file content');
   * const result = await this.ossService.uploadFile(
   *   'default',
   *   fileBuffer,
   *   'images/photo.jpg',
   *   { contentType: 'image/jpeg' }
   * );
   * console.log(result.url); // 输出: https://bucket.oss-cn-beijing.aliyuncs.com/images/photo.jpg
   * ```
   */
  async uploadFile(
    key: string,
    file: Buffer,
    name: string,
    options?: {
      contentType?: string;
      meta?: Record<string, string>;
      headers?: Record<string, string>;
    },
  ): Promise<OSS.PutObjectResult> {
    // 输入验证
    if (!file || file.length === 0) {
      throw new Error('文件内容不能为空');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('文件名不能为空');
    }
    if (name.startsWith('/')) {
      throw new Error('文件名不能以 "/" 开头');
    }

    const client = await this.getClient(key);
    const putOptions: OSS.PutObjectOptions = {};
    if (options?.contentType) {
      putOptions.mime = options.contentType;
    }
    if (options?.meta) {
      putOptions.meta = options.meta;
    }
    if (options?.headers) {
      putOptions.headers = options.headers;
    }

    return client.put(name, file, putOptions);
  }

  /**
   * 获取文件访问 URL
   *
   * @description 生成文件的访问 URL，可以是公开访问或签名 URL
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @param name - 文件在 OSS 中的路径/名称
   * @param options - URL 生成选项（可选）
   * @param options.expires - 签名 URL 过期时间（秒），默认 3600
   * @param options.method - HTTP 方法，默认 'GET'
   * @returns Promise<string> 返回文件访问 URL
   *
   * @throws {Error} 如果生成失败，抛出错误
   *
   * @example
   * ```typescript
   * // 生成公开访问 URL
   * const url = await this.ossService.getFileUrl('default', 'images/photo.jpg');
   *
   * // 生成签名 URL（1 小时有效）
   * const signedUrl = await this.ossService.getFileUrl(
   *   'default',
   *   'images/photo.jpg',
   *   { expires: 3600 }
   * );
   * ```
   */
  async getFileUrl(
    key: string,
    name: string,
    options?: {
      expires?: number;
      method?: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD';
    },
  ): Promise<string> {
    // 输入验证
    if (!name || name.trim().length === 0) {
      throw new Error('文件名不能为空');
    }

    const client = await this.getClient(key);
    if (options?.expires) {
      return client.signatureUrl(name, {
        expires: options.expires,
        method: options.method || 'GET',
      });
    }
    return client.generateObjectUrl(name);
  }

  /**
   * 删除文件
   *
   * @description 从 OSS 存储桶中删除指定文件
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @param name - 文件在 OSS 中的路径/名称
   * @returns Promise<OSS.NormalSuccessResponse> 返回删除结果
   *
   * @throws {Error} 如果删除失败，抛出错误
   *
   * @example
   * ```typescript
   * await this.ossService.deleteFile('default', 'images/photo.jpg');
   * ```
   */
  async deleteFile(
    key: string,
    name: string,
  ): Promise<OSS.NormalSuccessResponse> {
    // 输入验证
    if (!name || name.trim().length === 0) {
      throw new Error('文件名不能为空');
    }

    const client = await this.getClient(key);
    return client.delete(name);
  }

  /**
   * 检查文件是否存在
   *
   * @description 检查指定文件是否存在于 OSS 存储桶中
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @param name - 文件在 OSS 中的路径/名称
   * @returns Promise<boolean> 返回文件是否存在
   *
   * @throws {Error} 如果检查失败，抛出错误
   *
   * @example
   * ```typescript
   * const exists = await this.ossService.checkFileExists('default', 'images/photo.jpg');
   * if (exists) {
   *   console.log('文件存在');
   * }
   * ```
   */
  async checkFileExists(key: string, name: string): Promise<boolean> {
    // 输入验证
    if (!name || name.trim().length === 0) {
      throw new Error('文件名不能为空');
    }

    try {
      const client = await this.getClient(key);
      await client.head(name);
      return true;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 获取文件信息
   *
   * @description 获取文件的详细信息，包括大小、类型、修改时间等
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @param name - 文件在 OSS 中的路径/名称
   * @returns Promise<OSS.HeadObjectResult> 返回文件信息
   *
   * @throws {Error} 如果文件不存在或获取失败，抛出错误
   *
   * @example
   * ```typescript
   * const info = await this.ossService.getFileInfo('default', 'images/photo.jpg');
   * console.log(info.size); // 文件大小（字节）
   * console.log(info.meta); // 文件元数据
   * ```
   */
  async getFileInfo(key: string, name: string): Promise<OSS.HeadObjectResult> {
    // 输入验证
    if (!name || name.trim().length === 0) {
      throw new Error('文件名不能为空');
    }

    const client = await this.getClient(key);
    return client.head(name);
  }

  /**
   * 列出文件
   *
   * @description 列出指定前缀的所有文件
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @param prefix - 文件路径前缀（可选），默认为空（列出所有文件）
   * @param options - 列表选项（可选）
   * @param options.maxKeys - 最大返回数量，默认 100
   * @param options.marker - 分页标记
   * @returns Promise<OSS.ListObjectResult> 返回文件列表
   *
   * @throws {Error} 如果列出失败，抛出错误
   *
   * @example
   * ```typescript
   * // 列出所有文件
   * const result = await this.ossService.listFiles('default');
   *
   * // 列出指定前缀的文件
   * const result = await this.ossService.listFiles('default', 'images/', {
   *   maxKeys: 50
   * });
   * ```
   */
  async listFiles(
    key: string,
    prefix?: string,
    options?: {
      maxKeys?: number;
      marker?: string;
    },
  ): Promise<OSS.ListObjectResult> {
    const client = await this.getClient(key);
    const listOptions: OSS.ListObjectsQuery = {};
    if (prefix) {
      listOptions.prefix = prefix;
    }
    if (options?.maxKeys) {
      listOptions['max-keys'] = options.maxKeys;
    }
    if (options?.marker) {
      listOptions.marker = options.marker;
    }
    return client.list(listOptions);
  }

  /**
   * 生成预签名 URL
   *
   * @description 生成带签名的临时访问 URL，用于临时访问私有文件
   *
   * @param key - 配置键，对应配置文件中的 `oss.${key}` 路径
   * @param name - 文件在 OSS 中的路径/名称
   * @param expires - 过期时间（秒），默认 3600（1 小时）
   * @param method - HTTP 方法，默认 'GET'
   * @returns Promise<string> 返回预签名 URL
   *
   * @throws {Error} 如果生成失败，抛出错误
   *
   * @example
   * ```typescript
   * // 生成 1 小时有效的 GET 请求 URL
   * const url = await this.ossService.generatePresignedUrl(
   *   'default',
   *   'private/file.jpg',
   *   3600
   * );
   *
   * // 生成 30 分钟有效的 PUT 请求 URL（用于上传）
   * const uploadUrl = await this.ossService.generatePresignedUrl(
   *   'default',
   *   'private/file.jpg',
   *   1800,
   *   'PUT'
   * );
   * ```
   */
  async generatePresignedUrl(
    key: string,
    name: string,
    expires: number = 3600,
    method: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD' = 'GET',
  ): Promise<string> {
    // 输入验证
    if (!name || name.trim().length === 0) {
      throw new Error('文件名不能为空');
    }
    if (expires <= 0) {
      throw new Error('过期时间必须大于 0');
    }
    if (expires > 604800) {
      throw new Error('过期时间不能超过 7 天（604800 秒）');
    }

    const client = await this.getClient(key);
    return client.signatureUrl(name, {
      expires,
      method,
    });
  }

  /**
   * 模块销毁
   *
   * @description 在模块销毁时清理所有 OSS 客户端缓存
   *
   * @note 此方法由 NestJS 生命周期钩子自动调用
   */
  onModuleDestroy(): void {
    this.ossClients.clear();
    Logger.log('已清理所有 OSS 客户端缓存', 'OssService');
  }
}

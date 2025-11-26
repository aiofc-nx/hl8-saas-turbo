# @hl8/oss

阿里云 OSS 对象存储服务的 NestJS 封装库，提供简单易用的 API 进行文件上传、下载、删除等操作。

## 功能特性

- ✅ 支持多实例配置（通过配置键区分不同的 OSS 实例）
- ✅ 客户端缓存机制，避免重复创建 OSS 客户端
- ✅ 完整的 TypeScript 类型支持
- ✅ 全局模块，可在整个应用中直接使用
- ✅ 完整的 TSDoc 中文注释
- ✅ 输入验证和错误处理
- ✅ 支持文件上传、下载、删除、列表、信息查询等操作
- ✅ 支持预签名 URL 生成（用于临时访问）

## 安装

```bash
pnpm add @hl8/oss
```

## 配置

### 1. 配置文件

在应用配置文件中添加 OSS 配置（例如 `apps/fastify-api/src/resources/oss.config.yaml`）：

```yaml
oss:
  default:
    region: oss-cn-beijing # OSS 区域
    accessKeyId: your-access-key-id # 阿里云 AccessKey ID
    accessKeySecret: your-access-key-secret # 阿里云 AccessKey Secret
    bucket: your-bucket-name # OSS 存储桶名称
    # 可选配置
    endpoint: https://oss-cn-beijing.aliyuncs.com # 自定义端点
    secure: true # 是否使用 HTTPS，默认 true
    timeout: 60000 # 请求超时时间（毫秒），默认 60000
    internal: false # 是否使用内网端点，默认 false

  # 支持多个 OSS 实例配置
  backup:
    region: oss-cn-shanghai
    accessKeyId: backup-access-key-id
    accessKeySecret: backup-access-key-secret
    bucket: backup-bucket-name
```

### 2. 在模块中导入

```typescript
import { Module } from '@nestjs/common';
import { OssModule } from '@hl8/oss';

@Module({
  imports: [OssModule],
})
export class AppModule {}
```

由于 `OssModule` 使用了 `@Global()` 装饰器，导入后即可在整个应用中直接使用。

## 使用示例

### 基本使用

```typescript
import { Injectable } from '@nestjs/common';
import { OssService } from '@hl8/oss';

@Injectable()
export class FileService {
  constructor(private readonly ossService: OssService) {}

  // 上传文件
  async uploadFile(file: Buffer, fileName: string) {
    const result = await this.ossService.uploadFile(
      'default', // 配置键
      file, // 文件内容（Buffer）
      fileName, // 文件在 OSS 中的路径
      {
        contentType: 'image/jpeg', // 可选：MIME 类型
        meta: { author: 'user123' }, // 可选：元数据
      },
    );
    return result.url; // 返回文件访问 URL
  }

  // 获取文件 URL
  async getFileUrl(fileName: string) {
    return await this.ossService.getFileUrl('default', fileName);
  }

  // 删除文件
  async deleteFile(fileName: string) {
    await this.ossService.deleteFile('default', fileName);
  }

  // 检查文件是否存在
  async checkFileExists(fileName: string) {
    return await this.ossService.checkFileExists('default', fileName);
  }

  // 获取文件信息
  async getFileInfo(fileName: string) {
    const info = await this.ossService.getFileInfo('default', fileName);
    console.log('文件大小:', info.size);
    console.log('文件类型:', info.meta['content-type']);
    return info;
  }

  // 列出文件
  async listFiles(prefix?: string) {
    const result = await this.ossService.listFiles('default', prefix, {
      maxKeys: 100, // 最大返回数量
    });
    return result.objects; // 返回文件列表
  }

  // 生成预签名 URL（用于临时访问私有文件）
  async generatePresignedUrl(fileName: string, expires: number = 3600) {
    return await this.ossService.generatePresignedUrl(
      'default',
      fileName,
      expires, // 过期时间（秒），默认 3600（1 小时）
      'GET', // HTTP 方法
    );
  }
}
```

### 在控制器中使用

```typescript
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OssService } from '@hl8/oss';

@Controller('files')
export class FileController {
  constructor(private readonly ossService: OssService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileName = `uploads/${Date.now()}-${file.originalname}`;
    const result = await this.ossService.uploadFile(
      'default',
      file.buffer,
      fileName,
      { contentType: file.mimetype },
    );
    return { url: result.url };
  }
}
```

### 使用多个 OSS 实例

```typescript
// 上传到默认 OSS
await this.ossService.uploadFile('default', fileBuffer, 'file.jpg');

// 上传到备份 OSS
await this.ossService.uploadFile('backup', fileBuffer, 'file.jpg');
```

## API 文档

### OssService

#### `uploadFile(key, file, name, options?)`

上传文件到 OSS。

**参数：**

- `key: string` - 配置键，对应配置文件中的 `oss.${key}` 路径
- `file: Buffer` - 文件内容（Buffer）
- `name: string` - 文件在 OSS 中的路径/名称
- `options?: object` - 上传选项（可选）
  - `contentType?: string` - 文件 MIME 类型
  - `meta?: Record<string, string>` - 文件元数据
  - `headers?: Record<string, string>` - 自定义请求头

**返回：** `Promise<OSS.PutObjectResult>` - 上传结果，包含 URL、ETag 等信息

**示例：**

```typescript
const result = await ossService.uploadFile(
  'default',
  fileBuffer,
  'images/photo.jpg',
  { contentType: 'image/jpeg' },
);
console.log(result.url);
```

#### `getFileUrl(key, name, options?)`

获取文件访问 URL。

**参数：**

- `key: string` - 配置键
- `name: string` - 文件在 OSS 中的路径/名称
- `options?: object` - URL 生成选项（可选）
  - `expires?: number` - 签名 URL 过期时间（秒），默认 3600
  - `method?: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD'` - HTTP 方法，默认 'GET'

**返回：** `Promise<string>` - 文件访问 URL

**示例：**

```typescript
// 公开访问 URL
const url = await ossService.getFileUrl('default', 'images/photo.jpg');

// 签名 URL（1 小时有效）
const signedUrl = await ossService.getFileUrl('default', 'images/photo.jpg', {
  expires: 3600,
});
```

#### `deleteFile(key, name)`

删除文件。

**参数：**

- `key: string` - 配置键
- `name: string` - 文件在 OSS 中的路径/名称

**返回：** `Promise<OSS.NormalSuccessResponse>` - 删除结果

**示例：**

```typescript
await ossService.deleteFile('default', 'images/photo.jpg');
```

#### `checkFileExists(key, name)`

检查文件是否存在。

**参数：**

- `key: string` - 配置键
- `name: string` - 文件在 OSS 中的路径/名称

**返回：** `Promise<boolean>` - 文件是否存在

**示例：**

```typescript
const exists = await ossService.checkFileExists('default', 'images/photo.jpg');
if (exists) {
  console.log('文件存在');
}
```

#### `getFileInfo(key, name)`

获取文件信息。

**参数：**

- `key: string` - 配置键
- `name: string` - 文件在 OSS 中的路径/名称

**返回：** `Promise<OSS.HeadObjectResult>` - 文件信息，包括大小、类型、修改时间等

**示例：**

```typescript
const info = await ossService.getFileInfo('default', 'images/photo.jpg');
console.log('文件大小:', info.size);
console.log('文件类型:', info.meta['content-type']);
```

#### `listFiles(key, prefix?, options?)`

列出文件。

**参数：**

- `key: string` - 配置键
- `prefix?: string` - 文件路径前缀（可选），默认为空（列出所有文件）
- `options?: object` - 列表选项（可选）
  - `maxKeys?: number` - 最大返回数量，默认 100
  - `marker?: string` - 分页标记

**返回：** `Promise<OSS.ListObjectResult>` - 文件列表

**示例：**

```typescript
// 列出所有文件
const result = await ossService.listFiles('default');

// 列出指定前缀的文件
const result = await ossService.listFiles('default', 'images/', {
  maxKeys: 50,
});
```

#### `generatePresignedUrl(key, name, expires?, method?)`

生成预签名 URL。

**参数：**

- `key: string` - 配置键
- `name: string` - 文件在 OSS 中的路径/名称
- `expires?: number` - 过期时间（秒），默认 3600（1 小时），最大 604800（7 天）
- `method?: 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD'` - HTTP 方法，默认 'GET'

**返回：** `Promise<string>` - 预签名 URL

**示例：**

```typescript
// 生成 1 小时有效的 GET 请求 URL
const url = await ossService.generatePresignedUrl(
  'default',
  'private/file.jpg',
  3600,
);

// 生成 30 分钟有效的 PUT 请求 URL（用于上传）
const uploadUrl = await ossService.generatePresignedUrl(
  'default',
  'private/file.jpg',
  1800,
  'PUT',
);
```

## 配置接口

### OssConfig

```typescript
interface OssConfig {
  /** OSS 区域，如 'oss-cn-beijing'、'oss-cn-shanghai' 等 */
  region: string;
  /** 阿里云 AccessKey ID */
  accessKeyId: string;
  /** 阿里云 AccessKey Secret */
  accessKeySecret: string;
  /** OSS 存储桶名称 */
  bucket: string;
  /** 自定义端点（可选），用于私有化部署或特殊场景 */
  endpoint?: string;
  /** 是否使用 HTTPS（可选），默认 true */
  secure?: boolean;
  /** 请求超时时间（毫秒，可选），默认 60000 */
  timeout?: number;
  /** 是否启用内部端点（可选），用于 ECS 内网访问 */
  internal?: boolean;
}
```

## 错误处理

所有方法在出错时都会抛出错误，错误消息为中文：

```typescript
try {
  await ossService.uploadFile('default', fileBuffer, 'file.jpg');
} catch (error) {
  if (error.message.includes('未找到键为')) {
    // 配置不存在
  } else if (error.message.includes('文件内容不能为空')) {
    // 文件内容为空
  } else {
    // 其他错误
  }
}
```

## 输入验证

库会自动验证输入参数：

- 文件内容不能为空
- 文件名不能为空
- 文件名不能以 "/" 开头
- 预签名 URL 过期时间必须在 1 秒到 7 天之间

## 注意事项

1. **文件名规范**：
   - 文件名不能以 "/" 开头
   - 建议使用相对路径，如 `images/photo.jpg` 而不是 `/images/photo.jpg`

2. **配置安全**：
   - 不要在代码中硬编码 AccessKey，使用配置文件或环境变量
   - 生产环境建议使用 STS 临时凭证

3. **性能优化**：
   - 客户端实例会被缓存，避免重复创建
   - 大文件上传建议使用分片上传（需要直接使用 ali-oss SDK）

4. **预签名 URL**：
   - 过期时间不能超过 7 天（604800 秒）
   - 用于临时访问私有文件或允许客户端直接上传

## 测试

运行测试：

```bash
pnpm test
```

查看测试覆盖率：

```bash
pnpm test:cov
```

## 许可证

MIT

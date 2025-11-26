import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import chalk from 'chalk';
import gradient from 'gradient-string';

import { appConfigToken, ConfigKeyPaths, IAppConfig } from '@hl8/config';
import { ApiRes } from '@hl8/rest';

import * as packageJson from '../../../../package.json';

/**
 * Swagger 配置接口
 *
 * @description 用于自定义 Swagger 文档的配置信息，所有字段都是可选的
 *
 * @property title - API 文档标题
 * @property description - API 文档描述
 * @property termsOfService - 服务条款 URL
 * @property contact - 联系信息
 * @property license - 许可证信息
 */
export interface ISwaggerConfig {
  /** API 文档标题 */
  title?: string;
  /** API 文档描述 */
  description?: string;
  /** 服务条款 URL */
  termsOfService?: string;
  /** 联系信息 */
  contact?: {
    /** 联系人姓名 */
    name?: string;
    /** 联系人 URL */
    url?: string;
    /** 联系人邮箱 */
    email?: string;
  };
  /** 许可证信息 */
  license?: {
    /** 许可证名称 */
    name: string;
    /** 许可证 URL */
    url: string;
  };
}

/**
 * 初始化 Swagger 文档
 *
 * @description 配置并初始化 Swagger API 文档，包括安全认证、API 信息等
 *
 * @param app - NestJS 应用实例
 * @param configService - 配置服务，用于获取应用配置
 * @param swaggerConfig - 可选的 Swagger 配置，用于自定义文档信息。如果不提供，将使用默认值
 *
 * @example
 * ```typescript
 * // 使用默认配置
 * initDocSwagger(app, configService);
 *
 * // 使用自定义配置
 * initDocSwagger(app, configService, {
 *   title: 'My API',
 *   description: 'My API Description',
 *   contact: {
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *   },
 * });
 * ```
 */
export function initDocSwagger(
  app: INestApplication,
  configService: ConfigService<ConfigKeyPaths>,
  swaggerConfig?: ISwaggerConfig,
): void {
  const { docSwaggerEnable, docSwaggerPath, port } =
    configService.get<IAppConfig>(appConfigToken, {
      infer: true,
    });

  if (!docSwaggerEnable) return;

  // 使用配置参数覆盖默认值，保持向后兼容
  const title = swaggerConfig?.title || 'Soybean Admin NestJS Backend API';
  const description =
    swaggerConfig?.description ||
    'This API serves as the backend service for Soybean Admin, providing a comprehensive set of functionalities for system management and operations.';
  const termsOfService =
    swaggerConfig?.termsOfService || 'Soybean Terms of Service';
  const contactName =
    swaggerConfig?.contact?.name || packageJson.author?.name || '';
  const contactUrl =
    swaggerConfig?.contact?.url || packageJson.author?.url || '';
  const contactEmail =
    swaggerConfig?.contact?.email || packageJson.author?.email || '';
  const licenseName = swaggerConfig?.license?.name || packageJson.license || '';
  const licenseUrl =
    swaggerConfig?.license?.url ||
    'https://github.com/soybeanjs/soybean-admin-nestjs/blob/main/LICENSE';

  const documentBuilder = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(packageJson.version);

  // 只有在提供了值时才设置可选字段
  if (termsOfService) {
    documentBuilder.setTermsOfService(termsOfService);
  }

  if (contactName || contactUrl || contactEmail) {
    documentBuilder.setContact(contactName, contactUrl, contactEmail);
  }

  if (licenseName && licenseUrl) {
    documentBuilder.setLicense(licenseName, licenseUrl);
  }

  documentBuilder.addSecurity('', {
    description: 'Bearer Authentication',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    ignoreGlobalPrefix: false,
    extraModels: [ApiRes],
  });

  SwaggerModule.setup(docSwaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const logger = new Logger('SwaggerModule');
  const message = `Swagger Document running on http://127.0.0.1:${port}/${docSwaggerPath}`;
  fancyLog(message, logger);
}

/**
 * 花式日志输出
 *
 * @description 使用渐变色和边框美化日志输出，提升视觉效果，用于显示 Swagger 文档地址
 *
 * @param message - 要输出的消息
 * @param logger - 日志记录器实例
 */
function fancyLog(message: string, logger: Logger) {
  const rainbow = gradient(
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'indigo',
    'violet',
  );

  const messageLength = message.length;
  const border = '*'.repeat(messageLength + 10);

  const coloredBorder = rainbow(border);

  const styledMessage = chalk.bold(`**** ${rainbow(message)} ****`);

  logger.log(coloredBorder);
  logger.log(styledMessage);
  logger.log(coloredBorder);
}

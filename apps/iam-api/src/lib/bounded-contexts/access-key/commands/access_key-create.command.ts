import { ICommand } from '@nestjs/cqrs';

/**
 * 访问密钥创建命令
 *
 * @description
 * CQRS 命令对象，用于创建新的访问密钥。访问密钥用于 API 调用认证，支持多租户场景。
 *
 * @implements {ICommand}
 */
export class AccessKeyCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param domain - 访问密钥所属的域代码，用于多租户隔离
   * @param description - 访问密钥的描述信息，用于说明密钥的用途，可为空
   * @param uid - 创建者的用户 ID，用于审计追踪
   */
  constructor(
    readonly domain: string,
    readonly description: string | null,
    readonly uid: string,
  ) {}
}

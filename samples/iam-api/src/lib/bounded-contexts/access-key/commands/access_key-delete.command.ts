import { ICommand } from '@nestjs/cqrs';

/**
 * 访问密钥删除命令
 *
 * @description
 * CQRS 命令对象，用于删除指定的访问密钥。
 * 删除访问密钥后，该密钥将立即失效，使用该密钥的 API 调用将无法通过认证。
 *
 * @implements {ICommand}
 */
export class AccessKeyDeleteCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要删除的访问密钥的唯一标识符
   */
  constructor(readonly id: string) {}
}

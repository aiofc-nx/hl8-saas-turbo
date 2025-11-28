import { Status } from '@/lib/shared/enums/status.enum';
import { IEvent } from '@nestjs/cqrs';

/**
 * 访问密钥删除事件
 *
 * @description
 * 当访问密钥被删除时发布的领域事件。该事件可以被其他有界上下文订阅，
 * 用于执行后续操作，如清理缓存、撤销权限、发送通知等。
 *
 * @implements {IEvent}
 */
export class AccessKeyDeletedEvent implements IEvent {
  /**
   * 构造函数
   *
   * @param domain - 访问密钥所属的域代码
   * @param AccessKeyID - 访问密钥 ID（用于 API 认证）
   * @param AccessKeySecret - 访问密钥值（用于 API 认证）
   * @param status - 访问密钥的状态
   */
  constructor(
    public readonly domain: string,
    public readonly AccessKeyID: string,
    public readonly AccessKeySecret: string,
    public readonly status: Status,
  ) {}
}

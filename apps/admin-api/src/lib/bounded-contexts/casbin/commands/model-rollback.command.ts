import { ICommand } from '@nestjs/cqrs';

/**
 * 模型配置回滚命令
 *
 * @description
 * CQRS 命令对象，用于回滚到历史版本（将历史版本重新设置为激活状态）。
 *
 * @implements {ICommand}
 */
export class ModelRollbackCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要回滚到的版本 ID
   * @param uid - 操作者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: number,
    readonly uid: string,
  ) {}
}

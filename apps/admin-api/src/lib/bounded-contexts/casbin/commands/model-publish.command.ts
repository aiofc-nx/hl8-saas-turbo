import { ICommand } from '@nestjs/cqrs';

/**
 * 模型配置发布命令
 *
 * @description
 * CQRS 命令对象，用于发布模型配置版本（将草稿或历史版本设置为激活状态）。
 *
 * @implements {ICommand}
 */
export class ModelPublishCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 要发布的版本 ID
   * @param uid - 审批者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: number,
    readonly uid: string,
  ) {}
}

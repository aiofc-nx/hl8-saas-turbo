import { ICommand } from '@nestjs/cqrs';

/**
 * 模型配置草稿创建命令
 *
 * @description
 * CQRS 命令对象，用于创建新的模型配置草稿。
 *
 * @implements {ICommand}
 */
export class ModelDraftCreateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param content - 模型配置内容（完整的 model.conf 文本）
   * @param remark - 备注说明，可选
   * @param uid - 创建者的用户 ID，用于审计追踪
   */
  constructor(
    readonly content: string,
    readonly remark: string | undefined,
    readonly uid: string,
  ) {}
}

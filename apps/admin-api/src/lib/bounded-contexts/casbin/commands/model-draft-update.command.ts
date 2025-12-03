import { ICommand } from '@nestjs/cqrs';

/**
 * 模型配置草稿更新命令
 *
 * @description
 * CQRS 命令对象，用于更新模型配置草稿。
 *
 * @implements {ICommand}
 */
export class ModelDraftUpdateCommand implements ICommand {
  /**
   * 构造函数
   *
   * @param id - 草稿版本 ID
   * @param content - 模型配置内容（完整的 model.conf 文本）
   * @param remark - 备注说明，可选
   * @param uid - 更新者的用户 ID，用于审计追踪
   */
  constructor(
    readonly id: number,
    readonly content: string,
    readonly remark: string | undefined,
    readonly uid: string,
  ) {}
}

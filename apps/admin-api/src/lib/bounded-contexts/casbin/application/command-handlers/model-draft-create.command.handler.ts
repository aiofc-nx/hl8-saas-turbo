import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ModelDraftCreateCommand } from '../../commands/model-draft-create.command';
import { CasbinModelService } from '../service/casbin-model.service';

/**
 * 模型配置草稿创建命令处理器
 *
 * @description
 * 处理模型配置草稿创建命令，创建新的草稿版本。
 *
 * @implements {ICommandHandler<ModelDraftCreateCommand, void>}
 */
@CommandHandler(ModelDraftCreateCommand)
export class ModelDraftCreateHandler
  implements ICommandHandler<ModelDraftCreateCommand, void>
{
  constructor(private readonly modelService: CasbinModelService) {}

  /**
   * 执行草稿创建
   *
   * @param command - 草稿创建命令
   */
  async execute(command: ModelDraftCreateCommand): Promise<void> {
    await this.modelService.createDraft(
      command.content,
      command.remark,
      command.uid,
    );
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ModelDraftUpdateCommand } from '../../commands/model-draft-update.command';
import { CasbinModelService } from '../service/casbin-model.service';

/**
 * 模型配置草稿更新命令处理器
 *
 * @description
 * 处理模型配置草稿更新命令，更新已存在的草稿版本。
 *
 * @implements {ICommandHandler<ModelDraftUpdateCommand, void>}
 */
@CommandHandler(ModelDraftUpdateCommand)
export class ModelDraftUpdateHandler
  implements ICommandHandler<ModelDraftUpdateCommand, void>
{
  constructor(private readonly modelService: CasbinModelService) {}

  /**
   * 执行草稿更新
   *
   * @param command - 草稿更新命令
   */
  async execute(command: ModelDraftUpdateCommand): Promise<void> {
    await this.modelService.updateDraft(
      command.id,
      command.content,
      command.remark,
    );
  }
}

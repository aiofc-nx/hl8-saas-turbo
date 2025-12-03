import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ModelRollbackCommand } from '../../commands/model-rollback.command';
import { CasbinEnforcerReloadService } from '../service/casbin-enforcer-reload.service';
import { CasbinModelService } from '../service/casbin-model.service';

/**
 * 模型配置回滚命令处理器
 *
 * @description
 * 处理模型配置回滚命令，将指定历史版本重新设置为激活状态并触发 Enforcer 重新加载。
 *
 * @implements {ICommandHandler<ModelRollbackCommand, void>}
 */
@CommandHandler(ModelRollbackCommand)
export class ModelRollbackHandler
  implements ICommandHandler<ModelRollbackCommand, void>
{
  constructor(
    private readonly modelService: CasbinModelService,
    private readonly enforcerReloadService: CasbinEnforcerReloadService,
  ) {}

  /**
   * 执行版本回滚
   *
   * @param command - 版本回滚命令
   */
  async execute(command: ModelRollbackCommand): Promise<void> {
    // 回滚版本
    await this.modelService.rollbackVersion(command.id, command.uid);

    // 重新加载 Enforcer
    await this.enforcerReloadService.reloadEnforcer();
  }
}

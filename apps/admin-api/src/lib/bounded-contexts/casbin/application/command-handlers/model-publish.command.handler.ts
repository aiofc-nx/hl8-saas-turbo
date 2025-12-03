import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ModelPublishCommand } from '../../commands/model-publish.command';
import { CasbinEnforcerReloadService } from '../service/casbin-enforcer-reload.service';
import { CasbinModelService } from '../service/casbin-model.service';

/**
 * 模型配置发布命令处理器
 *
 * @description
 * 处理模型配置发布命令，将指定版本设置为激活状态并触发 Enforcer 重新加载。
 *
 * @implements {ICommandHandler<ModelPublishCommand, void>}
 */
@CommandHandler(ModelPublishCommand)
export class ModelPublishHandler
  implements ICommandHandler<ModelPublishCommand, void>
{
  constructor(
    private readonly modelService: CasbinModelService,
    private readonly enforcerReloadService: CasbinEnforcerReloadService,
  ) {}

  /**
   * 执行版本发布
   *
   * @param command - 版本发布命令
   */
  async execute(command: ModelPublishCommand): Promise<void> {
    // 发布版本
    await this.modelService.publishVersion(command.id, command.uid);

    // 重新加载 Enforcer
    await this.enforcerReloadService.reloadEnforcer();
  }
}

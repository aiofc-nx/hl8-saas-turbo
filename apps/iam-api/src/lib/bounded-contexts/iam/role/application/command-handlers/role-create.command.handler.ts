import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ROOT_PID } from '@/lib/shared/constants/db.constant';
import { UlidGenerator } from '@hl8/utils';

import { RoleCreateCommand } from '../../commands/role-create.command';
import { RoleReadRepoPortToken, RoleWriteRepoPortToken } from '../../constants';
import { Role } from '../../domain/role.model';
import type { RoleCreateProperties } from '../../domain/role.read.model';
import type { RoleReadRepoPort } from '../../ports/role.read.repo-port';
import type { RoleWriteRepoPort } from '../../ports/role.write.repo-port';

/**
 * 角色创建命令处理器
 *
 * @description
 * 处理 RoleCreateCommand 命令，负责创建新角色。
 * 该处理器会验证角色代码的唯一性和父角色的存在性，然后创建角色并保存到数据库。
 *
 * @implements {ICommandHandler<RoleCreateCommand, void>}
 */
@CommandHandler(RoleCreateCommand)
export class RoleCreateHandler
  implements ICommandHandler<RoleCreateCommand, void>
{
  /**
   * 角色写入仓储端口
   *
   * @description 用于持久化角色数据的仓储接口
   */
  @Inject(RoleWriteRepoPortToken)
  private readonly roleWriteRepository: RoleWriteRepoPort;

  /**
   * 角色读取仓储端口
   *
   * @description 用于查询角色数据的仓储接口
   */
  @Inject(RoleReadRepoPortToken)
  private readonly roleReadRepoPort: RoleReadRepoPort;

  /**
   * 执行创建角色命令
   *
   * @description
   * 创建新角色，包括：
   * 1. 验证角色代码是否已存在
   * 2. 如果指定了父角色，验证父角色是否存在
   * 3. 生成角色 ID 并创建角色聚合根
   * 4. 保存到数据库
   *
   * @param command - 角色创建命令，包含角色代码、名称、父角色、状态、描述和创建者信息
   * @returns Promise<void>
   *
   * @throws {BadRequestException} 当角色代码已存在或父角色不存在时抛出异常
   */
  async execute(command: RoleCreateCommand) {
    const existingRole = await this.roleReadRepoPort.getRoleByCode(
      command.code,
    );

    if (existingRole) {
      throw new BadRequestException(
        `A role with code ${command.code} already exists.`,
      );
    }

    if (command.pid !== ROOT_PID) {
      const parentRole = await this.roleReadRepoPort.getRoleById(command.pid);

      if (!parentRole) {
        throw new BadRequestException(
          `Parent role with code ${command.pid} does not exist.`,
        );
      }
    }

    const roleCreateProperties: RoleCreateProperties = {
      id: UlidGenerator.generate(),
      code: command.code,
      name: command.name,
      pid: command.pid,
      status: command.status,
      description: command.description,
      createdAt: new Date(),
      createdBy: command.uid,
    };

    const role = Role.fromCreate(roleCreateProperties);
    await this.roleWriteRepository.save(role);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthZGuard, UsePermissions } from '@hl8/casbin';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';
import type { IAuthentication } from '@hl8/typings';
import type { FastifyRequest } from 'fastify';

import { PolicyBatchCommand } from '@/lib/bounded-contexts/casbin/commands/policy-batch.command';
import { PolicyCreateCommand } from '@/lib/bounded-contexts/casbin/commands/policy-create.command';
import { PolicyDeleteCommand } from '@/lib/bounded-contexts/casbin/commands/policy-delete.command';
import {
  PolicyRuleDto,
  PolicyRuleProperties,
  casbinRuleToPolicyRuleDto,
} from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';
import { PagePoliciesQuery } from '@/lib/bounded-contexts/casbin/queries/page-policies.query';

import { PagePoliciesDto } from '../dto/page-policies.dto';
import { PolicyBatchDto, PolicyRuleCreateDto } from '../dto/policy-rule.dto';

/**
 * Casbin 策略规则控制器
 *
 * @description
 * 提供策略规则管理的 REST API 接口，支持策略规则的创建、删除、查询和批量操作。
 * 所有接口都需要通过权限验证，使用 Casbin 进行权限控制。
 *
 * @example
 * ```typescript
 * // 获取策略规则列表
 * GET /casbin/policies
 *
 * // 创建策略规则
 * POST /casbin/policies
 * {
 *   "ptype": "p",
 *   "subject": "admin",
 *   "object": "/api/users",
 *   "action": "GET"
 * }
 * ```
 */
@UseGuards(AuthZGuard)
@ApiTags('Casbin - Policy')
@Controller('casbin/policies')
export class CasbinPolicyController {
  /**
   * 构造函数
   *
   * @param queryBus - CQRS 查询总线，用于执行查询操作
   * @param commandBus - CQRS 命令总线，用于执行命令操作
   */
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 分页查询策略规则列表
   *
   * @description
   * 根据查询条件分页获取策略规则列表，支持按策略类型、主体、资源、操作、域等筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、策略类型、主体、资源、操作、域等筛选条件
   * @returns 返回分页结果，包含策略规则列表和分页信息
   *
   * @example
   * ```typescript
   * GET /casbin/policies?current=1&size=10&ptype=p&subject=admin
   * ```
   */
  @Get()
  @UsePermissions({ resource: 'casbin:policy', action: 'read' })
  @ApiOperation({
    summary: 'Retrieve Paginated Policies',
  })
  @ApiResponseDoc({ type: PolicyRuleDto, isPaged: true })
  async page(
    @Query() queryDto: PagePoliciesDto,
  ): Promise<ApiRes<PaginationResult<PolicyRuleDto>>> {
    const query = new PagePoliciesQuery({
      current: queryDto.current,
      size: queryDto.size,
      ptype: queryDto.ptype,
      subject: queryDto.subject,
      object: queryDto.object,
      action: queryDto.action,
      domain: queryDto.domain,
    });

    const result = await this.queryBus.execute<
      PagePoliciesQuery,
      PaginationResult<PolicyRuleProperties>
    >(query);

    // 转换为 DTO
    const dtoResult = new PaginationResult<PolicyRuleDto>(
      result.current,
      result.size,
      result.total,
      result.records.map((rule) => casbinRuleToPolicyRuleDto(rule)),
    );

    return ApiRes.success(dtoResult);
  }

  /**
   * 创建策略规则
   *
   * @description
   * 创建一个新的策略规则。策略规则用于定义角色或用户对资源的访问权限。
   *
   * @param dto - 策略规则创建数据传输对象，包含策略类型、主体、资源、操作等信息
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /casbin/policies
   * {
   *   "ptype": "p",
   *   "subject": "admin",
   *   "object": "/api/users",
   *   "action": "GET"
   * }
   * ```
   */
  @Post()
  @UsePermissions({ resource: 'casbin:policy', action: 'create' })
  @ApiOperation({ summary: 'Create a New Policy' })
  @ApiResponse({
    status: 201,
    description: 'The policy has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createPolicy(
    @Body() dto: PolicyRuleCreateDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    const policyDto: PolicyRuleDto = {
      id: 0, // 创建时不需要 ID
      ...dto,
    };

    await this.commandBus.execute(
      new PolicyCreateCommand(policyDto, req.user.uid),
    );
    return ApiRes.ok();
  }

  /**
   * 删除策略规则
   *
   * @description
   * 删除指定的策略规则。
   *
   * @param id - 要删除的策略规则 ID
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当策略规则不存在时抛出异常
   *
   * @example
   * ```typescript
   * DELETE /casbin/policies/1
   * ```
   */
  @Delete(':id')
  @UsePermissions({ resource: 'casbin:policy', action: 'delete' })
  @ApiOperation({ summary: 'Delete a Policy' })
  @ApiResponse({
    status: 201,
    description: 'The policy has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deletePolicy(
    @Param('id') id: number,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(new PolicyDeleteCommand(id, req.user.uid));
    return ApiRes.ok();
  }

  /**
   * 批量操作策略规则
   *
   * @description
   * 批量新增或删除策略规则。用于批量导入导出场景。
   *
   * @param dto - 批量操作数据传输对象，包含策略规则数组和操作类型
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /casbin/policies/batch
   * {
   *   "operation": "add",
   *   "policies": [
   *     {
   *       "ptype": "p",
   *       "subject": "admin",
   *       "object": "/api/users",
   *       "action": "GET"
   *     }
   *   ]
   * }
   * ```
   */
  @Post('batch')
  @UsePermissions({ resource: 'casbin:policy', action: 'batch' })
  @ApiOperation({ summary: 'Batch Operations on Policies' })
  @ApiResponse({
    status: 201,
    description: 'The batch operation has been successfully completed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async batchOperations(
    @Body() dto: PolicyBatchDto,
    @Request() req: FastifyRequest & { user: IAuthentication },
  ): Promise<ApiRes<null>> {
    const policies: PolicyRuleDto[] = dto.policies.map((p) => ({
      id: 0, // 创建时不需要 ID
      ...p,
    }));

    await this.commandBus.execute(
      new PolicyBatchCommand(policies, dto.operation, req.user.uid),
    );
    return ApiRes.ok();
  }
}

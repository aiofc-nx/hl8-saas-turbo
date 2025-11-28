import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CasbinRuleApiEndpointService } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/application/service/casbin-rule-api-endpoint.service';
import {
  EndpointProperties,
  EndpointReadModel,
  EndpointTreeProperties,
} from '@/lib/bounded-contexts/api-endpoint/api-endpoint/domain/endpoint.read.model';
import { EndpointsQuery } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/queries/endpoints.query';
import { PageEndpointsQuery } from '@/lib/bounded-contexts/api-endpoint/api-endpoint/queries/page-endpoints.query';

import { AuthActionVerb, AuthZGuard, UsePermissions } from '@hl8/casbin';
import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';

import { PageEndpointsQueryDto } from '../dto/page-endpoint.dto';

/**
 * API 端点控制器
 *
 * @description
 * 提供 API 端点管理的 REST API 接口，支持 API 端点的查询和权限管理。
 * API 端点是后端接口的抽象，用于 Casbin 权限控制。
 *
 * @example
 * ```typescript
 * // 分页查询 API 端点
 * GET /api-endpoint?current=1&size=10&path=/user&method=GET
 *
 * // 获取角色的授权端点
 * GET /api-endpoint/auth-api-endpoint/admin
 * ```
 */
@UseGuards(AuthZGuard)
@ApiTags('API Endpoint - Module')
@Controller('api-endpoint')
export class EndpointController {
  /**
   * 构造函数
   *
   * @param queryBus - CQRS 查询总线，用于执行查询操作
   * @param casbinRuleApiEndpointService - Casbin 规则 API 端点服务，用于处理端点权限逻辑
   */
  constructor(
    private readonly queryBus: QueryBus,
    private readonly casbinRuleApiEndpointService: CasbinRuleApiEndpointService,
  ) {}

  /**
   * 分页查询 API 端点列表
   *
   * @description
   * 根据查询条件分页获取 API 端点列表，支持按路径、HTTP 方法、操作和资源筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、路径、方法、操作、资源等筛选条件
   * @returns 返回分页结果，包含 API 端点列表和分页信息
   *
   * @example
   * ```typescript
   * GET /api-endpoint?current=1&size=10&path=/user&method=GET&action=read&resource=user
   * ```
   */
  @Get()
  @UsePermissions({ resource: 'api-endpoint', action: AuthActionVerb.READ })
  @ApiOperation({
    summary: 'Retrieve Paginated Api Endpoints',
  })
  @ApiResponseDoc({ type: EndpointReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageEndpointsQueryDto,
  ): Promise<ApiRes<PaginationResult<EndpointProperties>>> {
    const query = new PageEndpointsQuery({
      current: queryDto.current,
      size: queryDto.size,
      path: queryDto.path,
      method: queryDto.method,
      action: queryDto.action,
      resource: queryDto.resource,
    });
    const result = await this.queryBus.execute<
      PageEndpointsQuery,
      PaginationResult<EndpointProperties>
    >(query);
    return ApiRes.success(result);
  }

  /**
   * 获取 API 端点树
   *
   * @description
   * 获取所有 API 端点的树形结构，用于前端展示和管理。端点按照资源组织成树形结构。
   *
   * @returns 返回 API 端点树结构
   *
   * @example
   * ```typescript
   * GET /api-endpoint/tree
   * ```
   */
  @Get('tree')
  @ApiOperation({
    summary: 'Endpoints',
  })
  async treeEndpoint() {
    const result = await this.queryBus.execute<
      EndpointsQuery,
      EndpointTreeProperties[]
    >(new EndpointsQuery());
    return ApiRes.success(result);
  }

  /**
   * 获取角色的授权 API 端点
   *
   * @description
   * 获取指定角色在指定域下已授权的 API 端点列表。用于前端或网关进行接口权限验证。
   *
   * @param roleCode - 角色代码
   * @param req - HTTP 请求对象，用于获取当前用户的域信息
   * @returns 返回已授权的 API 端点列表
   *
   * @example
   * ```typescript
   * GET /api-endpoint/auth-api-endpoint/admin
   * ```
   */
  @Get('auth-api-endpoint/:roleCode')
  @ApiOperation({
    summary: 'Authorized API-Endpoints',
  })
  async authApiEndpoint(
    @Param('roleCode') roleCode: string,
    @Request() req: any,
  ) {
    const result = await this.casbinRuleApiEndpointService.authApiEndpoint(
      roleCode,
      req.user.domain,
    );
    return ApiRes.success(result);
  }
}

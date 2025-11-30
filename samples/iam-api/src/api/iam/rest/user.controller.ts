import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { UserCreateCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-create.command';
import { UserDeleteCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-delete.command';
import { UserUpdateCommand } from '@/lib/bounded-contexts/iam/authentication/commands/user-update.command';
import {
  UserProperties,
  UserReadModel,
} from '@/lib/bounded-contexts/iam/authentication/domain/user.read.model';
import { PageUsersQuery } from '@/lib/bounded-contexts/iam/authentication/queries/page-users.query';

import { ApiResponseDoc } from '@hl8/decorators';
import { ApiRes, PaginationResult } from '@hl8/rest';

import { PageUsersDto } from '../dto/page-users.dto';
import { UserCreateDto, UserUpdateDto } from '../dto/user.dto';

/**
 * 用户控制器
 *
 * @description
 * 提供用户管理的 REST API 接口，支持用户的创建、更新、删除和分页查询。
 * 用户是 IAM 系统中的核心实体，每个用户属于一个域，可以拥有多个角色。
 *
 * @example
 * ```typescript
 * // 分页查询用户
 * GET /user?current=1&size=10&username=test&status=ACTIVE
 *
 * // 创建用户
 * POST /user
 * {
 *   "username": "testuser",
 *   "password": "password123",
 *   "domain": "domain001",
 *   "nickName": "测试用户"
 * }
 * ```
 */
@ApiTags('User - Module')
@Controller('user')
export class UserController {
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
   * 分页查询用户列表
   *
   * @description
   * 根据查询条件分页获取用户列表，支持按用户名、昵称和状态筛选。
   *
   * @param queryDto - 分页查询参数，包含页码、页大小、用户名、昵称、状态等筛选条件
   * @returns 返回分页结果，包含用户列表和分页信息
   *
   * @example
   * ```typescript
   * GET /user?current=1&size=10&username=test&nickName=测试&status=ACTIVE
   * ```
   */
  @Get()
  @ApiOperation({
    summary: 'Retrieve Paginated Users',
  })
  @ApiResponseDoc({ type: UserReadModel, isPaged: true })
  async page(
    @Query() queryDto: PageUsersDto,
  ): Promise<ApiRes<PaginationResult<UserProperties>>> {
    const query = new PageUsersQuery({
      current: queryDto.current,
      size: queryDto.size,
      username: queryDto.username,
      nickName: queryDto.nickName,
      status: queryDto.status,
    });
    const result = await this.queryBus.execute<
      PageUsersQuery,
      PaginationResult<UserProperties>
    >(query);
    return ApiRes.success(result);
  }

  /**
   * 创建用户
   *
   * @description
   * 创建一个新用户。用户名在域内必须唯一，密码需要满足最小长度要求。
   *
   * @param dto - 用户创建数据传输对象，包含用户名、密码、域、昵称等信息
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当用户名已存在、域不存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * POST /user
   * {
   *   "username": "testuser",
   *   "password": "password123",
   *   "domain": "domain001",
   *   "nickName": "测试用户",
   *   "email": "test@example.com",
   *   "phoneNumber": "13800138000"
   * }
   * ```
   */
  @Post()
  @ApiOperation({ summary: 'Create a New User' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async createUser(
    @Body() dto: UserCreateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new UserCreateCommand(
        dto.username,
        dto.password,
        dto.domain,
        dto.nickName,
        dto.avatar,
        dto.email,
        dto.phoneNumber,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 更新用户
   *
   * @description
   * 更新指定用户的信息，包括昵称、头像、邮箱、手机号等。密码和域不允许通过此接口修改。
   *
   * @param dto - 用户更新数据传输对象，包含用户 ID 和要更新的字段
   * @param req - HTTP 请求对象，用于获取当前登录用户信息
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当用户不存在或参数验证失败时抛出异常
   *
   * @example
   * ```typescript
   * PUT /user
   * {
   *   "id": "user-id-123",
   *   "username": "testuser",
   *   "nickName": "更新后的昵称",
   *   "email": "newemail@example.com"
   * }
   * ```
   */
  @Put()
  @ApiOperation({ summary: 'Update a User' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async updateUser(
    @Body() dto: UserUpdateDto,
    @Request() req: any,
  ): Promise<ApiRes<null>> {
    await this.commandBus.execute(
      new UserUpdateCommand(
        dto.id,
        dto.username,
        dto.nickName,
        dto.avatar,
        dto.email,
        dto.phoneNumber,
        req.user.uid,
      ),
    );
    return ApiRes.ok();
  }

  /**
   * 删除用户
   *
   * @description
   * 删除指定的用户。删除前需要确保用户没有关联的重要资源，否则可能抛出异常。
   *
   * @param id - 要删除的用户 ID
   * @returns 返回操作结果，成功时返回 null
   *
   * @throws {HttpException} 当用户不存在或用户有关联资源时抛出异常
   *
   * @example
   * ```typescript
   * DELETE /user/user-id-123
   * ```
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a User' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async deleteUser(@Param('id') id: string): Promise<ApiRes<null>> {
    await this.commandBus.execute(new UserDeleteCommand(id));
    return ApiRes.ok();
  }
}

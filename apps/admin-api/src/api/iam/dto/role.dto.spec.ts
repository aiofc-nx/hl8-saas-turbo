import { validate } from 'class-validator';

import { Status } from '@/lib/shared/enums/status.enum';

import { RoleCreateDto, RoleUpdateDto } from './role.dto';

/**
 * RoleCreateDto 单元测试
 *
 * @description
 * 测试角色创建数据传输对象的验证规则。
 */
describe('RoleCreateDto', () => {
  /**
   * 应该通过验证当所有必填字段都提供时
   *
   * 验证当提供所有必填字段时，DTO 能够通过验证。
   */
  it('应该通过验证当所有必填字段都提供时', async () => {
    const dto = new RoleCreateDto();
    dto.code = 'admin';
    dto.name = '管理员';
    dto.pid = '';
    dto.status = Status.ENABLED;
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该通过验证当所有字段都提供时
   *
   * 验证当提供所有字段（包括可选字段）时，DTO 能够通过验证。
   */
  it('应该通过验证当所有字段都提供时', async () => {
    const dto = new RoleCreateDto();
    dto.code = 'admin';
    dto.name = '管理员';
    dto.pid = 'parent-role-id';
    dto.status = Status.ENABLED;
    dto.description = '管理员角色描述';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当角色代码缺失时
   *
   * 验证当角色代码字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当角色代码缺失时', async () => {
    const dto = new RoleCreateDto();
    dto.name = '管理员';
    dto.pid = '';
    dto.status = Status.ENABLED;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  /**
   * 应该验证失败当角色名称缺失时
   *
   * 验证当角色名称字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当角色名称缺失时', async () => {
    const dto = new RoleCreateDto();
    dto.code = 'admin';
    dto.pid = '';
    dto.status = Status.ENABLED;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  /**
   * 应该验证失败当状态不是有效枚举值时
   *
   * 验证当状态字段不是有效的枚举值时，DTO 验证应该失败。
   */
  it('应该验证失败当状态不是有效枚举值时', async () => {
    const dto = new RoleCreateDto();
    dto.code = 'admin';
    dto.name = '管理员';
    dto.pid = '';
    (dto as any).status = 'INVALID_STATUS';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
  });

  /**
   * 应该通过验证当描述为 null 时
   *
   * 验证当描述字段为 null 时，DTO 能够通过验证（因为它是可选的）。
   */
  it('应该通过验证当描述为 null 时', async () => {
    const dto = new RoleCreateDto();
    dto.code = 'admin';
    dto.name = '管理员';
    dto.pid = '';
    dto.status = Status.ENABLED;
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

/**
 * RoleUpdateDto 单元测试
 *
 * @description
 * 测试角色更新数据传输对象的验证规则。
 */
describe('RoleUpdateDto', () => {
  /**
   * 应该通过验证当所有必填字段都提供时
   *
   * 验证当提供所有必填字段时，DTO 能够通过验证。
   */
  it('应该通过验证当所有必填字段都提供时', async () => {
    const dto = new RoleUpdateDto();
    dto.id = 'role-123';
    dto.code = 'admin';
    dto.name = '管理员';
    dto.pid = '';
    dto.status = Status.ENABLED;
    dto.description = null;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  /**
   * 应该验证失败当 ID 缺失时
   *
   * 验证当角色 ID 字段缺失时，DTO 验证应该失败。
   */
  it('应该验证失败当 ID 缺失时', async () => {
    const dto = new RoleUpdateDto();
    dto.code = 'admin';
    dto.name = '管理员';
    dto.pid = '';
    dto.status = Status.ENABLED;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });
});

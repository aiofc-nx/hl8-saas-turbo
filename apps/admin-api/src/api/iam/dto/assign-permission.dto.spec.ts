import { validate } from 'class-validator';

import { AssignPermissionDto } from './assign-permission.dto';

/**
 * AssignPermissionDto 单元测试
 *
 * 测试权限分配数据传输对象的验证逻辑。
 */
describe('AssignPermissionDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的域、角色 ID 和权限列表时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = 'role-123';
    dto.permissions = ['user:read', 'user:write', 'user:delete'];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空域
   *
   * 验证当域为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空域', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = '';
    dto.roleId = 'role-123';
    dto.permissions = ['user:read'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('domain');
  });

  /**
   * 应该拒绝缺失域字段
   *
   * 验证当域字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失域字段', async () => {
    const dto = new AssignPermissionDto();
    dto.roleId = 'role-123';
    dto.permissions = ['user:read'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'domain')).toBe(true);
  });

  /**
   * 应该拒绝空角色 ID
   *
   * 验证当角色 ID 为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空角色 ID', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = '';
    dto.permissions = ['user:read'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
  });

  /**
   * 应该拒绝缺失角色 ID 字段
   *
   * 验证当角色 ID 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失角色 ID 字段', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.permissions = ['user:read'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
  });

  /**
   * 应该拒绝空权限数组
   *
   * 验证当权限数组为空时，DTO 验证失败。
   */
  it('应该拒绝空权限数组', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = 'role-123';
    dto.permissions = [];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissions')).toBe(true);
  });

  /**
   * 应该拒绝缺失权限数组字段
   *
   * 验证当权限数组字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失权限数组字段', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = 'role-123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissions')).toBe(true);
  });

  /**
   * 应该拒绝包含空字符串的权限
   *
   * 验证当权限数组中包含空字符串时，DTO 验证失败。
   */
  it('应该拒绝包含空字符串的权限', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = 'role-123';
    dto.permissions = ['user:read', '', 'user:write'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissions')).toBe(true);
  });

  /**
   * 应该接受单个权限
   *
   * 验证当权限数组只包含一个元素时，DTO 能够通过验证。
   */
  it('应该接受单个权限', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = 'role-123';
    dto.permissions = ['user:read'];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝非字符串类型的域
   *
   * 验证当域不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的域', async () => {
    const dto = new AssignPermissionDto();
    // @ts-expect-error 测试非字符串类型
    dto.domain = 123;
    dto.roleId = 'role-123';
    dto.permissions = ['user:read'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'domain')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的角色 ID
   *
   * 验证当角色 ID 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的角色 ID', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    // @ts-expect-error 测试非字符串类型
    dto.roleId = 123;
    dto.permissions = ['user:read'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
  });

  /**
   * 应该拒绝非数组类型的权限列表
   *
   * 验证当权限列表不是数组类型时，DTO 验证失败。
   */
  it('应该拒绝非数组类型的权限列表', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = 'role-123';
    // @ts-expect-error 测试非数组类型
    dto.permissions = 'user:read';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissions')).toBe(true);
  });

  /**
   * 应该拒绝包含非字符串类型的权限
   *
   * 验证当权限数组中包含非字符串类型的元素时，DTO 验证失败。
   */
  it('应该拒绝包含非字符串类型的权限', async () => {
    const dto = new AssignPermissionDto();
    dto.domain = 'example.com';
    dto.roleId = 'role-123';
    // @ts-expect-error 测试非字符串类型
    dto.permissions = ['user:read', 123, 'user:write'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'permissions')).toBe(true);
  });
});

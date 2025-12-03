import { validate } from 'class-validator';

import { AssignUserDto } from './assign-user.dto';

/**
 * AssignUserDto 单元测试
 *
 * 测试用户分配数据传输对象的验证逻辑。
 */
describe('AssignUserDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的角色 ID 和用户 ID 列表时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new AssignUserDto();
    dto.roleId = 'role-123';
    dto.userIds = ['user-1', 'user-2', 'user-3'];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空角色 ID
   *
   * 验证当角色 ID 为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空角色 ID', async () => {
    const dto = new AssignUserDto();
    dto.roleId = '';
    dto.userIds = ['user-1'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('roleId');
  });

  /**
   * 应该拒绝缺失角色 ID 字段
   *
   * 验证当角色 ID 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失角色 ID 字段', async () => {
    const dto = new AssignUserDto();
    dto.userIds = ['user-1'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
  });

  /**
   * 应该拒绝空用户 ID 数组
   *
   * 验证当用户 ID 数组为空时，DTO 验证失败。
   */
  it('应该拒绝空用户 ID 数组', async () => {
    const dto = new AssignUserDto();
    dto.roleId = 'role-123';
    dto.userIds = [];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'userIds')).toBe(true);
  });

  /**
   * 应该拒绝缺失用户 ID 数组字段
   *
   * 验证当用户 ID 数组字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失用户 ID 数组字段', async () => {
    const dto = new AssignUserDto();
    dto.roleId = 'role-123';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'userIds')).toBe(true);
  });

  /**
   * 应该拒绝包含空字符串的用户 ID
   *
   * 验证当用户 ID 数组中包含空字符串时，DTO 验证失败。
   */
  it('应该拒绝包含空字符串的用户 ID', async () => {
    const dto = new AssignUserDto();
    dto.roleId = 'role-123';
    dto.userIds = ['user-1', '', 'user-3'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'userIds')).toBe(true);
  });

  /**
   * 应该接受单个用户 ID
   *
   * 验证当用户 ID 数组只包含一个元素时，DTO 能够通过验证。
   */
  it('应该接受单个用户 ID', async () => {
    const dto = new AssignUserDto();
    dto.roleId = 'role-123';
    dto.userIds = ['user-1'];

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝非字符串类型的角色 ID
   *
   * 验证当角色 ID 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的角色 ID', async () => {
    const dto = new AssignUserDto();
    // @ts-expect-error 测试非字符串类型
    dto.roleId = 123;
    dto.userIds = ['user-1'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
  });

  /**
   * 应该拒绝非数组类型的用户 ID 列表
   *
   * 验证当用户 ID 列表不是数组类型时，DTO 验证失败。
   */
  it('应该拒绝非数组类型的用户 ID 列表', async () => {
    const dto = new AssignUserDto();
    dto.roleId = 'role-123';
    // @ts-expect-error 测试非数组类型
    dto.userIds = 'user-1';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'userIds')).toBe(true);
  });

  /**
   * 应该拒绝包含非字符串类型的用户 ID
   *
   * 验证当用户 ID 数组中包含非字符串类型的元素时，DTO 验证失败。
   */
  it('应该拒绝包含非字符串类型的用户 ID', async () => {
    const dto = new AssignUserDto();
    dto.roleId = 'role-123';
    // @ts-expect-error 测试非字符串类型
    dto.userIds = ['user-1', 123, 'user-3'];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'userIds')).toBe(true);
  });
});

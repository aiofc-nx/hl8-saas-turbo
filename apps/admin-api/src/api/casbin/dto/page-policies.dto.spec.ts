import { validate } from 'class-validator';

import { PolicyType } from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';

import { PagePoliciesDto } from './page-policies.dto';

/**
 * PagePoliciesDto 单元测试
 *
 * 测试策略规则分页查询数据传输对象的验证逻辑。
 */
describe('PagePoliciesDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的分页查询数据时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;
    dto.ptype = PolicyType.POLICY;
    dto.subject = 'admin';
    dto.object = '/api/users';
    dto.action = 'GET';
    dto.domain = 'example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该通过仅包含分页参数的验证
   *
   * 验证当只提供分页参数时，DTO 能够通过验证。
   */
  it('应该通过仅包含分页参数的验证', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该允许可选的筛选字段为空
   *
   * 验证当所有筛选字段都未设置时，DTO 仍然能够通过验证。
   */
  it('应该允许可选的筛选字段为空', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;
    dto.ptype = undefined;
    dto.subject = undefined;
    dto.object = undefined;
    dto.action = undefined;
    dto.domain = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝无效的策略类型枚举值
   *
   * 验证当 ptype 不是有效的枚举值时，DTO 验证失败。
   */
  it('应该拒绝无效的策略类型枚举值', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;
    // @ts-expect-error 测试无效枚举值
    dto.ptype = 'INVALID_TYPE';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'ptype')).toBe(true);
  });

  /**
   * 应该接受有效的策略类型枚举值
   *
   * 验证当 ptype 是有效的枚举值时，DTO 能够通过验证。
   */
  it('应该接受有效的策略类型枚举值', async () => {
    const validTypes = Object.values(PolicyType);

    for (const type of validTypes) {
      const dto = new PagePoliciesDto();
      dto.page = 1;
      dto.pageSize = 10;
      dto.ptype = type;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  /**
   * 应该拒绝非字符串类型的 subject
   *
   * 验证当 subject 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 subject', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;
    // @ts-expect-error 测试非字符串类型
    dto.subject = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'subject')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的 object
   *
   * 验证当 object 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 object', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;
    // @ts-expect-error 测试非字符串类型
    dto.object = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'object')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的 action
   *
   * 验证当 action 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 action', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;
    // @ts-expect-error 测试非字符串类型
    dto.action = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'action')).toBe(true);
  });

  /**
   * 应该拒绝非字符串类型的 domain
   *
   * 验证当 domain 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 domain', async () => {
    const dto = new PagePoliciesDto();
    dto.page = 1;
    dto.pageSize = 10;
    // @ts-expect-error 测试非字符串类型
    dto.domain = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'domain')).toBe(true);
  });
});

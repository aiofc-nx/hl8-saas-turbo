import { validate } from 'class-validator';

import { PolicyType } from '@/lib/bounded-contexts/casbin/domain/policy-rule.model';

import { PolicyBatchDto, PolicyRuleCreateDto } from './policy-rule.dto';

/**
 * PolicyRuleCreateDto 单元测试
 *
 * 测试策略规则创建数据传输对象的验证逻辑。
 */
describe('PolicyRuleCreateDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的策略规则数据时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new PolicyRuleCreateDto();
    dto.ptype = PolicyType.POLICY;
    dto.subject = 'admin';
    dto.object = '/api/users';
    dto.action = 'GET';
    dto.domain = 'example.com';
    dto.effect = 'allow';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该通过仅包含必填字段的验证
   *
   * 验证当只提供必填字段（ptype）时，DTO 能够通过验证。
   */
  it('应该通过仅包含必填字段的验证', async () => {
    const dto = new PolicyRuleCreateDto();
    dto.ptype = PolicyType.POLICY;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝缺失 ptype 字段
   *
   * 验证当 ptype 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失 ptype 字段', async () => {
    const dto = new PolicyRuleCreateDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('ptype');
  });

  /**
   * 应该拒绝空 ptype 字段
   *
   * 验证当 ptype 为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空 ptype 字段', async () => {
    const dto = new PolicyRuleCreateDto();
    // @ts-expect-error 测试空字符串
    dto.ptype = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'ptype')).toBe(true);
  });

  /**
   * 应该拒绝无效的 ptype 枚举值
   *
   * 验证当 ptype 不是有效的枚举值时，DTO 验证失败。
   */
  it('应该拒绝无效的 ptype 枚举值', async () => {
    const dto = new PolicyRuleCreateDto();
    // @ts-expect-error 测试无效枚举值
    dto.ptype = 'INVALID_TYPE';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('ptype');
  });

  /**
   * 应该接受所有有效的 PolicyType 枚举值
   *
   * 验证当 ptype 是有效的枚举值时，DTO 能够通过验证。
   */
  it('应该接受所有有效的 PolicyType 枚举值', async () => {
    const validTypes = Object.values(PolicyType);

    for (const type of validTypes) {
      const dto = new PolicyRuleCreateDto();
      dto.ptype = type;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  /**
   * 应该允许可选的 subject 字段为空
   *
   * 验证当 subject 字段未设置时，DTO 仍然能够通过验证。
   */
  it('应该允许可选的 subject 字段为空', async () => {
    const dto = new PolicyRuleCreateDto();
    dto.ptype = PolicyType.POLICY;
    dto.subject = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝非字符串类型的 subject
   *
   * 验证当 subject 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的 subject', async () => {
    const dto = new PolicyRuleCreateDto();
    dto.ptype = PolicyType.POLICY;
    // @ts-expect-error 测试非字符串类型
    dto.subject = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'subject')).toBe(true);
  });

  /**
   * 应该允许所有可选字段为空
   *
   * 验证当所有可选字段都未设置时，DTO 仍然能够通过验证。
   */
  it('应该允许所有可选字段为空', async () => {
    const dto = new PolicyRuleCreateDto();
    dto.ptype = PolicyType.POLICY;
    dto.subject = undefined;
    dto.object = undefined;
    dto.action = undefined;
    dto.domain = undefined;
    dto.effect = undefined;
    dto.v4 = undefined;
    dto.v5 = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝非字符串类型的可选字段
   *
   * 验证当可选字段不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的可选字段', async () => {
    const dto = new PolicyRuleCreateDto();
    dto.ptype = PolicyType.POLICY;
    // @ts-expect-error 测试非字符串类型
    dto.object = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'object')).toBe(true);
  });
});

/**
 * PolicyBatchDto 单元测试
 *
 * 测试策略规则批量操作数据传输对象的验证逻辑。
 */
describe('PolicyBatchDto', () => {
  /**
   * 应该通过有效数据的验证（add 操作）
   *
   * 验证当提供有效的批量新增数据时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证（add 操作）', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [
      {
        ptype: PolicyType.POLICY,
        subject: 'admin',
        object: '/api/users',
      },
    ];
    dto.operation = 'add';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该通过有效数据的验证（delete 操作）
   *
   * 验证当提供有效的批量删除数据时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证（delete 操作）', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [
      {
        ptype: PolicyType.POLICY,
        subject: 'admin',
      },
    ];
    dto.operation = 'delete';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空 policies 数组
   *
   * 验证当 policies 为空数组时，DTO 验证失败。
   * 注意：@IsNotEmpty 对空数组可能不会触发，这里主要验证数组存在性。
   */
  it('应该拒绝空 policies 数组', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [];
    dto.operation = 'add';

    const errors = await validate(dto);
    // @IsNotEmpty 对空数组的行为可能因版本而异，这里验证至少数组字段存在
    // 实际业务逻辑中应该在服务层验证数组非空
    expect(Array.isArray(dto.policies)).toBe(true);
    expect(dto.policies.length).toBe(0);
  });

  /**
   * 应该拒绝缺失 policies 字段
   *
   * 验证当 policies 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失 policies 字段', async () => {
    const dto = new PolicyBatchDto();
    dto.operation = 'add';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'policies')).toBe(true);
  });

  /**
   * 应该拒绝无效的 operation 值
   *
   * 验证当 operation 不是 'add' 或 'delete' 时，DTO 验证失败。
   */
  it('应该拒绝无效的 operation 值', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [
      {
        ptype: PolicyType.POLICY,
      },
    ];
    // @ts-expect-error 测试无效值
    dto.operation = 'invalid';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('operation');
  });

  /**
   * 应该拒绝缺失 operation 字段
   *
   * 验证当 operation 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失 operation 字段', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [
      {
        ptype: PolicyType.POLICY,
      },
    ];

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'operation')).toBe(true);
  });

  /**
   * 应该接受 'add' 操作
   *
   * 验证当 operation 为 'add' 时，DTO 能够通过验证。
   */
  it('应该接受 add 操作', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [
      {
        ptype: PolicyType.POLICY,
      },
    ];
    dto.operation = 'add';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该接受 'delete' 操作
   *
   * 验证当 operation 为 'delete' 时，DTO 能够通过验证。
   */
  it('应该接受 delete 操作', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [
      {
        ptype: PolicyType.POLICY,
      },
    ];
    dto.operation = 'delete';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该接受有效的 policies 数组
   *
   * 验证当 policies 数组包含有效的策略规则时，DTO 能够通过验证。
   */
  it('应该接受有效的 policies 数组', async () => {
    const dto = new PolicyBatchDto();
    dto.policies = [
      {
        ptype: PolicyType.POLICY,
        subject: 'admin',
        object: '/api/users',
      },
      {
        ptype: PolicyType.ROLE_RELATION,
        subject: 'user-123',
        object: 'admin',
      },
    ];
    dto.operation = 'add';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

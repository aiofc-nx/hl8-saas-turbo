import { validate } from 'class-validator';

import { ModelDraftCreateDto, ModelDraftUpdateDto } from './model-config.dto';

/**
 * ModelDraftCreateDto 单元测试
 *
 * 测试模型配置草稿创建数据传输对象的验证逻辑。
 */
describe('ModelDraftCreateDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的模型配置内容时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new ModelDraftCreateDto();
    dto.content = '[request_definition]\nr = sub, obj, act';
    dto.remark = '测试备注';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该通过仅包含必填字段的验证
   *
   * 验证当只提供必填字段（content）时，DTO 能够通过验证。
   */
  it('应该通过仅包含必填字段的验证', async () => {
    const dto = new ModelDraftCreateDto();
    dto.content = '[request_definition]\nr = sub, obj, act';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空内容
   *
   * 验证当 content 为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空内容', async () => {
    const dto = new ModelDraftCreateDto();
    dto.content = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('content');
  });

  /**
   * 应该拒绝缺失内容字段
   *
   * 验证当 content 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失内容字段', async () => {
    const dto = new ModelDraftCreateDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('content');
  });

  /**
   * 应该拒绝非字符串类型的内容
   *
   * 验证当 content 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的内容', async () => {
    const dto = new ModelDraftCreateDto();
    // @ts-expect-error 测试非字符串类型
    dto.content = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  /**
   * 应该允许可选的备注字段为空
   *
   * 验证当 remark 字段未设置时，DTO 仍然能够通过验证。
   */
  it('应该允许可选的备注字段为空', async () => {
    const dto = new ModelDraftCreateDto();
    dto.content = '[request_definition]\nr = sub, obj, act';
    dto.remark = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝非字符串类型的备注
   *
   * 验证当 remark 不是字符串类型时，DTO 验证失败。
   */
  it('应该拒绝非字符串类型的备注', async () => {
    const dto = new ModelDraftCreateDto();
    dto.content = '[request_definition]\nr = sub, obj, act';
    // @ts-expect-error 测试非字符串类型
    dto.remark = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'remark')).toBe(true);
  });
});

/**
 * ModelDraftUpdateDto 单元测试
 *
 * 测试模型配置草稿更新数据传输对象的验证逻辑。
 */
describe('ModelDraftUpdateDto', () => {
  /**
   * 应该通过有效数据的验证
   *
   * 验证当提供有效的模型配置内容时，DTO 能够通过验证。
   */
  it('应该通过有效数据的验证', async () => {
    const dto = new ModelDraftUpdateDto();
    dto.content = '[request_definition]\nr = sub, obj, act';
    dto.remark = '更新备注';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 应该拒绝空内容
   *
   * 验证当 content 为空字符串时，DTO 验证失败。
   */
  it('应该拒绝空内容', async () => {
    const dto = new ModelDraftUpdateDto();
    dto.content = '';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('content');
  });

  /**
   * 应该拒绝缺失内容字段
   *
   * 验证当 content 字段未设置时，DTO 验证失败。
   */
  it('应该拒绝缺失内容字段', async () => {
    const dto = new ModelDraftUpdateDto();

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('content');
  });
});

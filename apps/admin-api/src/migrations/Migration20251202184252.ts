import { Migration } from '@mikro-orm/migrations';

/**
 * 创建 Casbin 模型配置表
 *
 * @description
 * 创建 casbin_model_config 表，用于存储 Casbin 模型配置的版本化数据。
 * 支持模型配置的版本管理、草稿、发布和回滚功能。
 */
export class Migration20251202184252 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table "casbin_model_config" (
        "id" serial primary key,
        "content" text not null,
        "version" integer not null,
        "status" varchar(50) not null default 'draft',
        "remark" text null,
        "created_by" varchar(255) not null,
        "created_at" timestamptz not null default now(),
        "approved_by" varchar(255) null,
        "approved_at" timestamptz null
      );
    `);

    // 创建索引以提高查询性能
    this.addSql(`
      create index "casbin_model_config_status_idx" on "casbin_model_config" ("status");
    `);
    this.addSql(`
      create index "casbin_model_config_version_idx" on "casbin_model_config" ("version");
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "casbin_model_config";`);
  }
}

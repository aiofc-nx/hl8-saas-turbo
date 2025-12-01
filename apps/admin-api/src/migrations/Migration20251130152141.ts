import { Migration } from '@mikro-orm/migrations';

export class Migration20251130152141 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "sys_access_key" ("id" varchar(255) not null, "domain" varchar(255) not null, "access_key_id" varchar not null, "access_key_secret" varchar not null, "status" varchar(255) not null, "description" varchar(255) null, "created_at" timestamptz not null, "created_by" varchar(255) not null, constraint "sys_access_key_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_domain" ("id" varchar(255) not null, "code" varchar(255) not null, "name" varchar(255) not null, "description" varchar(255) not null, "status" varchar(255) not null, "created_at" timestamptz not null, "created_by" varchar(255) not null, constraint "sys_domain_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_endpoint" ("id" varchar(255) not null, "path" varchar(255) not null, "method" varchar(255) not null, "action" varchar(255) not null, "resource" varchar(255) not null, "controller" varchar(255) not null, "summary" varchar(255) null, "created_at" timestamptz not null, "updated_at" varchar(255) null, constraint "sys_endpoint_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_login_log" ("id" varchar(255) not null, "user_id" varchar(255) null, "username" varchar(255) not null, "domain" varchar(255) not null, "login_time" timestamptz not null, "ip" varchar(255) not null, "port" int null, "address" varchar(255) not null, "user_agent" varchar(255) not null, "request_id" varchar(255) not null, "type" varchar(255) not null, "created_at" timestamptz not null, constraint "sys_login_log_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_menu" ("id" serial primary key, "menu_type" varchar(255) not null, "menu_name" varchar(255) not null, "route_name" varchar(255) not null, "route_path" varchar(255) not null, "component" varchar(255) not null, "status" varchar(255) not null, "pid" int not null, "order" int not null, "constant" boolean not null, "icon_type" int null, "icon" varchar(255) null, "path_param" varchar(255) null, "active_menu" varchar(255) null, "hide_in_menu" boolean null, "i18n_key" varchar(255) null, "keep_alive" boolean null, "href" varchar(255) null, "multi_tab" boolean null, "created_at" timestamptz not null, "created_by" varchar(255) not null, "updated_at" varchar(255) null, "updated_by" varchar(255) null);`,
    );

    this.addSql(
      `create table "sys_operation_log" ("id" varchar(255) not null, "user_id" varchar(255) not null, "username" varchar(255) not null, "domain" varchar(255) not null, "module_name" varchar(255) not null, "description" varchar(255) not null, "request_id" varchar(255) not null, "method" varchar(255) not null, "url" varchar(255) not null, "ip" varchar(255) not null, "user_agent" varchar(255) null, "params" jsonb null, "body" jsonb null, "response" jsonb null, "start_time" timestamptz not null, "end_time" timestamptz not null, "duration" int not null, constraint "sys_operation_log_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_role" ("id" varchar(255) not null, "code" varchar(255) not null, "name" varchar(255) not null, "pid" varchar(255) not null, "status" varchar(255) not null, "description" varchar(255) null, "created_at" timestamptz not null, "created_by" varchar(255) not null, "updated_at" varchar(255) null, "updated_by" varchar(255) null, constraint "sys_role_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_role_menu" ("id" varchar(255) not null, "role_id" varchar(255) not null, "menu_id" int not null, "domain" varchar(255) not null, constraint "sys_role_menu_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_tokens" ("id" varchar(255) not null, "access_token" varchar(255) not null, "refresh_token" varchar(255) not null, "status" varchar(255) not null, "user_id" varchar(255) not null, "username" varchar(255) not null, "domain" varchar(255) not null, "ip" varchar(255) not null, "address" varchar(255) not null, "user_agent" varchar(255) not null, "request_id" varchar(255) not null, "type" varchar(255) not null, "created_by" varchar(255) not null, "port" int null, "created_at" timestamptz not null, constraint "sys_tokens_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_user" ("id" varchar(255) not null, "username" varchar(255) not null, "domain" varchar(255) not null, "nick_name" varchar(255) not null, "status" varchar(255) not null, "password" varchar(255) null, "avatar" varchar(255) null, "email" varchar(255) null, "phone_number" varchar(255) null, "created_at" timestamptz not null, "created_by" varchar(255) not null, "updated_at" varchar(255) null, "updated_by" varchar(255) null, constraint "sys_user_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "sys_user_role" ("id" varchar(255) not null, "role_id" varchar(255) not null, "user_id" varchar(255) not null, constraint "sys_user_role_pkey" primary key ("id"));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "sys_access_key" cascade;`);

    this.addSql(`drop table if exists "sys_domain" cascade;`);

    this.addSql(`drop table if exists "sys_endpoint" cascade;`);

    this.addSql(`drop table if exists "sys_login_log" cascade;`);

    this.addSql(`drop table if exists "sys_menu" cascade;`);

    this.addSql(`drop table if exists "sys_operation_log" cascade;`);

    this.addSql(`drop table if exists "sys_role" cascade;`);

    this.addSql(`drop table if exists "sys_role_menu" cascade;`);

    this.addSql(`drop table if exists "sys_tokens" cascade;`);

    this.addSql(`drop table if exists "sys_user" cascade;`);

    this.addSql(`drop table if exists "sys_user_role" cascade;`);
  }
}

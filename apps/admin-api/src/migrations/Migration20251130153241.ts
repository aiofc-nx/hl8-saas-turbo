import { Migration } from '@mikro-orm/migrations';

export class Migration20251130153241 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "casbin_rule" ("id" serial primary key, "ptype" varchar(255) not null, "v0" varchar(255) null, "v1" varchar(255) null, "v2" varchar(255) null, "v3" varchar(255) null, "v4" varchar(255) null, "v5" varchar(255) null);`,
    );
    this.addSql(
      `alter table "casbin_rule" add constraint "casbin_rule_ptype_v0_v1_v2_v3_v4_v5_unique" unique ("ptype", "v0", "v1", "v2", "v3", "v4", "v5");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "casbin_rule" cascade;`);
  }
}

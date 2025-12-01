import { Migration } from '@mikro-orm/migrations';

export class Migration20251201072512 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "sys_domain" add column "updated_at" timestamptz null, add column "updated_by" varchar(255) null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "sys_domain" drop column "updated_at", drop column "updated_by";`,
    );
  }
}

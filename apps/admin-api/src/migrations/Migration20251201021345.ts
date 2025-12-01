import { Migration } from '@mikro-orm/migrations';

export class Migration20251201021345 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "sys_user" add column "is_email_verified" boolean not null default false;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "sys_user" drop column "is_email_verified";`);
  }
}

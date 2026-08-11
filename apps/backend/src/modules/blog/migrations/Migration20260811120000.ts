import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260811120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "blog_post" add column if not exists "hide_breadcrumb" boolean not null default false;`);
    this.addSql(`alter table if exists "blog_post" add column if not exists "hide_meta" boolean not null default false;`);
    this.addSql(`alter table if exists "blog_post" add column if not exists "hide_footer" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "blog_post" drop column if exists "hide_breadcrumb";`);
    this.addSql(`alter table if exists "blog_post" drop column if exists "hide_meta";`);
    this.addSql(`alter table if exists "blog_post" drop column if exists "hide_footer";`);
  }

}

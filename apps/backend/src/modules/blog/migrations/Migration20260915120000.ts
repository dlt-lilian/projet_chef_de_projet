import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260915120000 extends Migration {

  override async up(): Promise<void> {
    // NOT NULL + défaut : les articles existants restent au blog, et le
    // service peut filtrer la rubrique en SQL sans craindre de NULL.
    this.addSql(`alter table if exists "blog_post" add column if not exists "offrir" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "blog_post" drop column if exists "offrir";`);
  }

}

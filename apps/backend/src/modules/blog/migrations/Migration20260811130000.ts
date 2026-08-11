import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260811130000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "blog_post" add column if not exists "path" text null;`);
    // Unicité partielle : deux pages ne peuvent pas se disputer la même URL,
    // mais les articles de blog (path NULL) restent libres.
    this.addSql(`
      create unique index if not exists "idx_blog_post_path"
        on "blog_post" ("path")
        where "deleted_at" is null and "path" is not null;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "idx_blog_post_path";`);
    this.addSql(`alter table if exists "blog_post" drop column if exists "path";`);
  }

}

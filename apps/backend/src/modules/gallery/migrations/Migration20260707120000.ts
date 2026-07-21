import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260707120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "gallery_image" add column if not exists "col_span" integer not null default 1;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "gallery_image" drop column if exists "col_span";`);
  }

}

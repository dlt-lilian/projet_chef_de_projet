import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260703094500 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "gallery_image" ("id" text not null, "src" text not null default '', "alt" text not null default '', "aspect" text not null default 'portrait', "rank" integer not null default 0, "active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gallery_image_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gallery_image_deleted_at" ON "gallery_image" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gallery_image" cascade;`);
  }

}

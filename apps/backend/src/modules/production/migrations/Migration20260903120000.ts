import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260903120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "production_status" ("id" text not null, "stage" text not null default 'ordered', "label" text not null default 'Commandé', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "production_status_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_production_status_deleted_at" ON "production_status" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "production_status" cascade;`);
  }

}

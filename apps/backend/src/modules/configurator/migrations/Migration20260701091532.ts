import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260701091532 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "configurator_product" drop constraint if exists "configurator_product_handle_unique";`);
    this.addSql(`create table if not exists "configurator_product" ("id" text not null, "handle" text not null, "glb_path" text not null, "auto_rotate" boolean not null default true, "model_rotation_deg" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "configurator_product_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_configurator_product_handle_unique" ON "configurator_product" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configurator_product_deleted_at" ON "configurator_product" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "configurator_option" ("id" text not null, "option_key" text not null, "label" text not null, "type" text check ("type" in ('color', 'texture', 'motif', 'engraving')) not null, "target_mesh" jsonb null, "rank" integer not null default 0, "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "configurator_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configurator_option_product_id" ON "configurator_option" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configurator_option_deleted_at" ON "configurator_option" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "configurator_choice" ("id" text not null, "choice_key" text not null, "label" text not null, "color_hex" text null, "texture_path" text null, "darken" real null, "rank" integer not null default 0, "is_default" boolean not null default false, "option_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "configurator_choice_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configurator_choice_option_id" ON "configurator_choice" ("option_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configurator_choice_deleted_at" ON "configurator_choice" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "configurator_option" add constraint "configurator_option_product_id_foreign" foreign key ("product_id") references "configurator_product" ("id") on update cascade;`);

    this.addSql(`alter table if exists "configurator_choice" add constraint "configurator_choice_option_id_foreign" foreign key ("option_id") references "configurator_option" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "configurator_option" drop constraint if exists "configurator_option_product_id_foreign";`);

    this.addSql(`alter table if exists "configurator_choice" drop constraint if exists "configurator_choice_option_id_foreign";`);

    this.addSql(`drop table if exists "configurator_product" cascade;`);

    this.addSql(`drop table if exists "configurator_option" cascade;`);

    this.addSql(`drop table if exists "configurator_choice" cascade;`);
  }

}

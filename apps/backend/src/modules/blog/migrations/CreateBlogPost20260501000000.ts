import { Migration } from "@mikro-orm/migrations"

export class CreateBlogPost20260501000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "blog_post" (
        "id"         VARCHAR(255)  NOT NULL,
        "slug"       VARCHAR(255)  NOT NULL,
        "title"      TEXT          NOT NULL,
        "excerpt"    TEXT          NOT NULL DEFAULT '',
        "cover"      TEXT          NOT NULL DEFAULT '',
        "category"   VARCHAR(255)  NOT NULL DEFAULT '',
        "author"     VARCHAR(255)  NOT NULL DEFAULT '',
        "date"       VARCHAR(255)  NOT NULL DEFAULT '',
        "date_iso"   VARCHAR(255)  NOT NULL DEFAULT '',
        "read_time"  VARCHAR(255)  NOT NULL DEFAULT '',
        "featured"   BOOLEAN       NOT NULL DEFAULT FALSE,
        "published"  BOOLEAN       NOT NULL DEFAULT TRUE,
        "blocks"     JSONB         NOT NULL DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ   NULL,
        CONSTRAINT "blog_post_pkey"  PRIMARY KEY ("id"),
        CONSTRAINT "blog_post_slug"  UNIQUE ("slug")
      );
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_blog_post_category"
        ON "blog_post" ("category")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "idx_blog_post_published_date"
        ON "blog_post" ("published", "date_iso" DESC)
        WHERE "deleted_at" IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "blog_post";`)
  }
}

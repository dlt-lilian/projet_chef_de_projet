import { model } from "@medusajs/framework/utils"

/**
 * Article de blog.
 *
 * Les blocs de contenu sont stockés en JSONB pour rester flexibles
 * (ajout de nouveaux types de blocs sans migration).
 *
 * Les champs meta sont à plat pour permettre des requêtes SQL directes
 * (tri par date, filtre par catégorie, recherche fulltext à terme).
 */
const BlogPost = model.define("blog_post", {
  // ── Identification ────────────────────────────────────────────────
  id:       model.id({ prefix: "blog" }).primaryKey(),
  slug:     model.text().unique(),

  // ── Méta (champs plats) ────────────────────────────────────────────
  title:    model.text(),
  excerpt:  model.text(),
  cover:    model.text(),
  category: model.text(),
  author:   model.text(),
  date:     model.text(),           // Label affiché ex: "30 avril 2026"
  date_iso: model.text(),           // ISO ex: "2026-04-30" (pour tri)
  read_time: model.text(),
  featured: model.boolean().default(false),
  published: model.boolean().default(true),

  // ── Contenu ────────────────────────────────────────────────────────
  // Tableau de blocs JSON (banner, titre, texte, img, doubleimg…)
  blocks: model.json(),
})

export default BlogPost

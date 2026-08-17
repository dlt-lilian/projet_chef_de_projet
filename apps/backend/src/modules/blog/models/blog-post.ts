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

  // ── Page autonome ──────────────────────────────────────────────────
  // URL personnalisée sur un seul segment (ex. "mentions-legales").
  // Renseignée → l'article devient une PAGE : servie à /{path}, absente de
  // la liste du blog et injoignable via /blog/{slug} (pas de doublon SEO).
  // NULL → article de blog classique.
  path: model.text().nullable(),

  // ── Mise en page (masquage des sections du template) ───────────────
  // Permet de réutiliser le template blog pour des pages statiques
  // (mentions légales, CGV…) sans fil d'ariane, méta ni pied de page.
  hide_breadcrumb: model.boolean().default(false),
  hide_meta:       model.boolean().default(false),
  hide_footer:     model.boolean().default(false),

  // ── Contenu ────────────────────────────────────────────────────────
  // Tableau de blocs JSON (banner, titre, texte, img, doubleimg, tableau…)
  blocks: model.json(),
})

export default BlogPost

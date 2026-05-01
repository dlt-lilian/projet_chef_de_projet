/**
 * Seed : migre les fichiers JSON vers la table blog_post en base.
 *
 * Usage depuis la racine du backend :
 *   npx medusa exec src/scripts/seed-blogs.ts
 *
 * Il lit tous les .json dans src/data/blogs/ et les insère dans kogei_db.
 * Les slugs existants sont ignorés (pas de doublon).
 */

import fs from "fs"
import path from "path"
import { BLOG_MODULE } from "../modules/blog"
import type BlogModuleService from "../modules/blog/service"
import type { ExecArgs } from "@medusajs/framework/types"

const BLOGS_DIR = path.join(process.cwd(), "src", "data", "blogs")

export default async function seedBlogs({ container }: ExecArgs) {
  const blogService: BlogModuleService = container.resolve(BLOG_MODULE)

  if (!fs.existsSync(BLOGS_DIR)) {
    console.log(`⚠️  Dossier introuvable : ${BLOGS_DIR}`)
    console.log("   Place tes fichiers JSON dans src/data/blogs/ avant de lancer le seed.")
    return
  }

  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".json"))

  if (files.length === 0) {
    console.log("⚠️  Aucun fichier JSON trouvé dans src/data/blogs/")
    return
  }

  console.log(`\n📚 Migration de ${files.length} article(s) vers kogei_db...\n`)

  let created = 0
  let skipped = 0

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOGS_DIR, file), "utf-8")
    const article = JSON.parse(raw)

    const { slug, meta, blocks } = article

    // Vérifie si le slug existe déjà
    const existing = await blogService.getBlogPostBySlug(slug)
    if (existing) {
      console.log(`  ⏭  Ignoré   ${slug} (déjà en base)`)
      skipped++
      continue
    }

    await blogService.createBlogPosts({
      slug,
      title:     meta.title,
      excerpt:   meta.excerpt     ?? "",
      cover:     meta.cover       ?? "",
      category:  meta.category    ?? "",
      author:    meta.author      ?? "",
      date:      meta.date        ?? "",
      date_iso:  meta.dateISO     ?? "",
      read_time: meta.readTime    ?? "",
      featured:  meta.featured    ?? false,
      published: true,
      blocks:    blocks           ?? [],
    })

    console.log(`  ✅ Créé     ${slug}`)
    created++
  }

  console.log(`\n✨ Seed terminé — ${created} créé(s), ${skipped} ignoré(s).\n`)
}

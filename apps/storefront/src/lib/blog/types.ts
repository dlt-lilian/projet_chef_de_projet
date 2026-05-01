// ─── Blocs ────────────────────────────────────────────────────────────────────

export type BannerBlock = {
  type: "banner"
  img: string
  alt: string
  title?: string
  subtitle?: string
}

export type TitleBlock = {
  type: "titre"
  level: 1 | 2 | 3
  text: string
}

export type TextBlock = {
  type: "texte"
  content: string
  dropcap?: boolean
}

export type ImgBlock = {
  type: "img"
  src: string
  alt: string
  caption?: string
  fullWidth?: boolean
}

export type DoubleImgBlock = {
  type: "doubleimg"
  images: { src: string; alt: string; caption?: string }[]
}

export type Block =
  | BannerBlock
  | TitleBlock
  | TextBlock
  | ImgBlock
  | DoubleImgBlock

// ─── Article ──────────────────────────────────────────────────────────────────

export type ArticleMeta = {
  title: string
  excerpt: string
  cover: string
  category: string
  date: string
  dateISO: string
  readTime: string
  author: string
  featured?: boolean
}

export type Article = {
  slug: string
  meta: ArticleMeta
  blocks: Block[]
}

export type ArticlePreview = {
  slug: string
  meta: ArticleMeta
}

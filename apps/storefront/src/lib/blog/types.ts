// ─── Blocs ────────────────────────────────────────────────────────────────────

export type BannerBlock   = { type: "banner";    img: string; alt: string; title?: string; subtitle?: string }
export type TitleBlock    = { type: "titre";     level: 1 | 2 | 3; text: string }
export type TextBlock     = { type: "texte";     content: string; dropcap?: boolean }
export type ImgBlock      = { type: "img";       src: string; alt: string; caption?: string; fullWidth?: boolean }
export type DoubleImgBlock = { type: "doubleimg"; images: { src: string; alt: string; caption?: string }[] }

export type Block = BannerBlock | TitleBlock | TextBlock | ImgBlock | DoubleImgBlock

// ─── Article (tel que retourné par l'API Medusa) ──────────────────────────────

export type BlogPost = {
  id:        string
  slug:      string
  title:     string
  excerpt:   string
  cover:     string
  category:  string
  author:    string
  date:      string
  date_iso:  string
  read_time: string
  featured:  boolean
  published: boolean
  /**
   * URL personnalisée sur un seul segment (« mentions-legales »). Renseignée →
   * page autonome servie à /{path}, hors liste du blog et hors /blog/{slug}.
   * `null` → article de blog classique.
   */
  path:      string | null
  /** Masquage des habillages du template (pages statiques : mentions légales, CGV…) */
  hide_breadcrumb: boolean
  hide_meta:       boolean
  hide_footer:     boolean
  blocks:    Block[]
  created_at: string
  updated_at: string
}

/** Version sans blocs utilisée pour le listing */
export type BlogPostPreview = Omit<BlogPost, "blocks">

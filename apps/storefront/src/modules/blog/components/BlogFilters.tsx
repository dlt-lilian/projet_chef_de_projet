"use client"

import clsx from "clsx"

type BlogFiltersProps = {
  categories: string[]
  active: string
  onChange: (category: string) => void
}

const ALL = "Toutes les actualités"

export default function BlogFilters({
  categories,
  active,
  onChange,
}: BlogFiltersProps) {
  const items = [ALL, ...categories]

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((cat) => {
        const isActive = active === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={clsx(
              "px-4 py-2 rounded-full text-xs uppercase tracking-wider transition-colors border",
              isActive
                ? "bg-primary text-white border-primary"
                : "bg-white text-grey-90 border-grey-20 hover:border-primary"
            )}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}

export { ALL as ALL_CATEGORY }

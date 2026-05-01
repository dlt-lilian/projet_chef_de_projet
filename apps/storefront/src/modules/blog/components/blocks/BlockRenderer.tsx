import type { Block } from "@lib/blog/types"
import BannerBlock from "./BannerBlock"
import TitleBlock from "./TitleBlock"
import TextBlock from "./TextBlock"
import ImgBlock from "./ImgBlock"
import DoubleImgBlock from "./DoubleImgBlock"

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`
        switch (block.type) {
          case "banner":    return <BannerBlock    key={key} {...block} />
          case "titre":     return <TitleBlock     key={key} {...block} />
          case "texte":     return <TextBlock      key={key} {...block} />
          case "img":       return <ImgBlock       key={key} {...block} />
          case "doubleimg": return <DoubleImgBlock key={key} {...block} />
          default:          return null
        }
      })}
    </>
  )
}

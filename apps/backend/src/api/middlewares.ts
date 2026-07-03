import { defineMiddlewares } from "@medusajs/framework/http"
import multer from "multer"

// Upload en mémoire pour la route générique d'upload R2 (choix du dossier).
const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/media/upload",
      method: ["POST"],
      middlewares: [upload.array("files")],
    },
  ],
})

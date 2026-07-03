import { defineMiddlewares } from "@medusajs/framework/http"
import multer from "multer"

// Upload en mémoire pour la route custom du configurateur (choix du dossier R2).
const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/configurator/upload",
      method: ["POST"],
      middlewares: [upload.array("files")],
    },
  ],
})

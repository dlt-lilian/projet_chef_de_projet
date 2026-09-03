import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import { PRIMARY_COUNTRY } from "@lib/util/seo"

// `.replace` retire un éventuel slash final : `${BACKEND_URL}/store/regions` deviendrait
// sinon `…app//store/regions` → 404 → aucune région chargée (repli silencieux sur la région par défaut).
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/+$/, "")
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
// Repli aligné sur PRIMARY_COUNTRY (seo.ts) : le pays servi par défaut et le
// `x-default` du cluster hreflang DOIVENT désigner le même marché. Avec l'ancien
// repli « dk », un crawler sans signal géo atterrissait sur /dk pendant que le
// x-default annonçait /fr — deux façons contradictoires de désigner le marché
// prioritaire. Une seule source de vérité, désormais.
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || PRIMARY_COUNTRY

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const json = await response.json()

    const { regions } = json

    if (!regions?.length) {
      return new Map<string, HttpTypes.StoreRegion>()
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

type CountryResolution = {
  countryCode?: string
  /**
   * `true` quand le pays vient d'un signal PROPRE AU VISITEUR (géo-IP de la
   * plateforme). Pilote le code de redirection — cf. `middleware` plus bas.
   */
  fromVisitorSignal: boolean
}

/**
 * Résout le pays d'une requête ET indique d'où vient la réponse.
 *
 * La provenance importe autant que la valeur : une destination dérivée du
 * visiteur ne peut pas être redirigée en permanent (voir `middleware`).
 */
function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion>
): CountryResolution {
  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

  // Cloudflare Workers provides country via request.cf.country
  const cloudflareCountryCode = (request as { cf?: { country?: string } }).cf?.country?.toLowerCase()

  // Vercel provides x-vercel-ip-country header
  const vercelCountryCode = request.headers
    .get("x-vercel-ip-country")
    ?.toLowerCase()

  if (urlCountryCode && regionMap.has(urlCountryCode)) {
    return { countryCode: urlCountryCode, fromVisitorSignal: false }
  }
  if (cloudflareCountryCode && regionMap.has(cloudflareCountryCode)) {
    return { countryCode: cloudflareCountryCode, fromVisitorSignal: true }
  }
  if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
    return { countryCode: vercelCountryCode, fromVisitorSignal: true }
  }
  if (regionMap.has(DEFAULT_REGION)) {
    return { countryCode: DEFAULT_REGION, fromVisitorSignal: false }
  }
  return {
    countryCode: regionMap.keys().next().value,
    fromVisitorSignal: false,
  }
}

/**
 * Middleware to handle region selection and onboarding status.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  let regionMap: Map<string, HttpTypes.StoreRegion>
  try {
    regionMap = await getRegionMap(cacheId)
  } catch {
    regionMap = new Map()
  }
  const { countryCode, fromVisitorSignal } = getCountryCode(request, regionMap)

  // if the country code is available, use it, otherwise use the default region
  const country = countryCode || DEFAULT_REGION
  const firstPathSegment = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  const urlHasCountry = firstPathSegment === country.toLowerCase()

  if (urlHasCountry) {
    if (!cacheIdCookie) {
      const response = NextResponse.next()
      response.cookies.set("_medusa_cache_id", cacheId, {
        maxAge: 60 * 60 * 24,
      })
      return response
    }
    return NextResponse.next()
  }

  // if the url doesn't have the country, redirect to it
  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname
  const queryString = request.nextUrl.search || ""
  const redirectUrl = `${request.nextUrl.origin}/${country}${redirectPath}${queryString}`

  // 308 (PERMANENT) quand la destination ne dépend d'AUCUN signal visiteur :
  // c'est le cas sur Railway, où ni `cf.country` ni l'en-tête Vercel n'existent.
  // Google consolide alors /blog vers /fr/blog au lieu de conserver les deux URL
  // — un 307 laissait l'URL sans pays indexable indéfiniment.
  // 307 (TEMPORAIRE) dès qu'un signal géo est utilisé : la destination varie
  // d'un visiteur à l'autre, et un 308 mis en cache par le navigateur figerait
  // le premier pays rencontré (un visiteur en déplacement resterait bloqué).
  return NextResponse.redirect(redirectUrl, fromVisitorSignal ? 307 : 308)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}

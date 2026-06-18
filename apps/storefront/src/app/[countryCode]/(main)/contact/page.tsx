import { Metadata } from "next"
import Link from "next/link"
import ContactForm from "@modules/contact/components/ContactForm"

export const metadata: Metadata = {
  title: "Contact — Kōgei",
  description:
    "Une question ? Une demande de personnalisation ? Contactez l'équipe Kōgei.",
}

export default function ContactPage() {
  return (
    <div className="content-container py-10 md:py-14">
      <p className="text-xs text-gray-500 mb-2">Accueil / Contact</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
        <section>
          <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-grey-90">
            Contactez-nous
          </h1>
          <ContactForm />
        </section>

        <aside className="bg-grey-20 rounded-2xl p-6 h-max">
          <h2 className="text-lg font-semibold mb-3 text-grey-90">Assistance</h2>
          <p className="text-sm text-grey-70 leading-relaxed mb-4">
            Avant de nous écrire, vous trouverez peut-être votre réponse parmi
            nos articles d'aide : livraison, retours, personnalisation.
          </p>
          <Link
            href="/blog"
            className="text-sm font-medium text-primary hover:underline"
          >
            Articles aide →
          </Link>
        </aside>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@modules/common/components/my_ui"

const SUBJECTS = [
  "Question sur une commande",
  "Demande de personnalisation",
  "Conseil produit",
  "Partenariat",
  "Autre",
]

type FormState = {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
  consent: boolean
}

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  subject: SUBJECTS[0],
  message: "",
  consent: false,
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.consent) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    setSent(true)
    setForm(initialState)
  }

  const fieldClass =
    "w-full bg-grey-20 px-4 py-2 rounded-xl text-sm text-grey-90 " +
    "placeholder:text-grey-40 focus:outline-none focus:ring-2 focus:ring-primary"

  const labelClass = "text-sm font-medium text-grey-90 mb-2 block"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className={labelClass} htmlFor="firstName">
            Prénom
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="John"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="lastName">
            Nom
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Doe"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="john.doe@mail.fr"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="subject">
          Sujet
        </label>
        <select
          id="subject"
          value={form.subject}
          onChange={(e) => update("subject", e.target.value)}
          className={fieldClass + " appearance-none cursor-pointer"}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          placeholder="Votre message..."
          required
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className={fieldClass + " resize-none"}
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-grey-90">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="w-5 h-5 accent-primary cursor-pointer"
        />
        <span>
          J'accepte que mes informations soient utilisées pour répondre à ma
          demande.
        </span>
      </label>

      <Button
        type="submit"
        variant="primary"
        size="full"
        isLoading={submitting}
        disabled={!form.consent}
      >
        Envoyer le message
      </Button>

      {sent && (
        <p className="text-sm text-green-700 mt-2">
          Merci ! Votre message a bien été envoyé.
        </p>
      )}
    </form>
  )
}

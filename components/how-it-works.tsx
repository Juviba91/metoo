import { Search, MessageCircle, Eye, ShieldCheck } from 'lucide-react'

/**
 * Cómo funciona metoo, en cuatro puntos.
 *
 * Va en Mi perfil porque es la pantalla a la que se vuelve cuando uno tiene
 * dudas, y porque /guidelines son las normas (lo que se espera de ti), no las
 * instrucciones (cómo se usa esto). Son cosas distintas.
 */
const PUNTOS = [
  {
    icon: Search,
    titulo: 'Busca por lo que has vivido',
    texto:
      'En Inicio ves a personas que han pasado por lo mismo que tú. Filtra por hashtag para encontrar a quien encaje con tu situación.',
  },
  {
    icon: MessageCircle,
    titulo: 'Quien busca apoyo da el primer paso',
    texto:
      'La conversación la inicia siempre quien necesita ayuda. El voluntario la acepta al responder, y a partir de ahí habláis en privado.',
  },
  {
    icon: Eye,
    titulo: 'Solo se ve lo que tú pones',
    texto:
      'Los demás ven tu nombre de usuario, tu ciudad, tus hashtags y lo que escribas en tu perfil. Tu nombre real y tu correo no se muestran nunca.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Aquí nadie es profesional',
    texto:
      'Los voluntarios cuentan su experiencia, no dan diagnósticos. Puedes bloquear o reportar a cualquiera. Si necesitas ayuda profesional, el 024 atiende gratis a todas horas.',
  },
]

export function HowItWorks() {
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold">Cómo funciona metoo</h2>
      <ul className="space-y-4">
        {PUNTOS.map(({ icon: Icon, titulo, texto }) => (
          <li key={titulo} className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{titulo}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

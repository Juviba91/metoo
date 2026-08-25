# metoo

**Alguien ya estuvo donde estás tú.**

metoo conecta a personas que atraviesan un momento difícil con voluntarios que
han vivido algo parecido. Cerca de ti. Sin juicios. Gratis, y para siempre.

🔗 **App:** https://support-network-app.vercel.app
📬 **¿Dudas, ideas, ganas de ayudar?** Escribe a **juan@bay-apps.com** — se
responde a todo el mundo.

> *English speakers: this README is in Spanish because that's the language of
> the app and its community, but contributions, issues and emails in English are
> just as welcome. Write to juan@bay-apps.com and we'll figure it out.*

---

## Por qué existe

Mucha gente pasa por lo más duro de su vida sin saber con quién hablar.

No por falta de cariño alrededor — sino porque quien no ha pasado por ello no
sabe qué decir, y quien sí ha pasado por ello está a kilómetros y no sabe que
existes.

metoo se construye sobre una idea muy simple:

> **No eres el único.**

Una madre con un bebé en la UCIN. Alguien que acaba de perder a su padre. Una
persona que recibe un diagnóstico y no sabe ni por dónde empezar. En todos esos
casos hay alguien que ya lo vivió y que estaría dispuesto a acompañar — solo
falta que se encuentren.

Eso es todo lo que hace esta app.

---

## Esto es un proyecto altruista

Que quede claro desde el principio, porque importa:

- **No hay ánimo de lucro.** Ni ahora ni más adelante.
- **Es gratis** para quien busca apoyo y para quien lo ofrece.
- **No se vende ni se cede ningún dato.** Nunca.
- **No hay publicidad.**
- **El código es público** para que cualquiera pueda comprobar que todo lo
  anterior es cierto.

Nadie cobra por esto. Se mantiene porque creemos que hace falta.

---

## Cómo puedes ayudar

Cualquier ayuda suma, y no hace falta saber programar.

### Si no eres desarrollador

Probablemente eres quien más puede aportar:

- **Cuéntanos qué falla o qué confunde.** Si algo te ha costado entender, a otra
  persona también le costará.
- **Ideas de funcionalidades**: qué echas en falta, qué te habría ayudado a ti.
- **Textos y tono.** Es una app sobre momentos duros; cada palabra cuenta. Si
  algo suena frío, torpe o fuera de lugar, dilo.
- **Difusión.** Que llegue a quien lo necesita es la mitad del trabajo.
- **Ser voluntario.** Si has pasado por algo y quieres acompañar a alguien,
  entra en la app. Ahí es donde de verdad pasa lo importante.

Puedes abrir un [issue](https://github.com/juviba91/metoo/issues) o simplemente
escribir a **juan@bay-apps.com**. No hace falta formalidad ninguna.

### Si eres desarrollador

- Corregir bugs
- Mejoras de interfaz y de experiencia de uso
- **Accesibilidad** (importante: mucha gente llega a esta app agotada, con el
  móvil, de madrugada, en la sala de espera de un hospital)
- Traducciones
- Herramientas de moderación
- Mejoras de privacidad y seguridad
- Documentación

No hay proceso rígido: abre un issue o un PR y lo hablamos. Si es tu primera
contribución a open source y algo se te atasca, escribe y te echo una mano — de
verdad, sin problema.

---

## Lo que metoo NO es

metoo **no es un servicio médico, psicológico ni de emergencias**, y los
voluntarios no son terapeutas: son personas que han pasado por algo parecido y
que comparten su experiencia.

Si alguien está en peligro inmediato o necesita ayuda urgente, debe contactar
con los servicios de emergencia o con un profesional cualificado.

En España, el **teléfono 024** de atención a la conducta suicida está disponible
24 horas, es gratuito y confidencial.

---

## Privacidad

El código es público. **Los datos de las personas no.**

Si contribuyes, nunca subas al repositorio:

- Datos reales de usuarios
- Claves de API
- Credenciales de Supabase
- Variables de entorno privadas
- Secretos de autenticación

Usa `.env.local.example` como referencia de las variables necesarias.

---

## Desarrollo local

```bash
git clone https://github.com/juviba91/metoo.git
cd metoo
npm install
cp .env.local.example .env.local
# Rellena la URL de Supabase y la anon key en .env.local
npm run dev
```

Antes de abrir un PR:

```bash
npx tsc --noEmit   # debe pasar sin errores
npx next build     # debe compilar limpio
```

### Base de datos

Las migraciones viven en `supabase/migrations/` y se aplican en orden
cronológico. Si añades una, ten en cuenta que **el fichero es solo la mitad del
trabajo**: hay que aplicarla al proyecto y comprobar que el esquema real quedó
como esperabas. Una migración que falla a medias deja la app pidiendo tablas o
columnas que no existen, y eso no siempre da un error visible: PostgREST
devuelve el error dentro de la respuesta y el código puede seguir adelante como
si no hubiera pasado nada.

Tras cambiar el esquema, regenera los tipos:

```bash
supabase gen types typescript --project-id <project-ref> > types/database.ts
```

---

## Notificaciones por email (producción)

metoo avisa por correo cuando llega un mensaje nuevo o una solicitud de
conexión. El envío es **directo**, y la cola `email_queue` se usa solo para
reintentar los que fallan.

Hace falta:

1. Una cuenta de [Resend](https://resend.com) con dominio verificado.
2. Tres Edge Functions desplegadas.
3. Dos webhooks de base de datos.

### Desplegar las funciones

```bash
supabase functions deploy notify-message
supabase functions deploy notify-connection
supabase functions deploy process-email-queue
```

### Secretos

```bash
supabase secrets set RESEND_API_KEY=re_tu_clave
supabase secrets set APP_URL=https://tu-dominio.com
supabase secrets set CRON_SECRET=una_cadena_larga_y_aleatoria
```

`CRON_SECRET` protege `process-email-queue`, que provoca envío de correo y no
puede quedar abierta a internet. Se envía en la cabecera `x-cron-secret`.

### Webhooks

En el panel de Supabase → Database → Webhooks:

| Nombre | Tabla | Evento | URL |
|---|---|---|---|
| notify-message | `messages` | INSERT | `https://<project-ref>.supabase.co/functions/v1/notify-message` |
| notify-connection | `connections` | INSERT | `https://<project-ref>.supabase.co/functions/v1/notify-connection` |

Ambos con la cabecera `Authorization: Bearer <anon-key>`.

### Reintentos

`process-email-queue` hay que invocarla periódicamente (cada pocos minutos) para
que reintente los envíos fallidos, con `x-cron-secret`. Si no se programa, un
email que falle no se reintenta nunca — el envío normal sigue funcionando igual.

---

## Gracias

Si has llegado hasta aquí, gracias por el rato. Y si te animas a echar una mano,
en lo que sea, escribe sin miedo:

**juan@bay-apps.com**

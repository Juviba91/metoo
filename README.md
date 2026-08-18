# metoo

metoo is an open-source support network app designed to help people feel less alone.

The goal is simple: create a safe, accessible and free space where people can share what they are going through, find support, and connect with others who may have experienced something similar.

The app is public and free to use.

Live app: https://support-network-app.vercel.app/

---

## Why metoo exists

Many people go through difficult moments without knowing who to talk to.

metoo is built around one idea:

> You are not the only one.

The project aims to make emotional support easier to access, while protecting user privacy and keeping the platform simple, human and useful.

---

## Open source

metoo is open source because transparency matters, especially in a project related to emotional support and personal experiences.

By making the code public, anyone can:

- Review how the app works.
- Suggest improvements.
- Report bugs.
- Contribute new features.
- Help make the platform safer, clearer and more useful.

Contributions are welcome.

---

## What you can contribute

You can help with:

- Bug fixes.
- UI and UX improvements.
- Accessibility improvements.
- Translations.
- Moderation tools.
- Privacy improvements.
- Documentation.
- New features aligned with the mission of the project.

If you are not a developer, you can still help by opening issues with ideas, feedback or problems you find.

---

## What this project is not

metoo is not a medical, psychological or emergency service.

If someone is in immediate danger or needs urgent help, they should contact local emergency services or a qualified professional.

The app is intended as a support network, not as a replacement for professional care.

---

## Privacy and data

The code is public, but user data is not.

Never upload:

- Real user data.
- API keys.
- Supabase credentials.
- Private environment variables.
- Authentication secrets.
- Any sensitive information.

Use `.env.local.example` as a reference for the required environment variables.

---

## Local development

To run the project locally:

```bash
git clone https://github.com/juviba91/metoo.git
cd metoo
npm install
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key in .env.local
npm run dev
```

---

## Email notifications (production setup)

metoo sends email notifications when a new message or connection request arrives. This requires:

1. A [Resend](https://resend.com) account with a verified sending domain.
2. Two Supabase Edge Functions deployed: `notify-message` and `notify-connection`.
3. Two Supabase database webhooks pointing to each function.

### Deploy Edge Functions

```bash
supabase functions deploy notify-message
supabase functions deploy notify-connection
```

### Set secrets

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set APP_URL=https://your-domain.com
```

### Create database webhooks

In the Supabase dashboard → Database → Webhooks, create:

| Name | Table | Events | URL |
|---|---|---|---|
| notify-message | messages | INSERT | `https://<project-ref>.supabase.co/functions/v1/notify-message` |
| notify-connection | connections | INSERT | `https://<project-ref>.supabase.co/functions/v1/notify-connection` |

Both webhooks should include the `Authorization: Bearer <anon-key>` header.

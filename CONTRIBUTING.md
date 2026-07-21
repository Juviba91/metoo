# Contributing to metoo

Thank you for wanting to contribute. metoo exists to help people feel less alone — your work can have a real impact.

Before you start, take a moment to understand the project's mission: a safe, accessible, and free peer-support space.

---

## Code of conduct

Be respectful. This project deals with sensitive, personal experiences. Treat everyone with care — contributors, users, and the topics they bring.

---

## Getting started

```bash
git clone https://github.com/juviba91/metoo.git
cd metoo
npm install
cp .env.local.example .env.local
# Add your own Supabase project URL and anon key
npm run dev
```

You'll need your own Supabase project for local development. Create a free one at [supabase.com](https://supabase.com).

---

## What to contribute

Good contributions align with the mission:

- **Bug fixes** — especially anything affecting safety or privacy
- **Accessibility** — the platform must work for everyone
- **UX improvements** — simpler, clearer, more human
- **Translations** — to reach more people
- **Moderation tools** — to keep the space safe
- **Privacy improvements** — user data protection matters above all

If you have an idea, open an issue first to align before writing code.

---

## Branch and PR conventions

- Branch from `main`: `git checkout -b fix/what-you-fix` or `feat/what-you-add`
- Keep PRs small and focused on one change
- Write a clear description: what changed and why
- Reference issues with `Fixes #123`

---

## Code style

The project uses:

- **Next.js 15** with App Router — server components by default, client only when needed
- **TypeScript** — no `any` without a comment explaining why
- **Tailwind CSS v4** — utility classes only, no custom CSS unless unavoidable
- **shadcn/ui** — prefer existing components before adding new ones

A few rules:

- No comments that explain *what* the code does — names should do that
- Comments only for non-obvious *why*: workarounds, constraints, surprises
- No emojis in code or commit messages
- Server actions in `actions.ts` files co-located with the page they serve
- Types in `types/database.ts` — keep them in sync with the Supabase schema

---

## Privacy and security

Never commit:

- Real user data
- API keys or secrets
- Supabase credentials or project IDs
- Any `.env.local` or sensitive config

If you find a security vulnerability, email juan@bay-apps.com instead of opening a public issue.

---

## Commit messages

Short, present tense, lowercase:

```
fix volunteer seeing "waiting" on active chat
add hashtag creation from picker
improve onboarding welcome step
```

---

metoo is [MIT licensed](./LICENSE). By contributing you agree your work is licensed under the same terms.

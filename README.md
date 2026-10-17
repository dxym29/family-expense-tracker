# တို့မိသားစု · Family Expense Tracker

A warm, mobile-first Burmese household expense tracker. Built with Express and Supabase; intended for Render and iPhone Safari.

## Features
- Add daily expenses under **ကိုကိုသန့်**, **ထိပ်ထိပ်**, or **အိမ်စရိတ်**
- Date and optional note for every expense
- Daily totals and category breakdown
- Monthly totals and category breakdown
- Edit or delete saved entries
- Supabase Auth and row-level security (each signed-in account can access only its own rows)
- Responsive pastel family-themed interface

## 1. Create the Supabase table

Create a new Supabase project for this app, separate from other projects. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it.

## 2. Configure Supabase Auth

In Supabase Dashboard, open **Authentication → URL Configuration**. Add your deployed Render URL to **Site URL** and Redirect URLs once you have deployed.

Email/password sign-up is supported. If email confirmation is enabled, users must click the confirmation email before signing in. For a personal family app, consider creating the account you need and disabling public sign-ups after that; only do so after you have confirmed your account works.

## 3. Deploy to Render

1. Push this repository to GitHub.
2. In Render, create a **New Web Service** and connect `dxym29/family-expense-tracker`.
3. Runtime: **Node**.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables:
   - `SUPABASE_URL` = Project URL from Supabase → Project Settings → API
   - `SUPABASE_ANON_KEY` = the publishable/anon key from Supabase → Project Settings → API Keys
7. Deploy and open the Render URL on your iPhone.

Do **not** put a Supabase service-role/secret key in this app, in GitHub, or in browser code. The server only exposes the public anon key; row-level security protects the data.

## 4. First use

Open the app, choose **အကောင့်အသစ် ဖွင့်မယ်**, and sign up with an email and password. If email confirmation is enabled, confirm the email first. Sign in to start recording expenses.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
# Set SUPABASE_URL and SUPABASE_ANON_KEY in your shell environment
npm start
```

Then open http://localhost:3000.

## Troubleshooting

- **Database setup required:** run `supabase/schema.sql` in the correct Supabase project.
- **Failed to fetch:** check the Render environment variable spelling and the Supabase project URL.
- **Email not confirmed:** use the confirmation email or adjust the confirmation setting in Supabase Auth.
- **Permission denied / RLS:** make sure the schema SQL has been run and that you are signed in to the correct account.

## Privacy notes

Expense records are scoped by authenticated user using Supabase Row Level Security. Anyone can load the public website and reach the sign-up screen while sign-up is enabled, but they cannot read or change another user's rows. Disable sign-ups in Supabase Auth if you only want the family account(s) you have created.

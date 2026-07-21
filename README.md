# Too Many Subscriptions

A serverless subscription tracker built with Next.js and Supabase.

Live Demo: https://too-many-subscriptions.onrender.com

---

## Tech Stack
* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, Shadcn UI
* **Backend & Database:** Supabase (PostgreSQL)
* **Charts:** Recharts

---

## Core Architecture & Security
* **Row-Level Security (RLS):** Enforced on the `subscriptions` table using `auth.uid() = user_id`. Users can only access their own data.
* **Token Verification:** Uses `supabase.auth.getUser()` to cryptographically verify JWT sessions on the server side, preventing client-side tampering.
* **Performance:** Implements `useMemo` for cost calculations and direct React state updates to avoid unnecessary page reloads.

---

## Local Installation

1. Clone repository:
   ```bash
   git clone https://github.com
   cd too-many-subscriptions
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (create `.env.local` in the root directory):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

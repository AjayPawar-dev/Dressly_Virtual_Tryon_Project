# Dressly Frontend

Dressly is a React + Vite virtual try-on frontend with Supabase auth/storage and a local/server API that calls a Hugging Face Space for image generation.

## Features

- Multi-step try-on workflow
- Email and Google authentication
- Gallery upload and live camera capture
- AI generation progress and result download
- Tailwind-based responsive UI

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Supabase
- Hugging Face / Gradio client

## Local Setup

1. Install dependencies:
   `npm install`
2. Create your local env file:
   Copy `.env.example` to `.env.local`
3. Fill in the required values in `.env.local`
4. Start the project:
   `npm run dev`

This starts:
- Vite frontend on `http://localhost:5173`
- Local API server on `http://localhost:3001`

## Scripts

- `npm run dev` - start frontend + local API
- `npm run dev:client` - start only the Vite frontend
- `npm run dev:api` - start only the local API server
- `npm run lint` - run ESLint
- `npm run build` - build production assets
- `npm run preview` - preview the production build

## Environment Variables

Required in `.env.local`:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `HF_SPACE_NAME`
  Overrides the default Hugging Face Space used by the API.

## Git / GitHub Notes

- `.env.local` is ignored and should not be committed
- `dist/` is generated output and should not be committed
- `node_modules/` is ignored
- See `RELEASE_CHECKLIST.md` before pushing or deploying

## Deployment Notes

- Camera access requires `https` in production or `localhost` in development
- The API expects valid Supabase auth/session when generating try-ons

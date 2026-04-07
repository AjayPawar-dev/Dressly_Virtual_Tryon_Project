# Release Checklist

Use this before pushing or deploying Dressly.

## Before Commit

- Confirm `.env.local` is not staged
- Confirm `dist/` is not staged
- Confirm `node_modules/` is not staged
- Run `npm run lint`
- Run `npm run build`

## Before Push

- Check the active app entry is `src/main.jsx -> src/DeployApp.jsx`
- Confirm required env values exist locally in `.env.local`
- Confirm camera flow works on `localhost` and production will use `https`
- Confirm sign-in, sign-up, and download flow still work

## Required Environment Variables

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Optional:

- `HF_SPACE_NAME`

## Git Commands

Initial setup:

```powershell
git init -b main
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Normal update flow:

```powershell
git add .
git commit -m "Describe your change"
git push
```

## Deployment Notes

- Camera access requires `https` in production
- Local camera access works on `localhost`
- The production build currently succeeds, but Vite warns about a large JS bundle
- That bundle warning is non-blocking, but later optimization is recommended

## Final Sanity Checks

- No critical console errors
- Auth modal opens and closes correctly
- Camera button opens real camera flow
- Generation still works
- Result download works
- Mobile layout remains usable

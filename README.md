# Depository Gambling Demo (Static HTML)

This is a front-end only demo with:
- fake deposit balance
- stake deposit flow with 1-month T-bill yield display
- casino chip conversion + barcode
- coin flip game with 1.95x payout on wins

## Run locally (recommended)

Do not open the files directly with `file://...` in Chrome. Serve them through a local web server:

```bash
cd gambling-demo
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Deploy to GitHub Pages (clean hosted demo)

1. Create a new GitHub repo (for example `gambling-demo`).
2. In terminal:

```bash
cd /Users/maxsextro/Downloads/gambling-demo
git init
git add .
git commit -m "Initial depository gambling demo"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

3. In GitHub repo settings:
   - Go to **Settings -> Pages**
   - Set **Source** to **GitHub Actions**
4. Pushes to `main` will auto-deploy via `.github/workflows/deploy-pages.yml`.
5. Your live demo URL will be:
   - `https://<your-username>.github.io/<your-repo>/`

## Notes

- If live treasury yield fetch is blocked by browser/network policy, the app automatically falls back to a default yield value.
- If barcode CDN is unavailable, the app shows a fallback text chip code.

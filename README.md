# Brandon Restrepo · Portfolio

Personal portfolio of **Brandon Restrepo, Security Analyst**: experience, projects and certifications, set in a deep-space code-rain theme with light and dark modes.

A static site with no build step and no dependencies: plain HTML, CSS and JavaScript.

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly from disk also works, but the offline cache only turns on over `http://localhost` or HTTPS.)

## Deploy

**Cloudflare Pages (recommended).** Connect this repository, leave the build command empty and set the output directory to `/`. Cloudflare reads `_headers`, so the security headers (CSP, HSTS, Permissions-Policy and others) are applied automatically.

**GitHub Pages.** Go to *Settings → Pages → Deploy from a branch*, choose `main` and `/ (root)`. `.nojekyll` is included so `.well-known/security.txt` is published. GitHub Pages ignores `_headers`; the page's own Content-Security-Policy meta tag still applies.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | The page |
| `styles.css` | All styling |
| `app.js` | Interactions, intro, terminal, scenes |
| `data.js` | **Content**: profile, experience, projects, certifications. Edit this to update the site |
| `rain.js` | Background: nebula code rain and stars |
| `starmap.js` | Star map behind the footer |
| `theme.js` | Applies light/dark mode before first paint |
| `sw.js` | Service worker for offline viewing |
| `404.html` | "Under construction" page for missing routes |
| `assets/` | Images, résumé PDF |
| `_headers` | Security headers (Cloudflare Pages / Netlify) |
| `.well-known/security.txt` | Security contact (RFC 9116) |

Curious? Open the terminal on the site and type `help`.

© Brandon Restrepo. All rights reserved.

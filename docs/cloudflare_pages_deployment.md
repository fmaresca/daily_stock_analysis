# Cloudflare Pages Deployment Guide

This project is optimized for static hosting on **Cloudflare Pages**, with zero server runtime requirements and instant worldwide CDN distribution.

---

## 1. Quick Setup (Cloudflare Pages Dashboard)

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository: `fmaresca/daily_stock_analysis`.
3. Configure the **Build Settings**:

| Setting | Value (Recommended: Subdirectory) | Value (Alternative: Monorepo Root) |
| :--- | :--- | :--- |
| **Project name** | `delta-harvest` (or preferred name) | `delta-harvest` |
| **Production branch** | `main` | `main` |
| **Framework preset** | `Vite` | `None` / `Vite` |
| **Root directory** | `web` | *(leave blank / `/`)* |
| **Build command** | `npm run build` | `npm run build` |
| **Build output directory** | `dist` | `web/dist` |

---

## 2. Environment Variables

Under **Settings** > **Environment variables** (or during the initial setup wizard), set:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `NODE_VERSION` | `20.19.0` (or `22`) | Ensures modern Node.js runtime for Vite 6 and Tailwind v4 |

---

## 3. Key Design Decisions

- **Relative Asset Paths (`base: './'`)**:  
  Configured in [`web/vite.config.ts`](file:///c:/Frank/DailyStock/web/vite.config.ts). Ensures that stylesheets, chunks, and static JSON data resolve correctly on Cloudflare Pages without broken links.
- **Static Public Data**:  
  [`web/public/data/options_data.json`](file:///c:/Frank/DailyStock/web/public/data/options_data.json) is bundled directly into the root of `dist/data/options_data.json`.
- **Automated Fallback**:  
  If local asset fetching fails, the application automatically falls back to:
  `https://raw.githubusercontent.com/fmaresca/daily_stock_analysis/main/web/public/data/options_data.json`
- **Wrangler Configuration**:  
  Both [`wrangler.toml`](file:///c:/Frank/DailyStock/wrangler.toml) (repo root) and [`web/wrangler.toml`](file:///c:/Frank/DailyStock/web/wrangler.toml) are provided for CLI deployments using `npx wrangler pages deploy`.

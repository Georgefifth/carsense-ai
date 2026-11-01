# Devpost Human Submission Checklist — CarSense AI

> Per `AGENTS.md` rules, the AI agent prepares the complete, verified submission package and never logs into Devpost, fills online forms, or clicks Submit. Follow the steps below to complete your submission in under 3 minutes.

---

## Step-by-Step Submission Guide

1. **Upload the Demo Video (`1 min`)**
   - Upload `submission/assets/demo.mp4` (`1080p`, `1m 28s`, `10.7 MB`) to **YouTube** (set visibility to *Public* or *Unlisted*) or **Loom**.
   - Copy the resulting video share URL.

2. **Open the Devpost Submission Form**
   - Navigate to: `https://remote-control-ai.devpost.com/`
   - Click **My projects** / **Start a submission** (must be logged into your personal Devpost account).

3. **Copy & Paste Fields from `submission/fields.md`**
   - **Project name**: `CarSense AI`
   - **Elevator pitch**: Copy from Section 2 of `submission/fields.md`.
   - **About the project**: Copy the full Markdown block from Section 4 of `submission/fields.md`.
   - **Built with**: Paste the tags from Section 5 of `submission/fields.md` (`react`, `typescript`, `tailwindcss`, `vite`, `nodejs`, `vercel`, `playwright`, `obd-ii`, `can-bus`, `automotive`, `telematics`, `ai-copilot`).
   - **"Try it out" links**:
     - `https://remote-control-ai.vercel.app`
     - `https://github.com/Georgefifth/carsense-ai`
   - **Video link**: Paste your YouTube / Loom URL from Step 1.

4. **Upload Visual Assets from `submission/assets/`**
   - **Thumbnail**: Upload `submission/assets/thumbnail.png` (`1200×800`, 3:2 ratio, 409 KB).
   - **Image Gallery**: Upload the 5 gallery images (`01-cockpit-overview.png` through `05-validation-benchmark.png`) and paste the matching <150-character caption from Section 8 of `submission/fields.md` under each image.

5. **Review & Click Submit**
   - Verify your team member email(s) and click **Submit project** before the deadline (**Nov 4, 2026 @ 5:00 PM PST / Nov 5, 2026 @ 5:00 PM PST**).

---

## Pre-Submission Verification Checklist (Verified by Agent)

- [x] **Project Name & One-Line Pitch**: Concise, accurate, and aligned with product functionality (`submission/fields.md`).
- [x] **About the Project Markdown**: Covers *Inspiration*, *What it does*, *How we built it*, *Challenges we ran into*, *Accomplishments that we're proud of*, *What we learned*, and *What's next for CarSense AI*. Uses clean `##` headings and backtick-wrapped expressions (no broken LaTeX or raw HTML tags).
- [x] **All Quantitative Claims Backed by Evidence**:
  - `24/24 (100.0%)` post-fix diagnostic accuracy vs. `7/24 (29.2%)` static lookup baseline → verified in `evidence/stage-3.5-validation/post-fix-results.json`.
  - `< 0.25ms` correlation latency → verified in `evidence/stage-3.5-validation/post-fix-results.json`.
  - `12/12` real-browser QA pass rate across Desktop (`1440×900`) & Mobile (`390×844`) → verified in `evidence/stage-3-qa/results.json`.
- [x] **Thumbnail (`submission/assets/thumbnail.png`)**: Custom-generated `1200×800` (`3:2` ratio) PNG artwork (`409 KB < 5 MB` limit), not a cropped screenshot.
- [x] **Gallery Images (`submission/assets/01..05-*.png`)**: 5 PNG images at `1200×800` (`3:2` ratio), each `125 KB – 420 KB` (`< 5 MB` limit), with English captions under 150 characters.
- [x] **Demo Video (`submission/assets/demo.mp4`)**: `1920×1080` 1080p Full HD, `30 fps`, `88.7s` duration (`< 3 min` max limit), narrated voiceover, burned-in captions, and sidechain BGM.
- [x] **Public URLs Verified Live (`HTTP 200`)**:
  - Live Web App: `https://remote-control-ai.vercel.app`
  - Public GitHub Repo: `https://github.com/Georgefifth/carsense-ai`
- [ ] **Human Action Required**: Upload `demo.mp4` to YouTube/Loom, paste fields from `submission/fields.md` into Devpost, and click Submit.

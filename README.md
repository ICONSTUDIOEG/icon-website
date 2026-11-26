# ICON Studio website — www.iconstudio.tech

Static site (one `index.html` + `assets/`), served from the ICON Studio Hostinger VPS.

- `docker-compose.yml` is the deploy file used on the VPS (project `icon-website`): nginx pulls this repo at the pinned `REV` commit on start; Traefik routes `www.iconstudio.tech` (and redirects `iconstudio.tech` to it) with Let's Encrypt TLS.
- To publish a change: merge it into `main`. The **Deploy to iconstudio.tech** workflow (`.github/workflows/deploy.yml`) then, over SSH:
  1. checks that every file `index.html` uses is in the compose download list,
  2. replaces the VPS's `docker-compose.yml` with the one from that commit and pins `REV` to its hash,
  3. recreates the container and waits for `icon-website <hash> ready`, restoring the previous file if it never appears,
  4. confirms www.iconstudio.tech serves that commit's `index.html`.
- To roll back: Actions, **Deploy to iconstudio.tech**, **Run workflow**, and enter an older commit hash.
- New image or video? Add it to the `for f in` list in `docker-compose.yml`, or the asset check fails the deploy.
- Repository secrets the workflow needs: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (private key of a key pair whose public half is in the VPS user's `authorized_keys`), `VPS_PROJECT_DIR` (the folder holding the live `docker-compose.yml`). Optional: `VPS_PORT`, `VPS_KNOWN_HOSTS`.
- Contact form: "Send brief" POSTs JSON to the URL in the form's `data-endpoint` (the n8n workflow in `n8n/contact-brief.workflow.json`, which emails info@icon-studios.com with Reply-To set to the visitor). If the endpoint is empty or fails, the visitor's mail app opens with the brief filled in.
- Videos are 720p web encodes of the 2026-11-21 showreel run (masters in `ICON Studio/00_Studio_Ops/showreel/2026-11-21_run/`).

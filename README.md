# ICON Studio website — www.iconstudio.tech

Static site (one `index.html` + `assets/`), served from the ICON Studio Hostinger VPS.

- `docker-compose.yml` is the deploy file used on the VPS (project `icon-website`): nginx pulls this repo at the pinned `REV` commit on start; Traefik routes `www.iconstudio.tech` (and redirects `iconstudio.tech` to it) with Let's Encrypt TLS.
- To publish a change: push here, put the new commit hash in `REV`, redeploy the project.
- Videos are 720p web encodes of the 2026-11-21 showreel run (masters in `ICON Studio/00_Studio_Ops/showreel/2026-11-21_run/`).

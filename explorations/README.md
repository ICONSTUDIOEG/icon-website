# Explorations: how to publish a post

Each post is two things: one entry in `posts.json` and one Markdown file in `posts/`.

## 1. Write the post
Create `posts/<slug>.md`. The slug uses lowercase letters, digits and hyphens only, for example `ai-and-arabic-lip-sync.md`.

Write normal Markdown: paragraphs, `## Headings`, **bold**, lists, `> quotes`, links and images.

To embed a film, put it on its own line:

```
[vimeo:1171193066]
[youtube:dQw4w9WgXcQ]
```

## 2. Add a cover
Put a 1280×720 JPG in `covers/`, for example `covers/ai-and-arabic-lip-sync.jpg`.

## 3. Register it in posts.json
Add an entry (newest posts appear first, sorted by `date`):

```json
{
  "slug": "ai-and-arabic-lip-sync",
  "title": "AI and Arabic lip-sync",
  "category": "AI R&D",
  "date": "2026-12-01",
  "author": "Ashraf Ahmed",
  "lang": "en",
  "excerpt": "One or two sentences shown on the card.",
  "cover": "covers/ai-and-arabic-lip-sync.jpg",
  "minutes": 5
}
```

- `lang: "ar"` sets the post right to left with the Arabic typeface.
- `"draft": true` keeps a post out of the list until you remove it.
- A new `category` value becomes a new filter chip automatically.

## 4. Publish
Commit and merge into `main`. The deploy workflow publishes the whole `explorations/` folder, so there is no file list to update.

The post's address is `https://www.iconstudio.tech/explorations/post.html?p=<slug>`.

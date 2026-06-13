# Logo para el preview al compartir links (Open Graph)

Poné acá el logo de Bochile con este nombre EXACTO:

    public/og/bochile-og.jpg     (también vale .png o .jpeg)

Apenas exista el archivo, `scripts/prerender-og.cjs` lo usa como miniatura en
TODOS los previews de propiedad al compartir el link (WhatsApp, Instagram, etc.).
Si no está, el preview cae a la foto de cada propiedad (no se rompe).

## Recomendado
- Tamaño ideal: **1200 × 630 px** (formato banner de WhatsApp/Facebook).
- El logo centrado sobre el fondo oscuro de marca queda perfecto.
- Si la imagen es chica/cuadrada, WhatsApp la muestra como miniatura chica (igual funciona).

Después de agregarlo: commit + push + **Manual Deploy en Render** ("Clear build cache & deploy").
Y para que WhatsApp refresque el preview viejo: pasarlo por
https://developers.facebook.com/tools/debug/ → "Scrape Again".

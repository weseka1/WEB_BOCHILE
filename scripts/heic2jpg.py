#!/usr/bin/env python3
# Convierte un arbol de carpetas con fotos (HEIC del iPhone / JPG / PNG) a
# ./rental-photos/<carpeta>/NN.jpg, listo para scripts/import-rentals.cjs.
# Excluye flyers de marketing ("PLANT DE REDES"). Idempotente (re-numera de 0).
#
# Uso:
#   python scripts/heic2jpg.py "C:/ruta/a/Disponibles"
#   python scripts/heic2jpg.py "C:/ruta/a/Disponibles" --only "Cramer 830,Mitre 456"
import sys, os, shutil
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    print("⚠ pillow_heif no instalado (pip install pillow-heif) — los HEIC fallarán")
from PIL import Image

if len(sys.argv) < 2 or not os.path.isdir(sys.argv[1]):
    print('Uso: python scripts/heic2jpg.py <carpeta-fuente> [--only "Dir1,Dir2"]')
    sys.exit(1)

SRC = sys.argv[1]
ONLY = None
if "--only" in sys.argv:
    ONLY = set(x.strip().lower() for x in sys.argv[sys.argv.index("--only") + 1].split(","))
DST = os.path.join(os.path.dirname(__file__), "..", "rental-photos")
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".heic")

total = 0
for name in sorted(os.listdir(SRC)):
    sub = os.path.join(SRC, name)
    if not os.path.isdir(sub):
        continue
    if ONLY and name.lower() not in ONLY:
        continue
    files = sorted(f for f in os.listdir(sub)
                   if f.lower().endswith(EXTS) and "plant de redes" not in f.lower())
    if not files:
        continue
    out = os.path.join(DST, name)
    os.makedirs(out, exist_ok=True)
    i = 0
    for f in files:
        i += 1
        dst = os.path.join(out, f"{i:02d}.jpg")
        src = os.path.join(sub, f)
        try:
            Image.open(src).convert("RGB").save(dst, quality=88)
        except Exception as e:
            print(f"    ✖ {name}/{f}: {e}")
            i -= 1
    print(f"  {name}: {i} fotos")
    total += i
print(f"✔ Listo. {total} fotos en {os.path.abspath(DST)}")

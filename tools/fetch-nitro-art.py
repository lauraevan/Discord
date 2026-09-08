"""
Vendors Discord's own Nitro artwork into src/assets/nitro/.

Discord's Nitro art is served from discord.com and cdn.discordapp.com, both of
which this environment's egress policy denies, and no repo mirrors the web
client's images. The mobile client is a different story: Wumpus-Central's
Discord-Datamining-Android repo unpacks the Android APK and commits its
resources, so the same illustrations Discord ships — the plan-selection Wumpus
in his space helmet, the boost gem, the yearly-upsell scene, the gift chest and
boxes — are in a public repo raw.githubusercontent.com will serve.

The Nitro tenure badges come from Fmasterpro27/Discord-badges (MIT), which
keeps Discord's badge set committed as SVG and PNG: bronze, silver, gold,
platinum, diamond, emerald, ruby and opal, which are exactly the client's own
PREMIUM_TENURE_{1,3,6,12,24,36,60,72}_MONTH levels.

Everything is re-encoded to fit a single-file build: the illustrations come out
of the APK at up to 1800px, which is far more than a 96px card needs.

    python3 tools/fetch-nitro-art.py
"""
import io
import os
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src/assets/nitro')

APK = 'https://raw.githubusercontent.com/Wumpus-Central/Discord-Datamining-Android/main/res'
BADGES = 'https://raw.githubusercontent.com/Fmasterpro27/Discord-badges/main/assets'

# apktool files a drawable under whichever density the APK shipped it at, and
# Discord is not consistent about which that is
DENSITIES = ['drawable-xxhdpi', 'drawable-xhdpi', 'drawable-mdpi', 'drawable-nodpi', 'drawable']

# slug -> (resource name, the longest edge to keep)
ART = {
    # the plan-selection art: Wumpus in the space helmet the 2025 Nitro
    # redesign put him in, the boost gem, and the tiers either side of him
    'plan-nitro': ('images_native_premium_plan_selection_img_wumpus_nitro', 160),
    'plan-basic': ('images_native_premium_plan_selection_img_wumpus_nitro_tier_0', 160),
    'plan-classic': ('images_native_premium_plan_selection_img_wumpus_nitro_classic', 160),
    'plan-boost': ('images_native_premium_plan_selection_img_boost', 160),
    'wumpus-boost': ('images_native_premium_plan_selection_img_wumpus_nitro_boost', 160),
    # the scene Discord runs on its yearly upsell
    'yearly-upsell': ('images_native_premium_plan_selection_yearly_upsell_wumpus', 400),
    # the gift art, from the gifting flow
    'gift-chest': ('images_native_gifting_standard_chest_active', 460),
    'gift-box': ('images_native_gifting_standard_box_idle', 460),
    'gift-cake': ('images_native_gifting_standard_cake_idle', 460),
    'gift-coffee': ('images_native_gifting_standard_coffee_idle', 460),
}

# the tenure ladder, in the client's own month order
TENURE = [
    (1, 'bronze'),
    (3, 'silver'),
    (6, 'gold'),
    (12, 'platinum'),
    (24, 'diamond'),
    (36, 'emerald'),
    (60, 'ruby'),
    (72, 'opal'),
]


def get(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=90) as r:
            return r.read()
    except Exception:
        return None


def drawable(name: str) -> tuple[bytes, str]:
    """The resource, from whichever density folder the APK actually put it in."""
    for d in DENSITIES:
        raw = get(f'{APK}/{d}/{name}.png')
        if raw:
            return raw, d
    raise SystemExit(f'not found in any density: {name}')


def save(raw: bytes, path: str, edge: int) -> int:
    im = Image.open(io.BytesIO(raw)).convert('RGBA')
    if max(im.size) > edge:
        im.thumbnail((edge, edge), Image.LANCZOS)
    im.save(path, format='WEBP', quality=88, method=6)
    return os.path.getsize(path)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    total = 0

    for slug, (name, edge) in ART.items():
        raw, density = drawable(name)
        size = save(raw, os.path.join(OUT, f'{slug}.webp'), edge)
        total += size
        print(f'{slug:15} {density:16} {len(raw) // 1024:5}KB -> {size // 1024:3}KB')

    for months, gem in TENURE:
        raw = get(f'{BADGES}/nitro_badge/{gem}.png')
        if raw is None:
            raise SystemExit(f'missing tenure badge: {gem}')
        size = save(raw, os.path.join(OUT, f'tenure-{months}.webp'), 96)
        total += size
        print(f'{"tenure " + gem:15} {months:>3} months     {len(raw) // 1024:5}KB -> {size // 1024:3}KB')

    print(f'\n{len(ART) + len(TENURE)} files, {total // 1024}KB total')


if __name__ == '__main__':
    main()

"""
Vendors the artwork Discord itself ships into src/assets/, out of the Android APK.

Discord's web client pulls its images from discord.com and cdn.discordapp.com,
both of which this environment's egress policy denies. The Android client
carries the same artwork inside its APK, and Wumpus-Central's
Discord-Datamining-Android repo unpacks that APK and commits every resource, so
raw.githubusercontent.com serves the real files: the six default avatars, the
empty-state illustrations, the attachment file-type icons, every connection
platform's logo, the login splash, the sample profile banner and the eight
group-DM icons.

apktool files a drawable under whichever density the APK shipped it at, which
for Discord is usually mdpi rather than the xxhdpi you would expect, so each
resource is looked for across every density folder. Everything is re-encoded to
WebP at the size the UI actually draws it, because a single-file build pays for
every byte.

    python3 tools/fetch-android-art.py
"""
import io
import os
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'src/assets')

APK = 'https://raw.githubusercontent.com/Wumpus-Central/Discord-Datamining-Android/main/res'
DENSITIES = ['drawable-xxhdpi', 'drawable-xhdpi', 'drawable-mdpi', 'drawable-nodpi', 'drawable']

# folder -> {slug: (resource name, longest edge to keep)}
GROUPS: dict[str, dict[str, tuple[str, int]]] = {
    # the six avatars Discord hands an account that has never set one: the
    # Clyde mark on blurple, grey, green, yellow, red and pink
    'avatars': {
        f'default-{i}': (f'images_native_avatars_default_avatar_{i}', 160) for i in range(6)
    },
    # the illustrations Discord runs where a list has nothing in it
    'empties': {
        'no-text-channels': ('images_native_empties_empty_channel_no_text_channels_dark', 320),
        'search': ('images_native_empties_search_empty_state_dark', 320),
        'no-results': ('modules_messages_images_noresults', 320),
    },
    # the badge on an attachment card, one per file family
    'files': {
        name.rsplit('_', 1)[-1]: (name, 64)
        for name in [
            'images_native_icons_ic_file_small_acrobat',
            'images_native_icons_ic_file_small_ae',
            'images_native_icons_ic_file_small_ai',
            'images_native_icons_ic_file_small_archive',
            'images_native_icons_ic_file_small_audio',
            'images_native_icons_ic_file_small_code',
            'images_native_icons_ic_file_small_document',
            'images_native_icons_ic_file_small_image',
            'images_native_icons_ic_file_small_ps',
            'images_native_icons_ic_file_small_sketch',
            'images_native_icons_ic_file_small_spreadsheet',
            'images_native_icons_ic_file_small_unknown',
            'images_native_icons_ic_file_small_video',
            'images_native_icons_ic_file_small_webcode',
        ]
    },
    # Connections, in the order Discord's own settings page lists them.
    # _light_and_dark reads on either background, so it wins where a platform
    # ships one; a logo that still comes out too dark to see against Discord's
    # dark tile is swapped for the platform's _white cut below.
    'platforms': {
        'battlenet': ('images_platforms_img_account_sync_battlenet_light_and_dark', 96),
        'bluesky': ('images_platforms_img_account_sync_bluesky_light_and_dark', 96),
        'crunchyroll': ('images_platforms_img_account_sync_crunchyroll_light_and_dark', 96),
        'domain': ('images_platforms_img_account_sync_domain_light_and_dark', 96),
        'ebay': ('images_platforms_img_account_sync_ebay_light_and_dark', 96),
        'epic': ('images_platforms_img_account_sync_epic_dark_and_white', 96),
        'facebook': ('images_platforms_img_account_sync_facebook_light_and_dark', 96),
        'github': ('images_platforms_img_account_sync_github_white', 96),
        'instagram': ('images_platforms_img_account_sync_instagram_light_and_dark', 96),
        'leagueoflegends': ('images_platforms_img_account_sync_league_of_legends_light_and_dark', 96),
        'paypal': ('images_platforms_img_account_sync_paypal_light_and_dark', 96),
        'playstation': ('images_platforms_img_account_sync_playstation_white', 96),
        'reddit': ('images_platforms_img_account_sync_reddit_light_and_dark', 96),
        'riotgames': ('images_platforms_img_account_sync_riot_light_and_dark', 96),
        'roblox': ('images_platforms_img_account_sync_roblox_light_and_dark', 96),
        'samsung': ('images_platforms_img_account_sync_samsung_light_and_dark', 96),
        'skype': ('images_platforms_img_account_sync_skype_light_and_dark', 96),
        'spotify': ('images_platforms_img_account_sync_spotify_light_and_dark', 96),
        'steam': ('images_platforms_img_account_sync_steam_white', 96),
        'tiktok': ('images_platforms_img_account_sync_tiktok_dark', 96),
        'twitch': ('images_platforms_img_account_sync_twitch_light_and_dark', 96),
        'twitter': ('images_platforms_img_account_sync_x_white', 96),
        'xbox': ('images_platforms_img_account_sync_xbox_white', 96),
        'youtube': ('images_platforms_img_account_sync_youtube_light_and_dark', 96),
    },
    # the gate Discord puts in front of an age-restricted channel, and the
    # layout previews its forum settings show
    'gates': {
        'nsfw': ('images_native_img_nsfw_dark_theme', 240),
        'nsfw-gate': ('modules_age_gate_native_images_nsfw_gate', 300),
    },
    'forum': {
        'grid-view': ('images_native_forum_channels_channel_settings_grid_view_example_post', 320),
        'list-view': ('images_native_forum_channels_channel_settings_list_view_example_post', 320),
    },
    # the perks Discord illustrates on a boosted server's own page
    'boost': {
        'perk-streaming': ('modules_guild_boosting_native_images_top_perk_streaming_quality', 240),
        'perk-vanity': ('modules_guild_boosting_native_images_top_perk_vanity_url', 240),
    },
    # the scene behind Discord's own login and register screens
    'auth': {
        'welcome-splash': ('modules_auth_native_images_welcomesplashart', 900),
    },
    # the banner Discord shows as the example on a profile it has no art for
    'profile': {
        'banner-sample': ('modules_user_profile_images_banner_sample_banner', 640),
    },
}

# resources the index lists but the current APK may not carry; a miss here is
# reported rather than fatal
OPTIONAL = {'bluesky', 'domain', 'roblox'}


def get(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=90) as r:
            return r.read()
    except Exception:
        return None


def drawable(name: str) -> tuple[bytes, str] | None:
    """The resource, from whichever density folder the APK actually put it in."""
    for d in DENSITIES:
        raw = get(f'{APK}/{d}/{name}.png')
        if raw:
            return raw, d
    return None


def luminance(im: Image.Image) -> float:
    """Mean brightness of the logo's own pixels, ignoring what is transparent."""
    px = im.convert('RGBA').resize((32, 32), Image.LANCZOS).getdata()
    lit = [(r * 299 + g * 587 + b * 114) / 1000 for r, g, b, a in px if a > 40]
    return sum(lit) / len(lit) if lit else 0


def save(raw: bytes, path: str, edge: int) -> int:
    im = Image.open(io.BytesIO(raw)).convert('RGBA')
    if max(im.size) > edge:
        im.thumbnail((edge, edge), Image.LANCZOS)
    im.save(path, format='WEBP', quality=88, method=6)
    return os.path.getsize(path)


def main() -> None:
    total = count = 0
    missing: list[str] = []
    for folder, group in GROUPS.items():
        out = os.path.join(ASSETS, folder)
        os.makedirs(out, exist_ok=True)
        for slug, (name, edge) in group.items():
            found = drawable(name)
            if found is None:
                if slug in OPTIONAL:
                    missing.append(f'{folder}/{slug}')
                    continue
                raise SystemExit(f'not found in any density: {name}')
            raw, density = found
            if folder == 'platforms' and luminance(Image.open(io.BytesIO(raw))) < 64:
                # a near-black mark disappears on Discord's tile; the platform's
                # white cut is what the client uses there
                base = name.rsplit('_img_account_sync_', 1)[-1]
                for suffix in ('_light_and_dark', '_dark_and_white', '_light', '_dark'):
                    base = base.removesuffix(suffix)
                alt = drawable(f'images_platforms_img_account_sync_{base}_white')
                if alt:
                    raw, density = alt[0], alt[1] + ' (white)'
            size = save(raw, os.path.join(out, f'{slug}.webp'), edge)
            total += size
            count += 1
            print(f'{folder + "/" + slug:28} {density:16} {len(raw) // 1024:5}KB -> {size // 1024:3}KB')

    if missing:
        print(f'\nnot in this APK build: {", ".join(missing)}')
    print(f'\n{count} files, {total // 1024}KB total')


if __name__ == '__main__':
    main()

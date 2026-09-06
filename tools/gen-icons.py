"""
Writes src/ui/Icons.tsx from Discord's own icon components.

The client bundle names every icon it ships — each one is a webpack module
whose export is declared before it is defined, and a barrel module re-exports
the whole set under readable names. tools/extract-named-icons.py walks that
graph and writes tools/discord-named-icons.json, so an icon here is chosen by
Discord's own name for it rather than matched by silhouette against a
screenshot. The mapping below is only "which of Discord's icons goes in which
of this app's slots".
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
icons = json.load(open(os.path.join(ROOT, 'tools/discord-named-icons.json')))

# this app's name -> Discord's component name
MAP = {
    # channel list
    'HashIcon': 'TextIcon',
    # the client's own channel-type switch: GUILD_VOICE -> VoiceNormalIcon
    'SpeakerIcon': 'VoiceNormalIcon',
    'MegaphoneIcon': 'AnnouncementsIcon',
    'StageIcon': 'StageIcon',
    'ForumIcon': 'ForumIcon',
    'MediaIcon': 'ImageIcon',
    'ThreadLockIcon': 'ThreadLockIcon',
    'AtIcon': 'AtIcon',
    'TagIcon': 'TagIcon',
    'RulesIcon': 'ClipboardListIcon',
    'ThreadsIcon': 'ThreadIcon',
    'ThreadPlusIcon': 'ThreadPlusIcon',
    'ChannelCreateIcon': 'ChannelListPlusIcon',
    'BrowseChannelsIcon': 'ChannelListMagnifyingGlassIcon',
    # server header + rail
    'EventsIcon': 'CalendarIcon',
    'MembersIcon': 'GroupIcon',
    'BoostIcon': 'BoostGemIcon',
    'AddServerIcon': 'CirclePlusIcon',
    'CompassIcon': 'CompassIcon',
    'DownloadIcon': 'DownloadIcon',
    'FolderIcon': 'FolderIcon',
    # GUILD_HOME / SERVER_GUIDE -> SignPostIcon, from the same switch
    'ServerHomeIcon': 'SignPostIcon',
    # chat header + message actions
    'BellIcon': 'BellIcon',
    'BellOffIcon': 'BellSlashIcon',
    'PinIcon': 'PinIcon',
    'SearchIcon': 'MagnifyingGlassIcon',
    'InboxIcon': 'InboxIcon',
    'HelpIcon': 'CircleQuestionIcon',
    'ToolsIcon': 'StaffBadgeIcon',
    'ReplyIcon': 'ArrowAngleLeftUpIcon',
    'ReactIcon': 'ReactionPlusIcon',
    'MarkReadIcon': 'DoubleCheckmarkIcon',
    'JumpIcon': 'UploadIcon',
    'PencilIcon': 'PencilIcon',
    'TrashIcon': 'TrashIcon',
    'CopyIcon': 'CopyIcon',
    'MoreIcon': 'MoreHorizontalIcon',
    # composer
    'PlusIcon': 'PlusMediumIcon',
    'GiftIcon': 'GiftIcon',
    'GifIcon': 'GifIcon',
    'StickerIcon': 'StickerSmallIcon',
    'SmileyIcon': 'ReactionIcon',
    'AppsIcon': 'AppsIcon',
    'UploadFileIcon': 'FileUpIcon',
    'PollBarsIcon': 'PollsIcon',
    'SchedulePlusIcon': 'CalendarPlusIcon',
    'SendIcon': 'SendMessageIcon',
    # user area + voice
    'MicIcon': 'MicrophoneIcon',
    'MicOffIcon': 'MicrophoneSlashIcon',
    'HeadphonesIcon': 'HeadphonesIcon',
    'HeadphonesOffIcon': 'HeadphonesDenyIcon',
    'GearIcon': 'SettingsIcon',
    'SwitchAccountsIcon': 'UserCircleIcon',
    'AddMemberIcon': 'GroupPlusIcon',
    'VideoIcon': 'VideoIcon',
    'ScreenIcon': 'ScreenIcon',
    'PhoneHangUpIcon': 'PhoneHangUpIcon',
    # window + chrome
    'MinimizeIcon': 'MinusIcon',
    'MaximizeIcon': 'PanelClosedIcon',
    'ExpandIcon': 'MaximizeIcon',
    'CloseIcon': 'XLargeIcon',
    'CloseSmallIcon': 'XSmallIcon',
    'CheckIcon': 'CheckmarkLargeBoldIcon',
    'CheckSmallIcon': 'CheckmarkSmallIcon',
    'ChevronDownIcon': 'ChevronSmallDownIcon',
    'ChevronRightIcon': 'ChevronSmallRightIcon',
    'ChevronLeftIcon': 'ChevronSmallLeftIcon',
    'CaretIcon': 'ChevronLargeDownIcon',
    'ClydeIcon': 'ClydeIcon',
    'VerifiedIcon': 'ShieldIcon',
    'SparkleIcon': 'SparklesIcon',
    # nitro, quests, shop
    'NitroIcon': 'NitroWheelIcon',
    'QuestsIcon': 'QuestsIcon',
    'OrbsIcon': 'OrbsIcon',
    'ShopIcon': 'ShopIcon',
    'ShopSparkleIcon': 'ShopSparkleIcon',
    'HeartIcon': 'HeartIcon',
    'HeartOutlineIcon': 'HeartOutlineIcon',
    'TrophyIcon': 'TrophyIcon',
    'ClockIcon': 'ClockIcon',
    'PlayIcon': 'PlayIcon',
    'PauseIcon': 'PauseIcon',
    'CirclePlayIcon': 'CirclePlayIcon',
    'GameControllerIcon': 'GameControllerIcon',
    'CreditCardIcon': 'CreditCardIcon',
    'SubscriptionIcon': 'SubscriptionIcon',
    'StarIcon': 'StarIcon',
    'LockIcon': 'LockIcon',
    'FireIcon': 'FireIcon',
    'TicketIcon': 'TicketIcon',
    'GlobeEarthIcon': 'GlobeEarthIcon',
    'FriendsIcon': 'FriendsIcon',
    'UserIcon': 'UserIcon',
    'MedalIcon': 'MedalIcon',
    'CircleCheckIcon': 'CircleCheckIcon',
    'CircleInformationIcon': 'CircleInformationIcon',
    'ArrowRightIcon': 'ArrowSmallRightIcon',
}

ALIASES = {
    'MemberListIcon': 'MembersIcon',
    'ThreadsChannelIcon': 'ThreadsIcon',
    'CalendarIcon': 'EventsIcon',
    'EditServerProfileIcon': 'PencilIcon',
}

missing = [n for n in MAP.values() if n not in icons]
if missing:
    raise SystemExit(f'not in the bundle: {missing}')

lines = []
w = lines.append
w('''/**
 * The icon set, taken from Discord's own client.
 *
 * These were hand-drawn from screenshots once, which is guesswork at 15px, and
 * then matched by silhouette against every glyph in the shipped bundle, which
 * still left the choice between near-identical glyphs to the eye. They are now
 * looked up by Discord's own name for each component: the bundle declares
 * every icon module's export before defining it, and a barrel re-exports the
 * set under readable names, so the name and the geometry can be joined through
 * the module graph. See tools/extract-named-icons.py and
 * docs/discord-reference.md.
 *
 * Generated by tools/gen-icons.py — edit the mapping there, not this file.
 */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

/** One glyph: the viewBox it was drawn on, and its subpaths. */
type Glyph = { box: number; paths: [d: string, evenodd?: 1][] }

const glyph = (g: Glyph) =>
  function Icon({ size = 24, ...rest }: P) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${g.box} ${g.box}`}
        fill="none"
        aria-hidden="true"
        {...rest}
      >
        {g.paths.map(([d, eo], i) => (
          <path
            key={i}
            fill="currentColor"
            fillRule={eo ? 'evenodd' : 'nonzero'}
            clipRule={eo ? 'evenodd' : undefined}
            d={d}
          />
        ))}
      </svg>
    )
  }
''')

for name in sorted(MAP):
    src = MAP[name]
    data = icons[src]
    box = data['size'][0]
    w(f'/** Discord\'s {src} */')
    w(f'export const {name} = glyph({{')
    w(f'  box: {box},')
    w('  paths: [')
    for d, eo in data['paths']:
        esc = d.replace('\\', '\\\\').replace("'", "\\'")
        w(f"    ['{esc}'{', 1' if eo else ''}],")
    w('  ],')
    w('})')
    w('')

w('/* the same glyph under the name the call site reads better with */')
for alias, target in sorted(ALIASES.items()):
    w(f'export {{ {target} as {alias} }}')

out = os.path.join(ROOT, 'src/ui/Icons.tsx')
open(out, 'w').write('\n'.join(lines) + '\n')
print(f'{len(MAP)} icons + {len(ALIASES)} aliases -> {out}')

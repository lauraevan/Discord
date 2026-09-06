"""
Writes src/ui/Icons.tsx from Discord's own icon geometry.

The mapping was established by template-matching each icon in the reference
frames against every 24x24 glyph in the shipped client bundle, then checking
the winners by eye; see docs/discord-reference.md. Anything still hand-drawn
is listed at the bottom of this file and kept as it was.
"""
import json

SP = '/tmp/claude-0/-home-user-Discord/d79a875f-de4b-540c-a828-cbd4c5853547/scratchpad'
icons = json.load(open(f'{SP}/dicons.json'))

MAP = {
    # confirmed against the reference frames
    'HashIcon': 596, 'SpeakerIcon': 639, 'EventsIcon': 334, 'BrowseChannelsIcon': 339,
    'MembersIcon': 444, 'BoostIcon': 321, 'ThreadsIcon': 603, 'BellIcon': 309,
    'PinIcon': 528, 'SearchIcon': 489, 'InboxIcon': 467, 'ToolsIcon': 579,
    'AddServerIcon': 368, 'CompassIcon': 383, 'DownloadIcon': 398, 'PlusIcon': 534,
    'GiftIcon': 438, 'GifIcon': 437, 'StickerIcon': 589, 'SmileyIcon': 99,
    'AppsIcon': 290, 'HeadphonesIcon': 451, 'GearIcon': 563,
    # 127 is mute-with-noise-suppression; its second path is the sparkle that
    # marks that feature, and the reference's mute button does not carry it
    'MicOffIcon': (127, [0, 2]),
    'AddMemberIcon': 445, 'UploadFileIcon': 418, 'ThreadPlusIcon': 605,
    'PollBarsIcon': 536, 'SchedulePlusIcon': 335, 'SwitchAccountsIcon': 623,
    'ChevronRightIcon': 362, 'ChevronDownIcon': 360, 'ClydeIcon': 381,
    'ChannelCreateIcon': 340,
    # identified from the contact sheets
    'BellOffIcon': 310, 'CheckIcon': 352, 'CloseIcon': 351, 'CopyIcon': 273,
    'ExpandIcon': 492, 'FolderIcon': 426, 'HelpIcon': 369, 'HeadphonesOffIcon': 450,
    'MicIcon': 497, 'MoreIcon': 504, 'ReplyIcon': 294, 'RulesIcon': 260,
    'SendIcon': 560, 'SparkleIcon': 577, 'StageIcon': 580, 'TrashIcon': 613,
    'VerifiedIcon': 567, 'VideoIcon': 633, 'MegaphoneIcon': 286, 'MarkReadIcon': 396,
    'ForumIcon': 344, 'ReactIcon': 346, 'JumpIcon': 621, 'MaximizeIcon': 516,
    'MinimizeIcon': 500, 'CaretIcon': 356,
}

ALIASES = {
    'MemberListIcon': 'MembersIcon',
    'ThreadsChannelIcon': 'ThreadsIcon',
    'CalendarIcon': 'EventsIcon',
}

# no confident match in the bundle; these stay as drawn
KEPT = ['ServerHomeIcon', 'PencilIcon', 'EditServerProfileIcon']

lines = []
w = lines.append
w('''/**
 * The icon set, taken from Discord's own client.
 *
 * These used to be hand-drawn from screenshots, which is guesswork at 15px —
 * the channel hash was nearly twice the right stroke weight, Add-a-Server and
 * Discover were rings where Discord fills them, Browse Channels was missing
 * its magnifier, and the title bar's third action was the wrong glyph
 * entirely. Every path below is Discord's, lifted from the shipped bundle and
 * matched to the reference frames by silhouette; see docs/discord-reference.md
 * for how the mapping was established.
 */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 24, children, ...rest }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

/** One glyph: its subpaths, and whether each is drawn with the even-odd rule. */
type Glyph = [d: string, evenodd?: 1][]

const glyph = (g: Glyph) =>
  function Icon(p: P) {
    return (
      <Svg {...p}>
        {g.map(([d, eo], i) => (
          <path
            key={i}
            fill="currentColor"
            fillRule={eo ? 'evenodd' : 'nonzero'}
            clipRule={eo ? 'evenodd' : undefined}
            d={d}
          />
        ))}
      </Svg>
    )
  }
''')

for name in sorted(MAP):
    spec = MAP[name]
    idx, keep = spec if isinstance(spec, tuple) else (spec, None)
    ic = icons[idx]
    paths = ic['paths'] if keep is None else [ic['paths'][k] for k in keep]
    parts = ',\n  '.join(
        "['" + p['d'] + "'" + (', 1]' if p['evenodd'] else ']') for p in paths
    )
    w(f'export const {name} = glyph([\n  {parts},\n])\n')

for alias, target in ALIASES.items():
    w(f'export {{ {target} as {alias} }}\n')

open('src/ui/Icons.generated.tsx', 'w').write('\n'.join(lines))
print(f'wrote {len(MAP)} icons + {len(ALIASES)} aliases; still hand-drawn: {KEPT}')

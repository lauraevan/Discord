/**
 * The badge Discord puts next to a server's name.
 *
 * All of this is the client's own: the rosette is its FlowerStar, path for
 * path; the marks inside are its checkmark, handshake, wand and hub glyphs;
 * and the order below is the order its GuildBadge component tests features in.
 * A server that is none of these gets no badge at all — being a Community
 * server is not one of them, which is why most servers show nothing here.
 */

export type GuildFeature =
  | 'VERIFIED'
  | 'PARTNERED'
  | 'COMMUNITY'
  | 'DISCOVERABLE'
  | 'HUB'
  | 'INTERNAL_EMPLOYEE_ONLY'

/** Discord's FlowerStar: the scalloped disc every guild badge is set into. */
const FLOWER =
  'M5.52995 0.431867C6.27995 0.181867 7.2 1.23199 8 1.23199C8.8 1.23199 9.75007 0.231867 ' +
  '10.4701 0.431867C11.19 0.631965 11.38 2.07173 12 2.52171C12.62 2.9717 14.0003 2.70184 ' +
  '14.4603 3.32184C14.9199 3.94191 14.2303 5.16178 14.4603 5.91169C14.6903 6.66159 15.9998 ' +
  '7.21166 16 8.00153C16 8.79146 14.72 9.38146 14.4798 10.0914C14.2398 10.8014 14.9198 ' +
  '12.0919 14.4798 12.6819C14.0397 13.2716 12.6401 13.0321 12.0202 13.482C11.4002 13.932 ' +
  '11.2298 15.3219 10.4798 15.5719C9.72987 15.8216 8.80967 14.7717 8.00973 14.7717C7.2098 ' +
  '14.7719 6.25964 15.7718 5.53971 15.5719C4.81995 15.3716 4.61982 13.9321 4 13.482C3.38 ' +
  '13.032 1.99971 13.3019 1.53971 12.6819C1.07975 12.0619 1.76971 10.8414 1.53971 10.0914C' +
  '1.30939 9.34159 0 8.79139 0 8.00153C0.000177681 7.21159 1.2802 6.62163 1.52018 5.91169C' +
  '1.76012 5.20167 1.08021 3.91183 1.52018 3.32184C1.96018 2.73184 3.36999 3.0017 4 2.52171C' +
  '4.62997 2.04173 4.78003 0.681954 5.52995 0.431867Z'

/** The check Discord sets into a verified or verified-and-partnered badge. */
const CHECK = 'M18.7 7.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l3.3 3.29 7.3-7.3a1 1 0 0 1 1.4 0Z'

/** The handshake it sets into a partnered one. */
const HANDSHAKE = [
  'M10.5906 6.39993L9.19223 7.29993C8.99246 7.39993 8.89258 7.39993 8.69281 7.29993C8.59293 ' +
    '7.19993 8.39317 7.09993 8.29328 6.99993C7.89375 6.89993 7.5941 6.99993 7.29445 7.19993L6.79504 ' +
    '7.49993L4.29797 9.19993C3.69867 9.49993 2.99949 9.39993 2.69984 8.79993C2.30031 8.29993 2.50008 ' +
    '7.59993 2.99949 7.19993L6.09586 5.19993C6.69516 4.79993 7.29445 4.59993 7.99363 4.59993C8.29328 ' +
    '4.59993 8.49304 4.59993 8.79269 4.69993C9.59176 4.89993 10.191 5.29993 10.6904 5.89993C10.7903 ' +
    '6.09993 10.6904 6.29993 10.5906 6.39993Z',
  'M13.4871 7.79985C13.4871 8.19985 13.2874 8.59985 12.9877 8.79985L9.89135 10.7999C9.29206 ' +
    '11.1999 8.69276 11.3999 7.99358 11.3999C7.69393 11.3999 7.49417 11.3999 7.19452 11.2999C6.39545 ' +
    '11.0999 5.79616 10.6999 5.29674 10.0999C5.19686 9.89985 5.29674 9.69985 5.39663 9.59985L6.79499 ' +
    '8.69985C6.89487 8.59985 7.09464 8.59985 7.19452 8.69985C7.29441 8.79985 7.49417 8.89985 7.59406 ' +
    '8.99985C7.99358 9.09985 8.29323 8.99985 8.59288 8.79985L11.6893 6.79985C12.2886 6.39985 12.9877 ' +
    '6.59985 13.2874 7.19985C13.4871 7.39985 13.4871 7.59985 13.4871 7.79985Z',
]

/** The nodes it sets into a Student Hub's. */
const HUB = 'M13 7.83a3 3 0 1 0-2 0V11H8a4 4 0 0 0-4 4v1.17a3 3 0 1 0 2 0V15c0-1.1.9-2 2-2h3v3.17a3 3 0 1 0 2 0V13h3a2 2 0 0 1 2 2v1.17a3 3 0 1 0 2 0V15a4 4 0 0 0-4-4h-3V7.83Z'

/** The wand it sets into a Discord staff server's. */
const WAND = 'M2 20.59V19.4a1 1 0 0 1 .3-.7l2.4-2.42a1 1 0 0 1 .71-.29H6l9-9-.85-.85a1 1 0 0 1-.23-.34l-1.49-3.73a.5.5 0 0 1 .65-.65l3.73 1.5a1 1 0 0 1 .34.22l.64.64a1 1 0 0 1 1.42 0l1 1a1 1 0 0 1 0 1.42l1.58 1.58a1 1 0 0 1 0 1.42l-1.58 1.58a1 1 0 0 1-1.42 0L17 9l-9 9v.59a1 1 0 0 1-.3.7l-2.4 2.42a1 1 0 0 1-.71.29H3.4a1 1 0 0 1-.7-.3l-.42-.4a1 1 0 0 1-.29-.71Z'

type Mark = { paths: string[]; box: number; label: string }

const MARKS: Record<string, Mark> = {
  staff: { paths: [WAND], box: 24, label: 'Discord staff server' },
  hub: { paths: [HUB], box: 24, label: 'Student hub' },
  verified: { paths: [CHECK], box: 24, label: 'Verified' },
  both: { paths: [CHECK], box: 24, label: 'Verified and partnered' },
  partnered: { paths: HANDSHAKE, box: 16, label: 'Discord partner' },
}

/** Discord's own order of tests, top to bottom. */
function markFor(features: readonly GuildFeature[] | undefined) {
  const f = new Set(features ?? [])
  if (f.has('INTERNAL_EMPLOYEE_ONLY')) return MARKS.staff
  if (f.has('HUB')) return MARKS.hub
  if (f.has('VERIFIED') && f.has('PARTNERED')) return MARKS.both
  if (f.has('VERIFIED')) return MARKS.verified
  if (f.has('PARTNERED')) return MARKS.partnered
  return null
}

export function GuildBadge({
  features,
  size = 14,
  className,
}: {
  features?: readonly GuildFeature[]
  size?: number
  className?: string
}) {
  const mark = markFor(features)
  if (!mark) return null
  return (
    <span
      className={'guild-badge' + (className ? ' ' + className : '')}
      style={{ width: size, height: size }}
      role="img"
      aria-label={mark.label}
    >
      <svg className="guild-badge-star" viewBox="0 0 16 16">
        <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d={FLOWER} />
      </svg>
      <svg className="guild-badge-mark" viewBox={`0 0 ${mark.box} ${mark.box}`}>
        {mark.paths.map((d) => (
          <path key={d} fill="currentColor" d={d} />
        ))}
      </svg>
    </span>
  )
}

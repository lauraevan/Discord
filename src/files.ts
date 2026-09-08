/**
 * File attachments.
 *
 * The class table below is Discord's own, lifted out of the shipped bundle:
 * a list of rules tried in order, each matching either the MIME type or the
 * file name, with "unknown" when nothing matches. The badge drawn for each
 * class is Discord's own file, vendored out of the Android APK by
 * tools/fetch-android-art.py — the client calls them ic_file_small_*.
 */

const icons = import.meta.glob('./assets/files/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

type Rule = { type?: RegExp; name?: RegExp; klass: string }

/** Discord's own rules, in Discord's own order — the first match wins. */
const RULES: Rule[] = [
  { type: /^image\/vnd.adobe.photoshop/, klass: 'ps' },
  { type: /^image\/svg\+xml/, klass: 'webcode' },
  { type: /^image\//, klass: 'image' },
  { type: /^video\//, klass: 'video' },
  { name: /\.pdf$/, klass: 'acrobat' },
  { name: /\.ae/, klass: 'ae' },
  { name: /\.sketch$/, klass: 'sketch' },
  { name: /\.ai$/, klass: 'ai' },
  { name: /\.(?:rar|zip|7z|tar|tar\.gz)$/, klass: 'archive' },
  {
    name: /\.(?:c\+\+|cpp|cc|c|h|hpp|mm|m|json|js|ts|rb|rake|py|asm|fs|pyc|dtd|cgi|bat|rss|java|graphml|idb|lua|o|gml|prl|sls|conf|cmake|make|sln|vbe|cxx|wbf|vbs|r|wml|php|bash|applescript|fcgi|yaml|ex|exs|sh|ml|actionscript)$/,
    klass: 'code',
  },
  { name: /\.(?:txt|rtf|doc|docx|md|pages|ppt|pptx|pptm|key|log)$/, klass: 'document' },
  { name: /\.(?:xls|xlsx|numbers|csv)$/, klass: 'spreadsheet' },
  { name: /\.(?:html|xhtml|htm|xml|xsd|css|styl)$/, klass: 'webcode' },
  { name: /\.(?:mp3|ogg|opus|wav|aiff|flac)$/, klass: 'audio' },
]

/** Discord's getFileType: the class a file belongs to. */
export function fileClass(name: string, type?: string) {
  const lower = name?.toLowerCase() ?? ''
  const hit = RULES.find((r) =>
    r.type != null && type != null ? r.type.test(type) : r.name != null && lower !== '' && r.name.test(lower),
  )
  return hit?.klass ?? 'unknown'
}

/** The badge Discord draws for a file, as a URL. */
export const fileIcon = (name: string, type?: string) =>
  icons[`./assets/files/${fileClass(name, type)}.webp`] ?? icons['./assets/files/unknown.webp']

/** A GIF, which Discord badges and lets you favourite. */
export const isGif = (name: string, type?: string) =>
  type === 'image/gif' || /\.gif$/i.test(name)

/** Whether the client previews a file inline rather than carding it. */
export const isImage = (name: string, type?: string) => fileClass(name, type) === 'image'

/**
 * Discord's size line, which counts in powers of ten and keeps one decimal
 * once it reaches a megabyte: "743.55 KB", "1.5 MB".
 */
export function fileSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let u = 0
  while (n >= 1000 && u < units.length - 1) {
    n /= 1000
    u += 1
  }
  const digits = u === 0 ? 0 : n < 10 ? 2 : 1
  return `${n.toFixed(digits)} ${units[u]}`
}

import { useEffect, useRef, useState } from 'react'
import { initialsOf, serverColors, uid, type Category, type Channel } from '../data'
import { ChevronRightIcon, CloseIcon, GlobeEarthIcon, MembersIcon } from '../ui/Icons'
import { Slide, Slides } from '../ui/Slides'

/**
 * Create a server — Discord's own three steps.
 *
 *   1. "Create a server"          pick Create My Own, or a template
 *   2. "Tell us more about your server"  friends, or a club or community
 *   3. "Customize your server"    icon + name, then Create
 *
 * Step 2 is skippable, exactly as Discord's is, and every step but the first
 * has a Back button. The template list is Discord's; each one lays the new
 * server out with the categories that template uses, on top of the #general
 * text channel and General voice channel every new server gets.
 */

export type Template = {
  id: string
  name: string
  emoji: string
  categories: Category[]
  channels: { name: string; kind: Channel['kind']; categoryId: string }[]
}

const TEXT: Category = { id: 'text', name: 'Text Channels' }
const VOICE: Category = { id: 'voice', name: 'Voice Channels' }
const INFO: Category = { id: 'info', name: 'Information' }

const base = (extraText: string[], voice: string[], info?: string[]): Template['channels'] => [
  ...(info ?? []).map((name) => ({ name, kind: 'text' as const, categoryId: 'info' })),
  { name: 'general', kind: 'text' as const, categoryId: 'text' },
  ...extraText.map((name) => ({ name, kind: 'text' as const, categoryId: 'text' })),
  { name: 'General', kind: 'voice' as const, categoryId: 'voice' },
  ...voice.map((name) => ({ name, kind: 'voice' as const, categoryId: 'voice' })),
]

export const TEMPLATES: Template[] = [
  {
    id: 'gaming',
    name: 'Gaming',
    emoji: '🎮',
    categories: [TEXT, VOICE],
    channels: base(['clips-and-highlights', 'looking-for-group'], ['Lobby', 'Gaming']),
  },
  {
    id: 'school-club',
    name: 'School Club',
    emoji: '📚',
    categories: [INFO, TEXT, VOICE],
    channels: base(['off-topic'], ['Club Meeting'], ['welcome-and-rules', 'announcements']),
  },
  {
    id: 'study-group',
    name: 'Study Group',
    emoji: '📖',
    categories: [INFO, TEXT, VOICE],
    channels: base(['homework-help', 'resources'], ['Study Hall'], ['welcome-and-rules']),
  },
  {
    id: 'friends',
    name: 'Friends',
    emoji: '👋',
    categories: [TEXT, VOICE],
    channels: base(['memes', 'plans'], ['Hangout']),
  },
  {
    id: 'artists',
    name: 'Artists & Creators',
    emoji: '🎨',
    categories: [INFO, TEXT, VOICE],
    channels: base(['showcase', 'feedback'], ['Studio'], ['welcome-and-rules']),
  },
  {
    id: 'community',
    name: 'Local Community',
    emoji: '🏘️',
    categories: [INFO, TEXT, VOICE],
    channels: base(['events', 'off-topic'], ['Town Hall'], ['welcome-and-rules', 'announcements']),
  },
]

export type NewServer = {
  name: string
  color: string
  /** an uploaded icon, as a data URL */
  icon?: string
  template: Template | null
  /** Discord's "is this for friends, or a community?" answer */
  intent: 'friends' | 'community' | null
}

type Step = 'template' | 'intent' | 'customize' | 'join'

export function CreateServerFlow({
  suggestedName,
  onClose,
  onCreate,
  onJoin,
}: {
  suggestedName: string
  onClose: () => void
  onCreate: (server: NewServer) => void
  onJoin: (invite: string) => void
}) {
  const [step, setStep] = useState<Step>('template')
  const [template, setTemplate] = useState<Template | null>(null)
  const [intent, setIntent] = useState<'friends' | 'community' | null>(null)
  const [name, setName] = useState(suggestedName)
  const [color, setColor] = useState(serverColors[0])
  const [icon, setIcon] = useState<string | undefined>()
  const [invite, setInvite] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const pick = (t: Template | null) => {
    setTemplate(t)
    setStep('intent')
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="cs" onMouseDown={(e) => e.stopPropagation()}>
        <button className="cs-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        {/* Discord's stepped modal: the shell resizes while the steps slide
            past each other, forwards or back depending on which way the
            index moved */}
        <Slides active={step}>
          <Slide id="template">
              <div className="cs-head">
                <h2>Create a server</h2>
                <p>
                  Your server is where you and your friends hang out. Make yours and start talking.
                </p>
              </div>
              <div className="cs-body">
                <button className="cs-own" onClick={() => pick(null)}>
                  <span className="cs-own-art" aria-hidden>
                    ✨
                  </span>
                  <span className="cs-own-name">Create My Own</span>
                  <ChevronRightIcon />
                </button>
                <h3 className="cs-section">Start from a template</h3>
                <div className="cs-templates">
                  {TEMPLATES.map((t) => (
                    <button key={t.id} className="cs-template" onClick={() => pick(t)}>
                      <span className="cs-template-art" aria-hidden>
                        {t.emoji}
                      </span>
                      <span className="cs-template-name">{t.name}</span>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
              </div>
              <div className="cs-foot cs-foot-center">
                <span>Have an invite already?</span>
                <button className="btn-secondary" onClick={() => setStep('join')}>
                  Join a Server
                </button>
              </div>
          </Slide>
          <Slide id="intent">
              <div className="cs-head">
                <h2>Tell us more about your server</h2>
                <p>
                  In order to help you with your setup, is your new server for just a few friends or
                  a larger community?
                </p>
              </div>
              <div className="cs-body">
                <button
                  className="cs-intent"
                  onClick={() => {
                    setIntent('friends')
                    setStep('customize')
                  }}
                >
                  <MembersIcon />
                  <span>For me and my friends</span>
                  <ChevronRightIcon />
                </button>
                <button
                  className="cs-intent"
                  onClick={() => {
                    setIntent('community')
                    setStep('customize')
                  }}
                >
                  <GlobeEarthIcon />
                  <span>For a club or community</span>
                  <ChevronRightIcon />
                </button>
                <p className="cs-skip">
                  Not sure? You can{' '}
                  <button className="cs-inline-link" onClick={() => setStep('customize')}>
                    skip this question
                  </button>{' '}
                  for now.
                </p>
              </div>
              <div className="cs-foot">
                <button className="btn-ghost" onClick={() => setStep('template')}>
                  Back
                </button>
              </div>
          </Slide>
          <Slide id="customize">
            <Customize
              name={name}
              color={color}
              icon={icon}
              onName={setName}
              onColor={setColor}
              onIcon={setIcon}
              onBack={() => setStep(template || intent ? 'intent' : 'template')}
              onCreate={() => onCreate({ name: name.trim(), color, icon, template, intent })}
            />
          </Slide>
          <Slide id="join">
              <div className="cs-head">
                <h2>Join a Server</h2>
                <p>Enter an invite below to join an existing server</p>
              </div>
              <div className="cs-body">
                <label className="field-label" htmlFor="cs-invite">
                  Invite link
                </label>
                <input
                  id="cs-invite"
                  className="field"
                  autoFocus
                  value={invite}
                  placeholder="https://discord.gg/hTKzmak"
                  onChange={(e) => setInvite(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && invite.trim() && onJoin(invite.trim())}
                />
                <div className="cs-invite-hint">
                  <b>Invites should look like</b>
                  <span>hTKzmak</span>
                  <span>https://discord.gg/hTKzmak</span>
                  <span>https://discord.gg/cool-people</span>
                </div>
              </div>
              <div className="cs-foot">
                <button className="btn-ghost" onClick={() => setStep('template')}>
                  Back
                </button>
                <button
                  className="btn-primary"
                  disabled={!invite.trim()}
                  onClick={() => onJoin(invite.trim())}
                >
                  Join Server
                </button>
              </div>
          </Slide>
        </Slides>
      </div>
    </div>
  )
}

function Customize({
  name,
  color,
  icon,
  onName,
  onColor,
  onIcon,
  onBack,
  onCreate,
}: {
  name: string
  color: string
  icon?: string
  onName: (v: string) => void
  onColor: (v: string) => void
  onIcon: (v: string) => void
  onBack: () => void
  onCreate: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => input.current?.focus(), [])

  /** Discord's icon picker takes an image and shows it in the circle. */
  const pick = (f: File | undefined) => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => onIcon(String(r.result))
    r.readAsDataURL(f)
  }
  return (
    <>
      <div className="cs-head">
        <h2>Customize your server</h2>
        <p>
          Give your new server a personality with a name and an icon. You can always change it
          later.
        </p>
      </div>
      <div className="cs-body">
        <div className="cs-icon-row">
          <button
            className={'cs-icon' + (icon ? ' has-icon' : '')}
            style={icon ? undefined : { background: color }}
            onClick={() => file.current?.click()}
            aria-label="Upload a server icon"
          >
            {icon ? <img src={icon} alt="" /> : initialsOf(name || 'S')}
            <span className="cs-icon-badge" aria-hidden>
              +
            </span>
          </button>
          <input
            ref={file}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>
        <div className="cs-swatches">
          {serverColors.map((c) => (
            <button
              key={c}
              className={'cs-swatch' + (c === color ? ' on' : '')}
              style={{ background: c }}
              onClick={() => onColor(c)}
              aria-label={`Icon colour ${c}`}
            />
          ))}
        </div>
        <label className="field-label" htmlFor="cs-name">
          Server name
        </label>
        <input
          id="cs-name"
          ref={input}
          className="field"
          maxLength={100}
          value={name}
          onChange={(e) => onName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onCreate()}
        />
        <p className="cs-terms">
          By creating a server, you agree to Discord’s <a href="#guidelines">Community Guidelines</a>.
        </p>
      </div>
      <div className="cs-foot">
        <button className="btn-ghost" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" disabled={!name.trim()} onClick={onCreate}>
          Create
        </button>
      </div>
    </>
  )
}

/** Build the channel/category lists a chosen template produces. */
export function applyTemplate(t: Template | null) {
  if (!t)
    return {
      categories: [TEXT, VOICE],
      channels: [
        { id: uid('ch'), name: 'general', kind: 'text' as const, categoryId: 'text' },
        { id: uid('ch'), name: 'General', kind: 'voice' as const, categoryId: 'voice' },
      ],
    }
  return {
    categories: t.categories,
    channels: t.channels.map((c) => ({ id: uid('ch'), ...c })),
  }
}

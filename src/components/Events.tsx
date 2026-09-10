import { useState } from 'react'
import { uid, type Server, type ServerEvent } from '../data'
import { CalendarIcon, CloseIcon, SpeakerIcon, StageIcon } from '../ui/Icons'

/**
 * Discord's Events surface — the one behind the sidebar's Events row.
 *
 * The shape is Discord's guild_scheduled_event: a name, a topic, a start and
 * optional end, and somewhere it happens, which is either a voice or stage
 * channel or the free-text "Somewhere Else". Every label here is Discord's
 * own, out of docs/sources/discord-strings.json — "Upcoming Server Events",
 * "There are no upcoming events.", "Create Event", "Event Topic",
 * "Start Date", "Start Time", "End Date", "End Time", "Location",
 * "Somewhere Else", "Interested".
 */
export function EventsPage({
  server,
  self,
  onPatch,
  onClose,
}: {
  server: Server
  self: string
  onPatch: (fn: (s: Server) => Server, audit?: { action: string; target: string }) => void
  onClose: () => void
}) {
  const [making, setMaking] = useState(false)
  const events = [...(server.events ?? [])].sort((a, b) => a.start - b.start)

  const rsvp = (id: string) =>
    onPatch((s) => ({
      ...s,
      events: (s.events ?? []).map((e) =>
        e.id === id
          ? {
              ...e,
              interested: e.interested.includes(self)
                ? e.interested.filter((h) => h !== self)
                : [...e.interested, self],
            }
          : e,
      ),
    }))

  return (
    <div className="events">
      <div className="events-head">
        <h2>Upcoming Server Events</h2>
        <div className="events-head-acts">
          <button className="btn-primary" onClick={() => setMaking(true)}>
            Create Event
          </button>
          <button className="events-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
      </div>

      {events.length ? (
        <div className="events-list">
          {events.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              server={server}
              mine={e.interested.includes(self)}
              onRsvp={() => rsvp(e.id)}
              onDelete={() =>
                onPatch(
                  (s) => ({ ...s, events: (s.events ?? []).filter((x) => x.id !== e.id) }),
                  { action: 'Event deleted', target: e.name },
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="events-empty">
          <CalendarIcon />
          <p>There are no upcoming events.</p>
        </div>
      )}

      {making ? (
        <CreateEvent
          server={server}
          onClose={() => setMaking(false)}
          onCreate={(e) =>
            onPatch((s) => ({ ...s, events: [...(s.events ?? []), e] }), {
              action: 'Event created',
              target: e.name,
            })
          }
        />
      ) : null}
    </div>
  )
}

const when = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

function EventCard({
  event,
  server,
  mine,
  onRsvp,
  onDelete,
}: {
  event: ServerEvent
  server: Server
  mine: boolean
  onRsvp: () => void
  onDelete: () => void
}) {
  const channel = server.channels.find((c) => c.id === event.channelId)
  return (
    <div className="event-card">
      <div className="event-when">{when(event.start)}</div>
      <h3>{event.name}</h3>
      {event.description ? <p className="event-topic">{event.description}</p> : null}
      <div className="event-where">
        {channel ? (
          <>
            {channel.kind === 'stage' ? <StageIcon /> : <SpeakerIcon />}
            {channel.name}
          </>
        ) : (
          <>
            <CalendarIcon />
            {event.location || 'Somewhere Else'}
          </>
        )}
      </div>
      <div className="event-acts">
        <button className={'btn-ghost' + (mine ? ' on' : '')} onClick={onRsvp}>
          Interested
        </button>
        <span className="event-count">
          {event.interested.length} interested
        </span>
        <button className="btn-ghost danger" onClick={onDelete}>
          Cancel Event
        </button>
      </div>
    </div>
  )
}

/** Discord's Create Event form, flattened into one pane. */
function CreateEvent({
  server,
  onClose,
  onCreate,
}: {
  server: Server
  onClose: () => void
  onCreate: (e: ServerEvent) => void
}) {
  const spots = server.channels.filter((c) => c.kind === 'voice' || c.kind === 'stage')
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [where, setWhere] = useState<string>(spots[0]?.id ?? 'else')
  const [place, setPlace] = useState('')
  const iso = new Date(Date.now() + 864e5).toISOString().slice(0, 16)
  const [start, setStart] = useState(iso)

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Create Event</h3>
        </div>
        <div className="modal-body">
          <div className="set-field">
            <label>NAME</label>
            <input value={name} autoFocus maxLength={100} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="set-field">
            <label>EVENT TOPIC</label>
            <textarea value={topic} maxLength={1000} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="set-field">
            <label>LOCATION</label>
            <select value={where} onChange={(e) => setWhere(e.target.value)}>
              {spots.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="else">Somewhere Else</option>
            </select>
          </div>
          {where === 'else' ? (
            <div className="set-field">
              <label>WHERE IS YOUR EVENT?</label>
              <input value={place} onChange={(e) => setPlace(e.target.value)} />
            </div>
          ) : null}
          <div className="set-field">
            <label>START DATE</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!name.trim()}
            onClick={() => {
              onCreate({
                id: uid('evt'),
                name: name.trim(),
                description: topic.trim(),
                start: new Date(start).getTime(),
                channelId: where === 'else' ? null : where,
                location: where === 'else' ? place.trim() : '',
                interested: [],
              })
              onClose()
            }}
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  )
}

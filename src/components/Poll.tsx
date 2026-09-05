import { useState } from 'react'
import type { Account, Poll } from '../data'
import { byName } from '../emoji'
import { EmojiGlyph } from '../markdown'
import { CheckIcon, CloseIcon, PlusIcon } from '../ui/Icons'

/** The durations Discord's poll composer offers. */
const DURATIONS: [string, number][] = [
  ['1 hour', 3600e3],
  ['4 hours', 4 * 3600e3],
  ['8 hours', 8 * 3600e3],
  ['24 hours', 24 * 3600e3],
  ['3 days', 3 * 864e5],
  ['1 week', 7 * 864e5],
  ['2 weeks', 14 * 864e5],
]

/** Create Poll — the modal behind the composer's + menu. */
export function CreatePoll({
  onCreate,
  onClose,
}: {
  onCreate: (p: Poll) => void
  onClose: () => void
}) {
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState(['', ''])
  const [duration, setDuration] = useState(24 * 3600e3)
  const [multi, setMulti] = useState(false)

  const valid = question.trim() && answers.filter((a) => a.trim()).length >= 2

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal poll-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Create a poll</h3>
        </div>
        <div className="modal-body">
          <div className="set-field">
            <label>Question</label>
            <input
              autoFocus
              value={question}
              maxLength={300}
              placeholder="What do you want to ask?"
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="set-field">
            <label>Answers</label>
            {answers.map((a, i) => (
              <div className="poll-answer-row" key={i}>
                <input
                  value={a}
                  maxLength={55}
                  placeholder={`Answer ${i + 1}`}
                  aria-label={`Answer ${i + 1}`}
                  onChange={(e) =>
                    setAnswers((all) => all.map((x, j) => (j === i ? e.target.value : x)))
                  }
                />
                {answers.length > 2 ? (
                  <button
                    aria-label={`Remove answer ${i + 1}`}
                    onClick={() => setAnswers((all) => all.filter((_, j) => j !== i))}
                  >
                    <CloseIcon />
                  </button>
                ) : null}
              </div>
            ))}
            {answers.length < 10 ? (
              <button className="poll-add" onClick={() => setAnswers((a) => [...a, ''])}>
                <PlusIcon />
                Add another answer
              </button>
            ) : null}
          </div>
          <div className="poll-opts">
            <label>
              Duration
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map(([label, ms]) => (
                  <option key={label} value={ms}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="set-row">
              <div className="set-row-main">
                <div className="set-row-label">Allow multiple answers</div>
              </div>
              <button
                role="switch"
                aria-checked={multi}
                aria-label="Allow multiple answers"
                className={'switch' + (multi ? ' on' : '')}
                onClick={() => setMulti((m) => !m)}
              >
                <span />
              </button>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!valid}
            onClick={() =>
              onCreate({
                question: question.trim(),
                answers: answers
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((text, id) => ({ id, text })),
                votes: {},
                multi,
                expiresAt: Date.now() + duration,
              })
            }
          >
            Create Poll
          </button>
        </div>
      </div>
    </div>
  )
}

/** A poll inside a message: vote, live bars, and the expiry line. */
export function PollView({
  poll,
  account,
  onVote,
}: {
  poll: Poll
  account: Account
  onVote: (answerId: number) => void
}) {
  const [showResults, setShowResults] = useState(false)
  const total = Object.values(poll.votes).reduce((n, v) => n + v.length, 0)
  const mine = Object.entries(poll.votes)
    .filter(([, v]) => v.includes(account.handle))
    .map(([k]) => Number(k))
  const voted = mine.length > 0
  const ended = Date.now() > poll.expiresAt
  const reveal = voted || ended || showResults

  const left = poll.expiresAt - Date.now()
  const remaining = ended
    ? 'Poll closed'
    : left > 864e5
      ? `${Math.round(left / 864e5)} days left`
      : left > 3600e3
        ? `${Math.round(left / 3600e3)} hours left`
        : `${Math.max(1, Math.round(left / 60e3))} minutes left`

  return (
    <div className="poll">
      <div className="poll-q">{poll.question}</div>
      <div className="poll-kind">
        {poll.multi ? 'Select one or more answers' : 'Select one answer'}
      </div>
      {poll.answers.map((a) => {
        const votes = poll.votes[a.id]?.length ?? 0
        const pct = total ? Math.round((votes / total) * 100) : 0
        const picked = mine.includes(a.id)
        return (
          <button
            key={a.id}
            className={'poll-opt' + (picked ? ' picked' : '') + (reveal ? ' revealed' : '')}
            onClick={() => !ended && onVote(a.id)}
            disabled={ended}
          >
            {reveal ? <span className="poll-bar" style={{ width: `${pct}%` }} /> : null}
            <span className="poll-mark">{picked ? <CheckIcon /> : null}</span>
            {a.emoji && byName[a.emoji] ? (
              <EmojiGlyph code={byName[a.emoji].code} alt={a.emoji} />
            ) : null}
            <span className="poll-text">{a.text}</span>
            {reveal ? <span className="poll-pct">{pct}%</span> : null}
          </button>
        )
      })}
      <div className="poll-foot">
        <span>
          {total} vote{total === 1 ? '' : 's'}
        </span>
        <span>·</span>
        <span>{remaining}</span>
        {!voted && !ended ? (
          <button onClick={() => setShowResults((v) => !v)}>
            {showResults ? 'Hide results' : 'Show results'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

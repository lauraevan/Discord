// two servers, the second selected, matching the reference rail
  localStorage.setItem(
    'discord-ui:v4:servers',
    JSON.stringify([
      { id: 's0', name: 'The Crew', initials: 'TC', color: '#3ba55d',
        categories: [{ id: 'text', name: 'Text Channels' }], channels: [{ id: 'c0', name: 'general', kind: 'text', categoryId: 'text' }],
        roles: [], emojis: [], invites: [], bans: [], audit: [], notifyLevel: 1, boostTier: 0 },
      { id: 's1', name: "Nebula's Server", initials: 'NS', color: '#5865f2',
        categories: [{ id: 'text', name: 'Text Channels' }, { id: 'voice', name: 'Voice Channels' }],
        channels: [
          { id: 'c1', name: 'ok-ui-test', kind: 'text', categoryId: null },
          { id: 'c2', name: 'general', kind: 'text', categoryId: 'text' },
          { id: 'c3', name: 'General', kind: 'voice', categoryId: 'voice' },
        ],
        roles: [], emojis: [], invites: [], bans: [], audit: [], notifyLevel: 1, boostTier: 0 },
    ]),
  )

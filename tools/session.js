// Signs a browser in, so a tool lands in the client rather than on the login
// screen. The stored credential's hash is only read when the login form is
// submitted, so a placeholder is enough here.
localStorage.setItem(
  'discord-ui:v4:credentials',
  JSON.stringify([
    {
      username: 'nebula',
      email: 'nebula@example.com',
      displayName: 'Nebula',
      salt: '0'.repeat(32),
      hash: '0'.repeat(64),
      birthday: '2000-01-01',
      createdAt: 1700000000000,
    },
  ]),
)
localStorage.setItem('discord-ui:v4:session', JSON.stringify('nebula'))
localStorage.setItem(
  'discord-ui:v4:account',
  JSON.stringify({
    name: 'Nebula',
    handle: 'nebula',
    pronouns: 'he/him',
    bio: "i'm... nebula.",
    status: 'online',
    color: '#5865f2',
    profileTheme: ['#e3e1e7', '#bad7b4'],
    customStatus: 'wow',
    badges: [
      'staff', 'partner', 'hypesquad', 'bug_hunter', 'bravery', 'early_supporter',
      'bug_hunter_gold', 'verified_developer', 'mod_alumni', 'active_developer',
      'nitro', 'boost',
    ],
  }),
)

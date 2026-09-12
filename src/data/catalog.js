const favicon = domain => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`

export const catalog = [
  { id: 'browser', name: 'Browser', type: 'app', glyph: '◉', iconUrl: favicon('google.com'), description: 'Open the web from Tornado.', url: 'https://www.google.com' },
  { id: 'youtube', name: 'YouTube', type: 'app', glyph: '▶', iconUrl: favicon('youtube.com'), description: 'Watch on the web.', url: 'https://www.youtube.com' },
  { id: 'spotify', name: 'Spotify', type: 'app', glyph: '♫', iconUrl: favicon('spotify.com'), description: 'Listen with Spotify Web Player.', url: 'https://open.spotify.com' },
  { id: 'discord', name: 'Discord', type: 'app', glyph: '◫', iconUrl: favicon('discord.com'), description: 'Open Discord in your browser.', url: 'https://discord.com/app' },
  { id: 'notion', name: 'Notion', type: 'app', glyph: 'N', iconUrl: favicon('notion.so'), description: 'Notes and workspace.', url: 'https://www.notion.so' },
  { id: 'minecraft', name: 'Minecraft', type: 'game', glyph: '▦', iconUrl: favicon('minecraft.net'), description: 'Launcher entry. Native launch is not available from the browser.' },
  { id: 'fortnite', name: 'Fortnite', type: 'game', glyph: 'F', iconUrl: favicon('fortnite.com'), description: 'Launcher entry. Native launch is not available from the browser.' },
  { id: 'roblox', name: 'Roblox', type: 'game', glyph: '◇', iconUrl: favicon('roblox.com'), description: 'Visit Roblox on the web.', url: 'https://www.roblox.com' },
  { id: 'chess', name: 'Chess', type: 'game', glyph: '♞', iconUrl: favicon('chess.com'), description: 'Play chess in your browser.', url: 'https://www.chess.com' },
  { id: 'geoguessr', name: 'GeoGuessr', type: 'game', glyph: '⌖', iconUrl: favicon('geoguessr.com'), description: 'Explore the world in your browser.', url: 'https://www.geoguessr.com' },
]

export const defaultSelection = ['browser', 'youtube', 'spotify', 'minecraft', 'fortnite', 'roblox']

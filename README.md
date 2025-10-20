# RageBlock

A Firefox extension that blocks mainstream news sites while keeping investigative journalism accessible. Escape the 24/7 outrage cycle without missing what actually matters.

## Why?

I wanted this for myself.

Mainstream news creates anxiety through constant outrage and breaking news alerts. But you still want to stay informed through deep investigative reporting. RageBlock blocks sites like CNN and Fox News while allowing ProPublica and The Intercept.

This isn't conspiracy theory driven, it's just an acknowledgement of different incentive structures. There's been a lot of optimization for clicks and profit by major news outlets that has a negative impact on truth and sensational framing.

There's an underlying philosophy here that you are better off focusing on things you can actually change than getting worked up about stuff you can't impact.

## Features

- **Opinionated blocking**: Blocks major mainstream news by default, allows investigative journalism
- **Temporary bypasses**: Need to check something? Get 5 minutes or bypass until midnight
- **Custom lists**: Add your own blocked or allowed sites
- **Usage stats**: See blocks and bypasses from the past week
- **Reflection prompts**: Gentle reminders if you're bypassing too often
- **Infinite scroll protection**: Overlay shows when your bypass expires instead of endless scrolling

## Installation

### Development Install

1. Clone this repo
2. Navigate to `about:debugging#/runtime/this-firefox` in Firefox
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file

## Usage

**Blocked by default** (full domains, including all subdomains):

- Cable news: CNN, Fox News, MSNBC
- Major papers: NYT, WaPo, USA Today
- Social media: Reddit, Twitter/X, Facebook, Instagram, TikTok
- News aggregators
- 60+ sites total (see `src/defaultBlocklist.js`)

**Allowed by default**:

- ProPublica, The Intercept, Mother Jones
- Bellingcat, The Marshall Project
- Investigative journalism sites

**Managing sites**:

- Click the extension icon to open the popup
- Add sites to your custom blocked or allowed lists
- Remove sites you don't want blocked

**When blocked**:

- You'll see a friendly message with alternatives
- Choose "Bypass for 5 minutes" or "Unblock until midnight"
- Or just go back

## Contributing

### Setup

```bash
npm install
npm test
```

### Key Concepts

**Storage**:

- `blockedSites` / `allowedSites` - User's custom lists
- `tempUnblocks` - Active bypasses with expiry timestamps
- `blockHistory` / `bypassHistory` - Last 100 events with timestamps
- Stats count events from the last 7 days

**Hostname matching**:

- Blocks exact matches and subdomains (e.g., blocking `reddit.com` also blocks `old.reddit.com`)
- Allowed list takes precedence over blocked list

**Bypass flow**:

1. User clicks bypass on blocked page
2. `tempUnblocks` entry created with expiry timestamp
3. `content.js` monitors for expiry every 30 seconds
4. When expired, overlay shows instead of letting page continue loading

## Browser Compatibility

Firefox 109+ only. Uses Firefox WebExtensions API (Manifest V2).

## License

MIT License - see LICENSE file for details.

## Credits

Built with frustration about news-induced anxiety and a desire to stay informed without the rage.

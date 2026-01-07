# OBOB.dog 🐶

Practice questions for Oregon Battle of the Books. Read, practice, and have fun! For more info see the about page on [obob.dog/about](https://obob.dog/about). 

## Get Started

```bash
pnpm install
pnpm run dev
```

Open [localhost:3000](http://localhost:3000) and start your battle.

## Environment Variables

For the crossword voice chat feature (optional), add these to `.env.local`:

```bash
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_URL=wss://your-project.livekit.cloud
```

Get these from [LiveKit Cloud](https://cloud.livekit.io) (free tier available).

## Building

```bash
pnpm run build  # Generates question counts, runs tests, and creates the build
```

## Contributing

Found a question that needs fixing? See a bug? We'd love your help! Open an issue or submit a PR.

---
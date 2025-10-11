# Realia Backend

Backend API server for the Realia platform.

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** - Web framework
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing
- **cookie-parser** - Cookie parsing middleware

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```env
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

## Development

Run the development server with hot reload:
```bash
npm run dev
```

## Build

Build the TypeScript code:
```bash
npm run build
```

## Production

Run the production server:
```bash
npm start
```

## API Endpoints

- `GET /` - API status
- `GET /health` - Health check endpoint


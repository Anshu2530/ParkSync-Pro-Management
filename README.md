# ParkSync Pro - Parking Manager

ParkSync Pro is a lightweight parking management app with a Node.js backend, MongoDB storage, and a static frontend served from `public/`.

## Current Project Structure

```text
.
├── index.html
├── package.json
├── requirements.yaml
├── server.js
└── public/
    ├── css/
    │   ├── login.css
    │   └── style.css
    ├── images/
    │   ├── auth-bg.png
    │   ├── logo.png
    │   ├── map-bg.png
    │   ├── parking-hero.png
    │   ├── vip-zone.png
    │   └── zone-banner.png
    ├── index.html
    ├── js/
    │   ├── login.js
    │   └── main.js
    └── login.html
```

## Features

- User login and registration
- Parking zone overview
- Parking spot tracking
- Parking session check-in and checkout
- Dashboard stats for occupancy and revenue
- Static frontend assets for the main app and login page

## Tech Stack

- Backend: Node.js
- Database: MongoDB
- Frontend: HTML, CSS, JavaScript

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure MongoDB if needed:

The server uses `MONGODB_URI` when available and falls back to a local MongoDB database at `mongodb://127.0.0.1:27017/parking-system`.

3. Start the app:

```bash
npm start
```

Or run the dev script:

```bash
npm run dev
```

## Environment Variables

- `PORT`: server port, defaults to `3000`
- `MONGODB_URI`: MongoDB connection string

## Default Access

The server seeds the database on first run if it is empty, including a default admin user and sample parking zones/spots.

## Notes

- `public/index.html` serves the main app UI.
- `public/login.html` serves the login screen.
- `requirements.yaml` is kept in the repo as part of the current project structure.

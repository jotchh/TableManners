# TableManners

A virtual tabletop (VTT) for D&D.

## Features

* **Grid Maps** — Create and interact with grid-based maps.
* **Token-Based Gameplay** — Add, move, resize, and manage tokens on the map.
* **Game State Saving** — Save and restore game states for ongoing campaigns.
* **User Accounts** — Create accounts and access saved game states.

## Tech Stack

* JavaScript
* React
* Node.js
* Express
* PostgreSQL
* HTML/CSS

## Local Development

### 1. Install dependencies

```bash
npm i
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```env
PGUSER=YOURPOSTGRESUSER
PGPORT=5432
PGHOST=localhost
PGPASSWORD=YOURPOSTGRESPASSWORD
PGDATABASE=tablemannersdb
```

Replace the PostgreSQL username and password with your local credentials.

### 3. Set up the database

Create the `tablemannersdb` database and run the setup script:

```bash
psql -U YOURPOSTGRESUSER -d tablemannersdb -f setup.sql
```

### 4. Start the server locally

```bash
npm run start:local
```

Visit:

```text
http://localhost:3000
```

## Deployment

TableManners is deployed using Fly.io with a PostgreSQL database.

### 1. Create Postgres

```bash
fly postgres create
```

Use the **Development** configuration and name the cluster `tablemannersdb`.

### 2. Create the Fly app

```bash
fly launch
```

Use `tablemanners` as the app name and select **None** for Postgres.

### 3. Attach Postgres

```bash
fly postgres attach tablemannersdb --app tablemanners
```

### 4. Set up the database

```bash
fly postgres connect -a tablemannersdb < setup.sql
```

### 5. Deploy

```bash
fly deploy
```

View logs with:

```bash
fly logs -a tablemanners
```

**Redeploy** changes with:

```bash
fly deploy
```

## Project Status

TableManners is a for-fun project currently in development. It is still pretty rough around the edges, but the core VTT functionality is being built out.

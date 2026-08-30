# RepoQA Frontend

React + TypeScript + Tailwind CSS frontend for RepoQA.

## Run

```bash
npm install
npm run dev
```

Create `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

The frontend expects the RepoQA Express backend to expose:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/refresh`
- `GET /auth/logout`
- `GET /repositories`
- `GET /repositories/:id`
- `POST /repositories`
- `DELETE /repositories/:id`
- `GET /repositories/:id/progress`
- `POST /repositories/:id/conversations`
- `GET /repositories/:id/conversations`
- `GET /conversations/:id/messages`
- `POST /repositories/:id/ask`
- `POST /repositories/:id/search`

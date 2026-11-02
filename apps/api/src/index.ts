import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => c.html('Api activated, check status on <a href="/api/health">/api/health</a>'));
app.get('/api/health', (c) => c.json({ status: 'ok' }));

export default app;

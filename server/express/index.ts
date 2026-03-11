import express, { type Request, type Response } from 'express';
import { adminRouter } from './routes/admin';

const app = express();
const port = Number(process.env.ADMIN_API_PORT || 4001);

app.use(express.json());
app.use('/admin', adminRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'express', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`[admin-api] listening on http://localhost:${port}`);
});

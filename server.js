import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/api/time', (req, res) => {
  const now = new Date();
  res.json({
    iso: now.toISOString(),
    epochMs: now.getTime(),
    locale: now.toLocaleString()
  });
});

app.get('/', (req, res) => {
  res.type('text').send('OK');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

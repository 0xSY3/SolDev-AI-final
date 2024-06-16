import express from 'express';
import bodyParser from 'body-parser';
import clarifyRouter from './routes/Routes';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(Router);

export default app;

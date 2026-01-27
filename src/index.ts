import express from 'express'
import subjectsRouter from './routes/subjects';
import cors from 'cors'
import securityMiddleware from './middleware/security';

const app = express();
const PORT = 8000;
if(!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is not set in the .env file');
}
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET','PUT','POST','DELETE'],
    credentials: true
}))
app.use(express.json());
app.use(securityMiddleware)
app.use('/api/subjects', subjectsRouter )
app.get('/' ,(req,res)=> {
    res.send('Hello, welcome to the classroom-management-backend API!')
});
app.listen(PORT, ()=> {
    console.log(`Server is running at http://localhost:${PORT}`);
});
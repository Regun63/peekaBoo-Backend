import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import connectDB from './utils/connectDB.js';
import userRoute from './routes/user.route.js';
import postRoute from './routes/post.route.js';
import messageRoute from './routes/message.route.js';
import {app,server} from './socket/socket.js';
import dotenv from 'dotenv';

dotenv.config();

// Call it before starting the server
connectDB();
const PORT = process.env.PORT || 5000;
app.get("/",(_,res)=>{
    return res.status(200).json({
        message:"hey this is Sushmita here!",
        success:true
    })
})
//middlewares
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
const corsOption={
   origin: process.env.CLIENT_URL,
    credentials:true,
}
app.use(cors(corsOption))

app.use('/api/peekaBoo/user',userRoute);
app.use('/api/peekaBoo/post',postRoute);
app.use('/api/peekaBoo/message',messageRoute);


server.listen(PORT,()=>{
    console.log(`your server is running succcessfully at : http://localhost:${PORT}`);
})
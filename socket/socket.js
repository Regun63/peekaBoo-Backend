import {Server} from 'socket.io'
import express from 'express'
import http from 'http'
import dotenv from 'dotenv';


dotenv.config();
const app= express();

const server =http.createServer(app);


const io=new Server(server,{
    cors:{
       origin: process.env.CLIENT_URL,
        methods:['GET','POST'],
         credentials: true
    }
})

const userSocketMap={};
io.on('connection',(socket)=>{
    const userId=socket.handshake.auth.userId;
    if(userId){
        userSocketMap[userId]=socket.id;
        console.log(`User connected: UserId: ${userId}, SocketId: ${socket.id}`)
    }

    io.emit('getOnlineUsers',Object.keys(userSocketMap));

    socket.on('disconnect',()=>{
        if(userId){
            console.log(`User disconnected: UserId: ${userId}, SocketId: ${socket.id}`)
            delete userSocketMap[userId];
        }
        io.emit('getOnlineUsers',Object.keys(userSocketMap));
    });
});

export const getReceiverSocketId=(userId)=>{
    return userSocketMap[userId];
}

export {app,io,server};

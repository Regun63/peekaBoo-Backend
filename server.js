import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from './utils/connectDB.js'
import userRoute from './routes/user.route.js'
import postRoute from './routes/post.route.js'
import messageRoute from './routes/message.route.js'
import { app, server } from './socket/socket.js'
import path from 'path'
import dotenv from 'dotenv'
import helmet from 'helmet'



app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws://localhost:5000"],
      },
    })
  )
dotenv.config()
connectDB()


const __dirname = path.resolve()
console.log('path:', __dirname)

app.get('/', (_, res) => {
  return res.status(200).json({
    message: 'hey this is Sushmita here!',
    success: true,
  })
})

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


const corsOption = {
  origin: 'http://localhost:5174',
  credentials: true,
}
app.use(cors(corsOption))

app.use('/api/peekaBoo/user', userRoute)
app.use('/api/peekaBoo/post', postRoute)
app.use('/api/peekaBoo/message', messageRoute)

app.use(express.static(path.join(__dirname, 'frontend', 'dist')))

app.get('*', (req, res) => {
  console.log('Fallback route called for:', req.url)
  res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
})

const PORT = 5000
server.listen(PORT, () => {
  console.log(`your server is running succcessfully at : http://localhost:${PORT}`)
})

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv').config()
const mongoose = require('mongoose')
const router = require('./routes/index')
const errorMiddleware = require('./middlewares/error-middleware')
 
const PORT = process.env.PORT || 5000
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))
app.use('/api', router)
app.use(errorMiddleware)


const start = async () => {
    try {
        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true 
        })

        app.listen(PORT, () => console.log(`Server runs on port ${PORT}`))
    } catch (error) {
        console.log('err', error);
    }
}

start()
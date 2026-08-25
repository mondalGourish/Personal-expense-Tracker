const express = require('express')
const testRoutes = require('../routes/test.routes')
const aboutRoutes = require('../routes/about.routes')


const app = express()
app.use(express.json()) //parses incoming JSON request bodies and makes the parsed data available through req.body.

app.use('/',testRoutes)

app.use('/about',aboutRoutes)
// app.post("/test",(req,res)=>{
//     const data = req.body
//     res.status(201).json({
//         message:"Post message created",
//         data
//     })
// })
module.exports = app
const express = require("express");
const expenseRoutes = require('./routes/expense.routes')
const app = express();
app.use(express.json()); //parses incoming JSON request bodies and makes the parsed data available through req.body.

app.use('/api/expenses', expenseRoutes)


module.exports = app;

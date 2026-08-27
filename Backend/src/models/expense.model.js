const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        maxLength:50,
    },
    amount:{
        type:Number,
        required:true,
        min:[1,"Your expense is less than 1"],
        max:[100000000,"Your expense is exceeding our limit"]
    },
    category:{
        type:String,
        required:true,
        enum:['Food','Groceries','Transport','Bills','Shopping','Health','Education','Other'],
        
    },
    date:{
        type:Date,
        required:true,
        default:Date.now,
    },
    description:{
        type:String,
    },
},{timestamps:true})

//timestamps true means automatically manages the createdAt and updatedAt

const expenseModel = mongoose.model('Expense',expenseSchema)
module.exports = expenseModel
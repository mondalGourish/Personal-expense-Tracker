const mongoose = require('mongoose')

async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB connected successfully")
    }catch(err){
        console.log('Error occurred');
        throw err;
    }
    
}
module.exports = connectDB

const homeController = (req,res)=>{
    
    res.status(200).json({
        message:"Home created"
    })
}
module.exports = homeController


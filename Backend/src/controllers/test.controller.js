
const homeController = (req,res)=>{
    
    res.status(200).json({
        message:"Home created"
    })
}
const postController = (req,res)=>{
    const data = req.body
    res.status(201).json({
        message:"Post message created",
        data
    })
}
module.exports = {homeController,postController}


const jwt=require("jsonwebtoken")
const jwt_key=process.env.jwt_key;

const userMiddleware=(req,res,next)=>{
    const token=req.headers.token;
   try{ 
    const verifyuser=jwt.verify(token,jwt_key);
    if(verifyuser){
       req.userId=verifyuser.userId;
       next();
    } } catch(e){
        res.status(404).send({
            message:"user not found"
        })
    }
} 

module.exports={
    userMiddleware:userMiddleware
}
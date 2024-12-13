require("dotenv").config()
const express=require("express")
const cors=require("cors")
const {userRouter}=require("./router/user")
const {postRouter}=require("./router/posts")
const {notifyRoutes}=require("./router/notify")

const {v2}=require('cloudinary') //import v2 object from cloudinary

const app=express();
app.use(express.json())
app.use(cors())

v2.config({
    cloud_name:process.env.cloud_name,
    api_key:process.env.cloudinary_api_key,
    api_secret:process.env.cloudinary_api_secrete
})

app.use("/user",userRouter)
app.use("/post",postRouter)
app.use("/notification",notifyRoutes)




app.listen(4000,()=>{
    console.log("app started")
})
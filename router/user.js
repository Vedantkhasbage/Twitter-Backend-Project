const express=require("express")
const z=require("zod")
const {userModel, NotificationModel}=require("../database")
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken")
const userRouter=express();
const jwt_key=process.env.jwt_key;
const {userMiddleware}=require("../usermiddleware");
const {v2}=require('cloudinary')


userRouter.post("/signUp",async(req,res)=>{
      const requireInputTypes=z.object({
        firstname:z.string().min(3).max(50),
        email:z.string().min(5).max(50),
        password:z.string().min(5).max(50)
      })

  
      const CheckRequiredTypes=requireInputTypes.safeParse(req.body);

      if(!CheckRequiredTypes.success){
        res.status(411).send({
            message:"Invalid input"
        })
        return;
      }

      const {firstname,email,password}=req.body;
      const hashedpassword=await bcrypt.hash(password,5);
 try{
    const response= await userModel.create({
        firstname:firstname,
        email:email,
        password:hashedpassword
      })

      res.status(200).send({
        message:"success",
        user:response
      })
} catch(e){
    res.json({
        message:"user Already exists"
    })
}
})




userRouter.post("/signIn",async(req,res)=>{
   
    const requireInputTypes=z.object({
        email:z.string().min(5).max(50),
        password:z.string().min(5).max(50)
      })
 
      const CheckRequiredTypes=requireInputTypes.safeParse(req.body);

      if(!CheckRequiredTypes.success){
        res.status(411).send({
            message:"Invalid input"
        })
        return;
      }

 
      const {email,password}=req.body;
     

      const CheckUserWithEmail=await userModel.findOne({
        email:email
      })
        
      if(!CheckUserWithEmail){
        res.status(404).send({
            message:"User not found"
        })
        return;
      }

      const CheckWithPassword=await bcrypt.compare(password,CheckUserWithEmail.password);

      if(!CheckWithPassword){
        res.status(404).send({
            message:"User not found"
        })
        return;
      }

       if(CheckWithPassword){
         const token=jwt.sign({
            userId:CheckUserWithEmail._id
        },jwt_key)
          res.json({
            token:token
          })
    }
})


userRouter.get("/myInfo",userMiddleware,async(req,res)=>{
      const userId=req.userId;

      const findUser=await userModel.findOne({
       _id:userId
      })

      res.json({
        findUser
      })
})


userRouter.post("/follow/:IdOfUserTofollow",userMiddleware,async(req,res)=>{

    const {IdOfUserTofollow}=req.params;
    const CurrentUserId=req.userId;

    if(IdOfUserTofollow.toString()===CurrentUserId.toString()){
        res.json({
            message:"You can't follow yourSelf"
        })
        return;
    }


    const findUserToFollow=await userModel.findOne({
        _id:IdOfUserTofollow
    })

    const currentUser=await userModel.findOne({
        _id:CurrentUserId
    })

    if(!findUserToFollow || !currentUser ) {
        res.status(404).send({
            message:"User not found"
        })
        return;
    }

      const IsFollowing=currentUser.following.includes(IdOfUserTofollow);

      if(IsFollowing){
     //unfollow him
        
     await userModel.findByIdAndUpdate(IdOfUserTofollow,{$pull:{followers:CurrentUserId}})
     await userModel.findByIdAndUpdate(CurrentUserId,{$pull:{following:IdOfUserTofollow}})
   
     res.json({
        message:" user Unfollowed successfully"
       })
      } else{
   //follow
       
       await userModel.findByIdAndUpdate(IdOfUserTofollow,{$push:{followers:CurrentUserId}})
       await userModel.findByIdAndUpdate(CurrentUserId,{$push:{following:IdOfUserTofollow}})

       const newNotification=await NotificationModel.create({
        from:CurrentUserId,
        to:IdOfUserTofollow,
        type:"follow",
       })
      
       res.json({
        message:" user followed successfully"
       })

      }



})


userRouter.get("/suggest",userMiddleware,async(req,res)=>{
  
    const CurrentUserId=req.userId;
    const CurrentUser=await userModel.findOne({
        _id:CurrentUserId
    })

    const CurrentUserFollowingIds=CurrentUser.following.map((following)=>following._id.toString());
     console.log(CurrentUserFollowingIds)
    let Allusers=await userModel.find({})
    console.log(Allusers)
    let newarr=[];
    for(let i=0;i<Allusers.length;i++){
        if(!CurrentUserFollowingIds.includes(Allusers[i]._id.toString()) && Allusers[i]._id.toString()!=CurrentUserId.toString()){
            newarr.push(Allusers[i])
        }
    }
    console.log(newarr)
    res.json({
        message:newarr
    })
}
)


userRouter.post("/update",userMiddleware,async(req,res)=>{

    const CurrentUserId=req.userId;
     
   let FindUserFromDB=await userModel.findOne({
        _id:CurrentUserId
    })

    if(!FindUserFromDB){
        res.status(404).send({
            message:"User not found"
        })
        return;
    }

    const {newfirstname,newemail,currentpassword,newpassword,bio,links}=req.body;
    let {profileimg,coverimg}=req.body;

    if((!currentpassword && newpassword )|| (currentpassword && !newpassword)){
        res.json({
            message:"both password must be provided!!"
        })
        return;
    }
    // console.log(typeof(newpassword))
if(newpassword!=undefined && currentpassword!=undefined){
    const checkCurrentPassword=await bcrypt.compare(currentpassword,FindUserFromDB.password)
    if(!checkCurrentPassword){
        res.status(404).send({
            message:"Password Incorrect!!!"
        })
        return;
    }
    const hashedpassword=await bcrypt.hash(newpassword,5);

    FindUserFromDB.password=hashedpassword||FindUserFromDB.password

}

    if(profileimg){
        if(FindUserFromDB.profileimg){
            await v2.uploader.destroy(FindUserFromDB.profileimg.split("/").pop().split(".")[0])
        }
      const response= await v2.uploader.upload(profileimg);
        profileimg=response.secure_url
    }


    if(coverimg){

        if(FindUserFromDB.Coverimg){
            await v2.uploader.destroy(FindUserFromDB.Coverimg.split("/").pop().split(".")[0])
        }
        const response= await v2.uploader.upload(coverimg);
        coverimg=response.secure_url
    }


      console.log(newemail)

    FindUserFromDB.firstname=newfirstname||FindUserFromDB.firstname
    FindUserFromDB.email=newemail||FindUserFromDB.email

    FindUserFromDB.profileImg=profileimg||FindUserFromDB.profileImg
    FindUserFromDB.CoverImg=coverimg||FindUserFromDB.CoverImg
    FindUserFromDB.Bio=bio||FindUserFromDB.Bio
    FindUserFromDB.Links=links||FindUserFromDB.Links
     

   FindUserFromDB= await FindUserFromDB.save();
   
     res.json({
        message:"updated successfully",
    
     })

})




module.exports={
    userRouter:userRouter
}
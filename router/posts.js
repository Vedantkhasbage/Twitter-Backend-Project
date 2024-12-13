const express=require("express");

const postRouter=express();
const {userMiddleware}=require("../usermiddleware");
const { postModel, userModel } = require("../database");
const {v2}=require("cloudinary");


postRouter.post("/create",userMiddleware,async(req,res)=>{
    const userId=req.userId;
    console.log(userId)
        
try{
       const {title,img}=req.body;
       console.log(title)
       console.log(img)

       if(!title && !img){
        res.json({
            message:"You can't create empty post"
        })
        return;
       }

       if(img){
        const uplaodimg=await v2.uploader.upload(img);  //it will not work if we pass img from postman that is tex will give error it works
        // only when we pass real image
        img=uplaodimg.secure_url;
       }
    
       console.log("reached here")
       const putPostInDB=await postModel.create({
          userId:userId,
         title:title,
         img:img,
       })

       res.json({
        message:"post uploaded!!!",
        putPostInDB
       })
} catch(e){
    res.status(400).send({
        message:"Something went wrong!!"
    })
}

})

postRouter.delete("/delete/:postId",userMiddleware,async(req,res)=>{
    const userId=req.userId;
    const postId=req.params.postId;


    try{
       const FindPostfromDB=await postModel.findOne({
        _id:postId
       })

       if(!FindPostfromDB){
        res.status(404).send({
            message:"post not found"
        })
        return;
       }
       

        const FindUserFromDB=await userModel.findOne({
            _id:userId
        })
        if(!FindUserFromDB){
            res.status(404).send({
                message:"user not found"
            })
            return;
        }

        if(userId.toString()!=FindPostfromDB.userId.toString()){
           res.status(411).send({
            message:"you don't have access to delete it"
           })
           return;
        }

        const deletepost=await postModel.deleteOne({
            _id:postId
        })

        res.json({
            message:"post deleted successfully!!!"
        })

    }catch(e){
        res.status(400).send({
            message:"something went wrong"
        })
    }


})

postRouter.post("/comment/:postId",userMiddleware,async(req,res)=>{

    const userId=req.userId;
    const postId=req.params.postId;
    const {title}=req.body;
    if(!title){
        res.json({
            message:"comment can't be empty!!"
        })
        return;
    }

   try{ const FindPostfromDB=await postModel.findOne({
        _id:postId
    })

    if(!FindPostfromDB){
        res.status(404).send({
            message:"post not found"
        })
        return;
    }

   
    const comments={title,user:userId}
    // console.log(comments)
    FindPostfromDB.comments.push(comments);

    // console.log("reached")

    await FindPostfromDB.save();

    res.json({
        message:"comment success"
    })
     
} catch(e){
    res.status(404).send({
        message:"something went wrong!!"
    })
}
    
    

})


postRouter.post("/like/:postId",userMiddleware,async(req,res)=>{
    const userId=req.userId;
    const postId=req.params.postId;

   try{ const FindPostfromDB=await postModel.findOne({
        _id:postId
    })
    console.log("1st")
    console.log(FindPostfromDB)
    if(!FindPostfromDB){
        res.status(404).send({
            message:"post not found"
        })
        return;
    }

    const FindUserFromDB=await userModel.findOne({
        _id:userId
    })

    console.log("2nd")
    console.log(FindUserFromDB)
    if(!FindUserFromDB){
        res.status(404).send({
            message:"user not found"
        })
        return;
    }

   
    console.log(FindPostfromDB.likes)

    if(FindPostfromDB.likes!=[] && FindPostfromDB.likes.includes(userId)){
  //unlike
        await postModel.findByIdAndUpdate(postId,{$pull:{likes:userId}})
        await userModel.findByIdAndUpdate(userId,{$pull:{likedpost:postId}})

        res.json({
            message:"unlike success"
        })

    }
    else{
        //like the post
        FindPostfromDB.likes.push(userId)
        await userModel.findByIdAndUpdate(userId,{$push:{likedpost:postId}})

        await FindPostfromDB.save();
        res.json({
            message:"like success"
        })
    }

} catch(e){
    res.status(411).send({
        message:"something went wrong!!!"
    })
}
})


postRouter.get("/allpost",userMiddleware,async(req,res)=>{
       const userId=req.userId;

       const FindAllUsers=await postModel.find({userId}).populate({
        path:"userId",
        select:"-password"
       }).populate({
        path:"comments.user",
        select:"-user"
       })

      if(FindAllUsers.length===0){
        res.status(201).send({
            message:[]
        })
      } else{
       res.status(200).send({
        message:FindAllUsers
       })
    }
})

postRouter.get("/mylikedpost",userMiddleware,async(req,res)=>{
    const userId=req.userId;

    try{
        const FindUserFromDB=await userModel.findOne({
            _id:userId
        })
        if(!FindUserFromDB){
            res.status(404).send({
                message:"user not found"
            })
            return;
        }
     const likedposts=FindUserFromDB.likedpost;

     if(likedposts==[]){
        res.status(201).send({
            message:"You haven't like any post"
        })
        return;
     }

    else{ 
        let likedarr=[];
        for(let i=0;i<likedposts.length;i++){
            const response=await postModel.findOne({
                _id:likedposts[i]
            })
            likedarr.push(response)
        }
        res.json({
        likedarr
     })
        }
    } catch(e){
        res.status(411).send({
            message:"something went wrong"
        })
    }

})

postRouter.get("/followingPost",userMiddleware,async(req,res)=>{
    const userId=req.userId;
      
    const FindUserFromDB=await userModel.findOne({
        _id:userId
    })

    if(!FindUserFromDB){
        res.status(404).send({
          message:"user not found"
        })
        return;
    }
     
    const followingarray=FindUserFromDB.following;
      
     const myfollowingpost=[]
     for(let i=0;i<followingarray.length;i++){
        const response=await postModel.find({
            userId:followingarray[i]
        })
        myfollowingpost.push(response)
     }

     res.json({
        myfollowingpost
     })
    
})


postRouter.get("/mypost",userMiddleware,async(req,res)=>{
   const userId=req.userId;

    try{
        const response=await postModel.find({
            userId:userId
        })
        if(!response){
            res.status(201).send({
                message:"you don't have any posts"
            })
            return;
        }
        res.status(200).send({
            response
        })
         
    } catch(e){
        res.status(411).send({
            message:"Something went wrong!!"
        })
    }

})

module.exports={
    postRouter:postRouter
}
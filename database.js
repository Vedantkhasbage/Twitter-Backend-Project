const mongoose=require("mongoose");
const schema=mongoose.Schema;

mongoose.connect(process.env.mongourl)

const userSchema=new schema({
    firstname:String,
    email:{
  type:String,
  require:true,
    unique:true
    },
    password:String,
    followers:[
       { 
        type:mongoose.Types.ObjectId,
        ref:"users",
        default:[]
    }
    ],
    following:[
        { 
         type:mongoose.Types.ObjectId,
         ref:"users",
         default:[]
     }
     ],

    profileImg:{
        type:String,
        default:""
    },

    CoverImg:{
        type:String,
        default:""
    },

    Bio:{
        type:String,
        default:""
    },

    Links:{
        type:String,
        default:""
    },
    likedpost:[
       {
        type:mongoose.Types.ObjectId,
        ref:"posts",
        default:[]
       } 
    ]
},{timestamps:true})


const notificationSchema=new schema({
    from:{
        type:mongoose.Types.ObjectId,
        require:true,
        ref:"users"
    },
    to:{
        type:mongoose.Types.ObjectId,
        require:true,
        ref:"users"
    },
    type:{
        type:String,
        require:true
    },
    read:{
        type:Boolean,
        default:false
    }

},{timestamps:true})

const PostSchema=new schema({
    userId:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"users"
    },
    title:{
        type:String,
       
    },
    img:{
        type:String
    },
    likes:[
       { type:mongoose.Types.ObjectId,
        ref:"users",
        }
    ],
    comments:[
        {
        title:{
            type:String,
            required:true,
            default:""
        },
        user:{
            type:mongoose.Types.ObjectId,
            ref:"users",
            required:true,
            default:0
        }
}
    ]
},{timestamps:true})

const postModel=mongoose.model("posts",PostSchema);

const userModel=mongoose.model("users",userSchema);
const NotificationModel=mongoose.model("Notifications",notificationSchema);

module.exports={
    userModel:userModel,
    NotificationModel:NotificationModel,
    postModel:postModel
}
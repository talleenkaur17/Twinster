const User=require("../models/User");
const Post=require("../models/Post");

exports.register=async(req,res)=>{

    try{
        const {name,email,password}=req.body;
        let user=await User.findOne({email});
        if(user) {

            return res.status(400)
            .json({success:false,message:"User already exists"});
        }
        user=await User.create({
            name,
            email,
            password,
            avatar:{
                public_id:"sample_id",url: "sampleurl"
            },
        
        });
        const token=await user.generateToken();
        const options={expires:new Date(Date.now()+90*24*60*60*1000),
             httpOnly:true,
     
        };
        
        res.status(201).cookie("token",token,options)
        .json({
         success:true,
         user,
         token,
        })
 
    }catch (error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
};
exports.login=async(req,res)=>{


    try{
        const {email,password}=req.body;
        const user=await User.findOne({email}).select("+password");
        if(!user){
            return res.status(400).json({
                success:false,
                message:"User does not exist"
            })
        }
       const isMatch=await user.matchPassword(password);
       if(!isMatch){
        return res.status(400).json({
            success:false,
            message:"Incorrect password"
        })

       }
       const token=await user.generateToken();
       const options={expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true,
    
       };
       
       res.status(200).cookie("token",token,options)
       .json({
        success:true,
        user,
        token,
       })

        }

    
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })

    }

}
exports.logout=async(req,res)=>{
    try{
       res .status(200)
        .cookie("token",null,{expires:new Date(Date.now()),httpOnly:true})
        .json({
            success:true,
            message:"Logged Out",
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}
exports.followUser=async(req,res)=>{
    try{
        const userToFollow=await User.findById(req.params.id);

        const loggedInUser=await User.findById(req.user._id);

        if(!userToFollow){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        if(loggedInUser.following.includes(userToFollow._id)){
            const indexFollowing=loggedInUser.following.indexOf(userToFollow._id);
            loggedInUser.following.splice(indexFollowing,1);

            const indexfollowers=userToFollow.followers.indexOf(loggedInUser._id);
            userToFollow.followers.splice(indexfollowers,1);
            await loggedInUser.save();
            await userToFollow.save();
            res.status(200).json({
                success:true,
                message:"User unfollowed",
                
            })

        }
        else{
        loggedInUser.following.push(userToFollow._id);
        userToFollow.followers.push(loggedInUser._id);


        await loggedInUser.save();
        await userToFollow.save();

        res.status(200).json({
            success:true,
            message:"User followed",
            
        })
    }


    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }

}
exports.updatePassword=async(req,res)=>{

    try{
        const user=await User.findById(req.user._id).select("+password");
        const {oldPassword,newPassword}=req.body;
        if(!oldPassword || !newPassword){
            return res.status(400).json({
                success:false,
                message:"Please provide old and new password",
            })
        }
        const isMatch=await user.matchPassword(oldPassword);
        if(!isMatch){
            res.status(400).json({
                success:false,
                message:"Incorrect Password",
            })
        }
        user.password=newPassword;
        await user.save();
        res.status(200).json({
            success:true,
            message:"Password updated"
        })


    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }

}
exports.updateProfile=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id);
        const {name,email}=req.body;
        if(name){
            user.name=name;

        }
        if(email){
            user.email=email;
        }
        //User Avatar:TODO
        await user.save();
        res.status(200).json({
            success:true,
            message:"Profile Updated",
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }

}
exports.deleteMyProfile=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id);

        const posts=user.posts;
        const followers=user.followers;
        const following=user.following;
        const userId=user._id;

        await user.deleteOne();
        res 
        .cookie("token",null,{expires:new Date(Date.now()),httpOnly:true})
        ;


        for(let i=0;i<posts.length;i++){
            const post=await Post.findById(posts[i]);
            await post.deleteOne();

        }
        for(let i=0;i<followers.length;i++){
            const follower=await User.findById(followers[i]);
            const index=follower.following.indexOf(userId);
            follower.following.splice(index,1);
            await follower.save();
        }
        for(let i=0;i<following.length;i++){
            const follows=await User.findById(followers[i]);
            const index=follows.followers.indexOf(userId);
            follows.following.splice(index,1);
            await follows.save();
        }
        res.status(200).json({
            sucess:true,
            message:"Profile Deleted",
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
exports.myProfile=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id).populate("posts");

        res.status(200).json({
            success:true,
            user,
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}
exports.getUserProfile=async(req,res)=>{
    try{
        const user=await User.findById(req.params.id).populate("posts");

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User Not found",
            })
        }
        res.status(200).json({
            success:true,
            user,
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })

    }
}
exports.getAllUsers=async(req,res)=>{
    try{
        const users=await User.find({});
        res.status(200).json({
            success:true,
            users,
        })

    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })

    }

}
exports.forgotPassword=async(req,res)=>{
    try{
        const user=await User.findOne({
            email:req.body.email
        })
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found",
            })
        }
        const resetPasswordToken=user.getResetPasswordToken();

    }
    catch(error){

    }
}
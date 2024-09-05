import mongoose, { set } from "mongoose";

const userSchema = new mongoose.Schema({
    clerkUserId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    userName: {
        type: String,
    },
    email: {
        type : String,
    },
    avatarUrl : {
        type: String,
    },
    
    

}, { timestamps: true })



export const User = mongoose.model("User", userSchema)
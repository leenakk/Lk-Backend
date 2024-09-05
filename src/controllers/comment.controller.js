import { Post } from "../models/post.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

export const commentController = asyncHandler(async (req, res) => {
    const { userId, commenttxt, postid } = req.body
    const post = await Post.findById(postid)
    const user = await User.findOne({ clerkUserId: userId })

    if (!post) {
        return res.status(404).json(new apiResponse(404, {}, "Post not found"));
    }
    if (!user) {
        return res.status(404).json(new apiResponse(404, {}, "No user found"));
    }
    const userName = user.userName
    const userAvatar = user.avatarUrl
    const comment = {
        userId,
        userName,
        userAvatar,
        commenttxt
    }
    if (!commenttxt || commenttxt.trim() === '') {
        return res.status(401).json(new apiResponse(401, {}, "Can't send Empty Comments"));
    }
    post.comments.push(comment)
    await post.save()

    return res.status(200).json(new apiResponse(200, { post }, "Successfull"))


})



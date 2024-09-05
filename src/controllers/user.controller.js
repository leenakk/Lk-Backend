import asyncHandler from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { Post } from "../models/post.model.js";

const createUser = asyncHandler(async (data) => {
    try {
        const user = await User.create({
            clerkUserId: data.data.id,
            firstName: data.data.first_name,
            lastName: data.data.last_name,
            userName: data.data.username,
            email: data.data.email_addresses[0].email_address,
            avatarUrl: data.data.profile_image_url
        });

        console.log(`User created successfully: ${user._id}`);
    } catch (error) {
        console.log("Create User Error:", error);
    }
});
const deleteUser = asyncHandler(async (data) => {
    try {
        await User.deleteOne({ clerkUserId: data.data.id });
        console.log(`User deleted successfully: ${data.data.id}`);
    } catch (error) {
        console.log("Delete User Error:", error);
    }
});

const updateUser = asyncHandler(async (data) => {
    try {
        await User.updateOne({ clerkUserId: data.data.id }, {
            firstName: data.data.first_name,
            lastName: data.data.last_name,
            userName: data.data.username,
            email: data.data.email_addresses[0].email_address,
            avatarUrl: data.data.profile_image_url
        });
        console.log(`User updated successfully: ${data.data.id}`);
    } catch (error) {
        console.log("Update User Error:", error);
    }
});

const getAllusers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find()
        if (!users) {
            throw new ApiError(404, "no users found")
        }
        return res.status(200).json(new apiResponse(200, { users }, "Users fetched Successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong")
        console.log(error);
    }
    // Route to get all users
    // try {
    //     const users = await Clerk.users.getUserList();
    //     res.status(200).json(new apiResponse(200, users, "Users fetched successfully"));
    // } catch (error) {
    //     console.error("Error fetching users:", error);
    //     res.status(500).json(new ApiError(500, "Failed to fetch users"));
    // }
})

const deleteUserByAdmin = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            throw new ApiError(404, 'User ID not provided');
        }

        // Find the user in your database
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        // Delete all posts associated with this user
        await Post.deleteMany({ userId: user.clerkUserId });

        // Delete the user from Clerk
        // await Clerk.users.deleteUser(user.clerkUserId);

        return res.status(200).json(new apiResponse(200, { user }, "User deleted successfully"));
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "Something went wrong");
    }
});


export { createUser }
export { deleteUser }
export { updateUser }
export { getAllusers }
export { deleteUserByAdmin }
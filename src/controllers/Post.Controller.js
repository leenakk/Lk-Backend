import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/Cloudinary.js";
import { Post } from "../models/post.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { sendMail } from "../utils/mailSender.js";

const createPost = asyncHandler(async (req, res) => {
    try {
        const { userId, price, caption, productName } = req.body;
        const user = await User.findOne({ clerkUserId: userId })
        if (!user) {
            return res.status(404).json(new apiResponse(404, {}, "No user found"))
        }
        if (!price && !caption) {
            return res.status(401).json(new apiResponse(401, {}, `price & caption is required`))
        }
        if (!price) {
            return res.status(401).json(new apiResponse(401, {}, `price is required`))
        }
        if (!caption) {
            return res.status(401).json(new apiResponse(401, {}, `caption is required`))
        }
        if (!productName) {
            return res.status(401).json(new apiResponse(401, {}, `Product name is required`))
        }
        // const userName = user.userName
        // const userAvatar = user.avatarUrl
        // const useremail = user.email
        const postImageLocalPath = req.file?.path;
        const postImage = await uploadOnCloudinary(postImageLocalPath);
        if (!postImage || !postImage.url) {
            res.status(500).json(new apiResponse(500, {}, "Image Upload failed"))
        }

        const post = await Post.create({
            clerkUserId: userId,
            productName,
            caption,
            price,
            postImage: postImage.url
        });
        if (!post) {
            throw new ApiError(500, "Something went wrong while creating a post")
        }

        return res.status(200).json(new apiResponse(200, { post }, "Post has been created"));
    } catch (error) {
        console.log(error);

    }

});

const likeController = asyncHandler(async (req, res) => {
    const { postid, userId } = req.body;

    const post = await Post.findById(postid);
    const user = await User.findOne({ clerkUserId: userId });

    if (!post) {
        return res.status(404).json(new apiResponse(404, {}, "Post not found"));
    }
    if (!user) {
        return res.status(404).json(new apiResponse(404, {}, "No user found"));
    }

    const userIndex = post.likedBy.indexOf(user._id);
    let update;

    if (userIndex === -1) {
        // User has not liked the post yet, so we add their like
        update = {
            $inc: { likes: 1 },
            $push: { likedBy: user._id }
        };
    } else {
        // User has already liked the post, so we remove their like
        update = {
            $inc: { likes: -1 },
            $pull: { likedBy: user._id }
        };
    }

    // Atomically update the post
    const updatedPost = await Post.findOneAndUpdate(
        { _id: postid },
        update,
        { new: true } // Return the updated document
    );

    return res.status(200).json(new apiResponse(200, { post: updatedPost }, "Successful"));
});

const statusUpdate = asyncHandler(async (req, res) => {
    try {
        const { emails, status, postIds } = req.body;

        if (!Array.isArray(postIds) || postIds.length === 0) {
            return res.status(400).json(new apiResponse(400, {}, "Invalid input: postIds should be a non-empty array"));
        }

        const posts = await Post.find({ _id: { $in: postIds } });
        // const emails = posts.map(post => post.useremail);

        if (posts.length !== postIds.length) {
            return res.status(404).json(new apiResponse(404, {}, "One or more posts not found"));
        }

        // Update the status for the posts
        await Post.updateMany(
            { _id: { $in: postIds } },
            { $set: { status: status } }
        );

        // Create professional email content based on status
        let subject;
        let htmlContent;
        let textContent;

        if (status === 'approved') {
            subject = "Your Post Has Been Approved";
            htmlContent = `
                <h1>Congratulations!</h1>
                <p>We are pleased to inform you that your post has been <strong>approved</strong> by the admin.</p>
                <p>Thank you for your contribution.</p>
                <p>Best regards,</p>
                <p>The LK Team</p>
            `;
            textContent = "Congratulations! Your post has been approved by the admin. Thank you for your contribution. Best regards, The Admin Team";
        } else if (status === 'rejected') {
            subject = "Update on Your Post Status";
            htmlContent = `
                <h1>Important Update</h1>
                <p>We regret to inform you that your post has been <strong>rejected</strong> by the admin.</p>
                <p>If you have any questions or would like to discuss further, please feel free to contact us.</p>
                <p>Best regards,</p>
                <p>The LK Team</p>
            `;
            textContent = "Important Update: Your post has been rejected by the admin. If you have any questions or would like to discuss further, please feel free to contact us. Best regards, The Admin Team";
        } else {
            return res.status(400).json(new apiResponse(400, {}, "Invalid status value"));
        }

        const emailInfo = await sendMail({
            from: 'LK <A7la-lk@hotmail.com>',
            emails,
            subject: subject,
            html: htmlContent,
            text: textContent
        });

        return res.status(200).json(new apiResponse(200, { emailInfo }, "Status Updated Successfully for all posts"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new apiResponse(500, {}, `${error}`));
    }
});



const deletePost = asyncHandler(async (req, res) => {
    const { postid } = req.body
    const result = await Post.findByIdAndDelete(postid)
    if (!result) {
        res.status(404).json(new apiResponse(404, {}, "Post not found"))
    }
    return res.status(200).json(new apiResponse(200, {}, "Post Deleted Successfully"))

})

const editPost = asyncHandler(async (req, res) => {
    try {
        const { postid, caption, price, productName, discount } = req.body;

        const updates = {
            caption,
            price,
            productName,
            discount
        };

        if (req.file && req.file.path) {
            const postImageLocalPath = req.file.path;
            const Image = await uploadOnCloudinary(postImageLocalPath);

            if (!Image || !Image.url) {
                return res.status(500).json(new apiResponse(500, {}, "Image Upload failed"));
            }

            updates.postImage = Image.url; // Only update postImage if a new image is uploaded
        }

        const post = await Post.findById(postid);


        const updatedPost = await Post.findByIdAndUpdate(postid, updates, {
            new: true
        });

        if (!updatedPost) {
            return res.status(404).json(new apiResponse(404, {}, "Post not found"));
        }

        post.status = 'pending';
        await post.save();

        return res.status(200).json(new apiResponse(200, { post }, "Post edited successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, {}, `${error}`));
    }
});

export const addDiscount = asyncHandler(async (req, res) => {
    try {
        const { postId, userId, discount } = req.body

        const post = await Post.findById(postId)
        if (!post) {
            return res.json(new apiResponse(404, {}, "Post not found"));
        }
        if (!discount) {
            return res.json(new apiResponse(404, {}, "Discount is required"));
        }
        const discountamount = post.price * discount / 100;
        const newPrice = post.price - discountamount;
        post.discount = discount
        post.price = newPrice
        await post.save()
        const filterUser = await User.findOne({ clerkUserId: userId });
        if (!filterUser) {
            return res.status(404).json(new apiResponse(404, {}, "User not found"));
        }
        const ownerName = filterUser.userName
        const filteremail = filterUser.email;

        const users = await User.find();
        if (!users) {
            return res.status(404).json(new apiResponse(404, {}, "Users not found"));
        }

        const emails = users.map(user => user.email);

        const filteredEmails = emails.filter(email => email !== filteremail);
        const emailSubject = "Exclusive Discount on Your Favorite Products!";
        const emailHtml = `
            <p>Dear Customer,</p>
            <p>We are excited to announce an exclusive discount on a product by ${ownerName}!</p>
            <p>Enjoy a ${discount}% discount on ${post.productName}. Don't miss this limited-time offer!</p>
            <p>Best regards,<br/>Your Company Name</p>
        `;
        const emailText = `Dear Customer, We are excited to announce an exclusive discount on our products! Enjoy a ${discount}% discount on ${post.productName}. Don't miss this limited-time offer! Best regards, Your Company Name`;

        // Send the email to all filtered users
        await sendMail({
            from: 'LK <A7la-lk@hotmail.com>',
            emails: filteredEmails.join(','),
            subject: emailSubject,
            html: emailHtml,
            text: emailText
        });


        console.log(filteredEmails);

        return res.status(200).json(new apiResponse(200, {}, "Discount Added Successfully"))
    } catch (error) {
        console.log(error);

    }

})


export const removeDiscount = asyncHandler(async (req, res) => {
    try {
        const { userId, postId } = req.body;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json(new apiResponse(404, {}, "Post not found"));
        }

        if (post.discount === 0) {
            return res.json(new apiResponse(404, {}, "No Discount on this post"))

        }
        const originalPrice = post.price / (1 - post.discount / 100); // Reverse the discount
        console.log(originalPrice);
        post.price = originalPrice;
        post.discount = 0;
        const filterUser = await User.findOne({ clerkUserId: userId });
        if (!filterUser) {
            return res.status(404).json(new apiResponse(404, {}, "User not found"));
        }
        const ownerName = filterUser.userName
        const filteremail = filterUser.email;

        const users = await User.find();
        if (!users) {
            return res.status(404).json(new apiResponse(404, {}, "Users not found"));
        }

        const emails = users.map(user => user.email);

        const filteredEmails = emails.filter(email => email !== filteremail);
        // Compose the email content for discount removal
        const emailSubject = "Update: Discount Removal Notification";
        const emailHtml = `
            <p>Dear Customer,</p>
            <p>We wanted to inform you that the previous discount on ${post.productName} has been removed by ${ownerName}.</p>
            <p>We appreciate your understanding and continued support.</p>
            <p>Best regards,<br/>Your Company Name</p>
        `;
        const emailText = `Dear Customer, We wanted to inform you that the previous discount on ${post.productName} has been removed. We appreciate your understanding and continued support. Best regards, Your Company Name`;

        // Send the email to all filtered users
        await sendMail({
            from: 'LK <A7la-lk@hotmail.com>',
            emails: filteredEmails.join(','),
            subject: emailSubject,
            html: emailHtml,
            text: emailText
        });



        await post.save();

        return res.status(200).json(new apiResponse(200, { post }, "Discount removed successfully"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new apiResponse(500, {}, `${error}`));
    }
});


export const getAllPosts = asyncHandler(async (req, res) => {
    try {
        const posts = await Post.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'clerkUserId',
                    foreignField: 'clerkUserId',
                    as: 'userDetails'
                }
            },
            { $unwind: '$userDetails' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'comments.userId',
                    foreignField: 'clerkUserId',
                    as: 'commentUserDetails'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'purchasedBy.userId',
                    foreignField: 'clerkUserId',
                    as: 'purchasedUserDetails'
                }
            },
            {
                $addFields: {
                    comments: {
                        $map: {
                            input: '$comments',
                            as: 'comment',
                            in: {
                                _id: '$$comment._id',
                                userId: '$$comment.userId',
                                userName: {
                                    $arrayElemAt: [
                                        '$commentUserDetails.userName',
                                        {
                                            $indexOfArray: [
                                                '$commentUserDetails.clerkUserId',
                                                '$$comment.userId'
                                            ]
                                        }
                                    ]
                                },
                                userAvatar: {
                                    $arrayElemAt: [
                                        '$commentUserDetails.avatarUrl',
                                        {
                                            $indexOfArray: [
                                                '$commentUserDetails.clerkUserId',
                                                '$$comment.userId'
                                            ]
                                        }
                                    ]
                                },
                                commenttxt: '$$comment.commenttxt',
                                createdAt: '$$comment.createdAt'
                            }
                        }
                    },
                    purchasedBy: {
                        $map: {
                            input: '$purchasedBy',
                            as: 'purchase',
                            in: {
                                _id: '$$purchase._id',
                                userId: '$$purchase.userId',
                                userName: {
                                    $arrayElemAt: [
                                        '$purchasedUserDetails.userName',
                                        {
                                            $indexOfArray: [
                                                '$purchasedUserDetails.clerkUserId',
                                                '$$purchase.userId'
                                            ]
                                        }
                                    ]
                                },
                                userAvatar: {
                                    $arrayElemAt: [
                                        '$purchasedUserDetails.avatarUrl',
                                        {
                                            $indexOfArray: [
                                                '$purchasedUserDetails.clerkUserId',
                                                '$$purchase.userId'
                                            ]
                                        }
                                    ]
                                },
                                email: {
                                    $arrayElemAt: [
                                        '$purchasedUserDetails.email',
                                        {
                                            $indexOfArray: [
                                                '$purchasedUserDetails.clerkUserId',
                                                '$$purchase.userId'
                                            ]
                                        }
                                    ]
                                },
                                productName: '$$purchase.productName',
                                productImage: '$$purchase.productImage',
                                amount: '$$purchase.amount',
                                shippingAddress: '$$purchase.shippingAddress',
                                createdAt: '$$purchase.createdAt'
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    clerkUserId: 1,
                    productName: 1,
                    caption: 1,
                    postImage: 1,
                    price: 1,
                    status: 1,
                    'userDetails.userName': 1,
                    'userDetails.avatarUrl': 1,
                    'userDetails.email': 1,
                    likes: 1,
                    comments: 1,
                    purchasedBy: 1, // Updated purchasedBy with userName, userAvatar, and email
                    createdAt: 1
                }
            }
        ]);

        if (!posts || posts.length === 0) {
            return res.status(404).json(new apiResponse(404, {}, "No posts found"));
        }

        return res.json(new apiResponse(200, { posts }, "Posts fetched successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, {}, `${error}`));
    }
});




export const getUserPosts = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.body;

        const posts = await Post.aggregate([
            {
                $match: { clerkUserId: userId }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'clerkUserId',
                    foreignField: 'clerkUserId',
                    as: 'userDetails'
                }
            },
            { $unwind: '$userDetails' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'comments.userId',
                    foreignField: 'clerkUserId',
                    as: 'commentUserDetails'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'purchasedBy.userId',
                    foreignField: 'clerkUserId',
                    as: 'purchasedUserDetails'
                }
            },
            {
                $addFields: {
                    comments: {
                        $map: {
                            input: '$comments',
                            as: 'comment',
                            in: {
                                _id: '$$comment._id',
                                userId: '$$comment.userId',
                                userName: {
                                    $arrayElemAt: [
                                        '$commentUserDetails.userName',
                                        {
                                            $indexOfArray: [
                                                '$commentUserDetails.clerkUserId',
                                                '$$comment.userId'
                                            ]
                                        }
                                    ]
                                },
                                userAvatar: {
                                    $arrayElemAt: [
                                        '$commentUserDetails.avatarUrl',
                                        {
                                            $indexOfArray: [
                                                '$commentUserDetails.clerkUserId',
                                                '$$comment.userId'
                                            ]
                                        }
                                    ]
                                },
                                commenttxt: '$$comment.commenttxt',
                                createdAt: '$$comment.createdAt'
                            }
                        }
                    },
                    purchasedBy: {
                        $map: {
                            input: '$purchasedBy',
                            as: 'purchase',
                            in: {
                                _id: '$$purchase._id',
                                userId: '$$purchase.userId',
                                userName: {
                                    $arrayElemAt: [
                                        '$purchasedUserDetails.userName',
                                        {
                                            $indexOfArray: [
                                                '$purchasedUserDetails.clerkUserId',
                                                '$$purchase.userId'
                                            ]
                                        }
                                    ]
                                },
                                userAvatar: {
                                    $arrayElemAt: [
                                        '$purchasedUserDetails.avatarUrl',
                                        {
                                            $indexOfArray: [
                                                '$purchasedUserDetails.clerkUserId',
                                                '$$purchase.userId'
                                            ]
                                        }
                                    ]
                                },
                                email: {
                                    $arrayElemAt: [
                                        '$purchasedUserDetails.email',
                                        {
                                            $indexOfArray: [
                                                '$purchasedUserDetails.clerkUserId',
                                                '$$purchase.userId'
                                            ]
                                        }
                                    ]
                                },
                                productName: '$$purchase.productName',
                                productImage: '$$purchase.productImage',
                                amount: '$$purchase.amount',
                                shippingAddress: '$$purchase.shippingAddress',
                                createdAt: '$$purchase.createdAt'
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    clerkUserId: 1,
                    productName: 1,
                    caption: 1,
                    postImage: 1,
                    price: 1,
                    status: 1,
                    'userDetails.userName': 1,
                    'userDetails.avatarUrl': 1,
                    'userDetails.email': 1,
                    likes: 1,
                    comments: 1,
                    purchasedBy: 1, // Updated purchasedBy with userName, userAvatar, and email
                    createdAt: 1
                }
            }
        ]);

        if (!posts || posts.length === 0) {
            return res.status(404).json(new apiResponse(404, {}, "No posts found for this user"));
        }

        return res.json(new apiResponse(200, { posts }, "User's posts fetched successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new apiResponse(500, {}, `${error}`));
    }
});


export const deleteAllPosts = asyncHandler(async (data) => {
    try {
        await Post.deleteMany({ userId: data.data.id });
        console.log(`All posts deleted for user: ${data.data.id}`);
    } catch (error) {
        console.log("Delete Posts Error:", error);
    }
});

export { createPost };
export { likeController }
export { statusUpdate }
export { deletePost }
export { editPost }
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { addDiscount, createPost, deletePost, editPost, getAllPosts, getUserPosts, likeController, removeDiscount, statusUpdate } from "../controllers/Post.Controller.js";


export const postRouter = Router();
// post
postRouter.route('/post').post(
    upload.single("postImage"),
    createPost
);
postRouter.route('/post/deletePost').put(deletePost)
postRouter.route('/post').put(
    upload.single("postImage"),
    editPost
)
postRouter.route('/post/addDiscount').put(addDiscount)
postRouter.route('/post/removeDiscount').put(removeDiscount)

postRouter.route('/post').get(getAllPosts)
postRouter.route('/userPosts').post(getUserPosts)

// like, status etc
postRouter.route('/post/like').put(likeController)
postRouter.route('/post/statusUpdate').put(statusUpdate)


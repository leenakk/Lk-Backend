import { Router } from "express";
import { commentController } from "../controllers/comment.controller.js";


export const commentRouter = Router()

commentRouter.route('/postComment').put(commentController)
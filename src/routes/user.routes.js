import { Router } from "express";
import { deleteUserByAdmin, getAllusers } from "../controllers/user.controller.js";

export const userRouter = Router()

userRouter.route('/getAll').get(getAllusers)
userRouter.route('/deleteUser').delete(deleteUserByAdmin)


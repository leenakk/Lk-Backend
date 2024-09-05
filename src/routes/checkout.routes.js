import { Router } from "express";
import { stripeController } from "../controllers/Checkout.controller.js";

export const checkoutRouter = Router()

checkoutRouter.route('/create-checkout-session').post(stripeController)

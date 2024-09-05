import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { config } from "dotenv";
import { ApiError } from "./utils/apiError.js";
import { apiResponse } from "./utils/apiResponse.js";
import { createUser, deleteUser, updateUser } from "./controllers/user.controller.js";
import { deleteAllPosts } from "./controllers/Post.Controller.js";
import { Post } from "./models/post.model.js";
import Stripe from 'stripe';
import { sendMail } from "./utils/mailSender.js";



export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Load environment variables
config();

const app = express();

// const clerk = new Clerk({ apiKey: process.env.CLERK_API_KEY });


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));


// Webhook endpoint
app.post("/api/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
    try {
        console.log("Webhook received");

        // Parse raw body to JSON
        const parsedBody = JSON.parse(req.body.toString('utf8'));

        console.log("Parsed Payload:", parsedBody);

        if (parsedBody.type === 'user.created') {
            await createUser(parsedBody);
        }
        if (parsedBody.type === 'user.deleted') {
            await deleteUser(parsedBody);
            await deleteAllPosts(parsedBody);
        }
        if (parsedBody.type === 'user.updated') {
            await updateUser(parsedBody);
        }

        res.status(200).json({ status: 200, message: "Webhook processed successfully" });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(400).json({ status: 400, error: error.message });
    }
});


app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
    
    if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET_KEY is not set');
        return response.status(500).send('Webhook secret key is not configured');
    }

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`); 
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event && event.type === 'checkout.session.completed') {
        const checkoutSessionCompleted = event.data.object;

        // Extract metadata
        const userId = checkoutSessionCompleted.metadata.userId;
        const postId = checkoutSessionCompleted.metadata.postId;
        const owner = checkoutSessionCompleted.metadata.ownerEmail;
        const ownerName = checkoutSessionCompleted.metadata.ownerName;
        const userEmail = checkoutSessionCompleted.metadata.userEmail;
        const amount = checkoutSessionCompleted.metadata.amount;
        const productImage = checkoutSessionCompleted.metadata.productImage;
        const productName = checkoutSessionCompleted.metadata.productName;
        console.log(`amount ${amount}`);


        // Extract shipping details
        const shippingDetails = checkoutSessionCompleted.shipping_details;
        const shippingAddress = shippingDetails.address;
        const shippingCost = checkoutSessionCompleted.total_details.amount_shipping / 100;
        const totalAmount = (amount + shippingCost) / 100
        console.log(`total Amount ${totalAmount}`);


        try {
            const post = await Post.findById(postId);
            if (!post) {
                throw new apiResponse(404, {}, "Post not found");
            }

            const data = {
                userId,
                productName,
                productImage,
                amount,
                shippingAddress: {
                    line1: shippingAddress.line1,
                    line2: shippingAddress.line2,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postal_code: shippingAddress.postal_code,
                    country: shippingAddress.country,
                }
            };

            post.purchasedBy.push(data);
            await post.save();

            const emailHtml = `
                <h1>Transaction Successful</h1>
                <p>Dear ${userName},</p>
                <p>Thank you for your purchase! We are pleased to confirm your transaction was successful.</p>
                <h3>Order Details:</h3>
                <ul>
                    <li><strong>Product Name:</strong> ${productName}</li>
                    <li><strong>Product Image:</strong> ${productImage}</li>
                    <li><strong>Amount Paid:</strong>product price $${amount} and shipping Cost $${shippingCost}</li>
                </ul>
                <h3>Shipping Address:</h3>
                <p>${shippingAddress.line1}, ${shippingAddress.line2 ? shippingAddress.line2 + ',' : ''} ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.country} - ${shippingAddress.postal_code}</p>
                <p>We will notify you once your order is shipped.</p>
                <p>Thank you for shopping with us!</p>
                <p>Best regards,<br/>LK</p>
            `;

            await sendMail({
                from: "LK <A7la-lk@hotmail.com>",
                emails: userEmail,
                subject: "Your Order Confirmation - Transaction Successful",
                html: emailHtml,
            });


            // Email to owner
            const ownerEmailHtml = `
             <h1>New Order Received</h1>
             <p>Dear ${ownerName},</p>
             <p>You have received a new order on your post.</p>
             <h3>Order Details:</h3>
             <ul>
                 <li><strong>Product Name:</strong> ${productName}</li>
                 <li><strong>Product Image:</strong> ${productImage}</li>
                 <li><strong>Buyer Name:</strong> ${userName}</li>
                 <li><strong>Buyer Email:</strong> ${userEmail}</li>
                 <li><strong>Amount Paid:</strong> $${amount}</li>
                 <li><strong>Shipping Cost:</strong> $${shippingCost}</li>
             </ul>
             <h3>Shipping Address:</h3>
             <p>${shippingAddress.line1}, ${shippingAddress.line2 ? shippingAddress.line2 + ',' : ''} ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.country} - ${shippingAddress.postal_code}</p>
             <p>Please proceed with the necessary steps to fulfill the order.</p>
             <p>Best regards,<br/>LK System</p>
         `;

            await sendMail({
                from: "LK <A7la-lk@hotmail.com>",
                emails: owner,
                subject: "New Order Received",
                html: ownerEmailHtml,
            });

            console.log("Payment data successfully stored in database", data);

            return response.status(200).json(new apiResponse(200, { post }, "Transaction successfully processed"));
            response.sendStatus(200);
        } catch (err) {
            console.error(`Failed to process transaction: ${err.message}`);
            return response.status(500).send(`Failed to process transaction: ${err.message}`);
        }
    } else {
        console.error('Event is undefined or does not have a type property.');
        return response.status(400).send('Event is undefined or does not have a type property.');
    }

});

app.use(express.json({ limit: "20kb" }))
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// routes import

import { postRouter } from "./routes/post.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { commentRouter } from "./routes/comment.routes.js";
import { checkoutRouter } from "./routes/checkout.routes.js";

// routes declaration
app.use('/api', postRouter)
app.use('/api/user', userRouter)
app.use('/api/comment', commentRouter)
app.use('/api', checkoutRouter)


export default app;

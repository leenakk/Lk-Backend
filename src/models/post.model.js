import mongoose, { Schema } from "mongoose"

const postSchema = new mongoose.Schema({
    clerkUserId: {
        type: String,
        ref: "User",
        required: true
    },
    productName: {
        type: String
    },
    caption: {
        type: String,
        trim: true
    },
    postImage: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: "pending"
    },
    purchasedBy: [
        {
            userId: {
                type: String,
            },
            productName: {
                type: String
            },
            productImage: {
                type: String
            },
            amount: {
                type: Number
            },
            shippingAddress: {
                line1: {
                    type: String,
                },
                line2: {
                    type: String,
                },
                city: {
                    type: String,
                },
                state: {
                    type: String,
                },
                postal_code: {
                    type: String,
                },
                country: {
                    type: String,
                },
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    likes: {
        type: Number,
        default: 0,
    },
    likedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }

    ],
    comments: [
        {
            userId: {
                type: String,
                ref: "User",
                required: true
            },
            commenttxt: {
                type: String,
                trim: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]


}, { timestamps: true })

export const Post = mongoose.model("Post", postSchema)
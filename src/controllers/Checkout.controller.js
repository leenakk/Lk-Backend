import { stripe } from "../app.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { v4 as uuid } from 'uuid';

export const stripeController = asyncHandler(async (req, res) => {
    const product = req.body;
    const user = product.user; // Access the user data from the request body

    console.log("Product ", product);
    console.log("User ", user); // Log the user data

    const lineItems = [{
        price_data: {
            currency: "usd",
            product_data: {
                name: product.name,
                images: [product.productImage],
                description: `Product by ${product.productBy} <br> ${product.details}`,
            },
            unit_amount: product.price * 100, // Stripe expects amount in cents
        },
        quantity: 1,
    }];

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: "https://lk-jade.vercel.app/payments/successfull",
        cancel_url: "https://lk-jade.vercel.app/payments/cancelled",
        shipping_address_collection: {
            allowed_countries: [
                'AC', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AT', 'AU',
                'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL',
                'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CD',
                'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CW', 'CY',
                'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES',
                'ET', 'FI', 'FJ', 'FK', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH',
                'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK',
                'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IS', 'IT',
                'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY',
                'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA',
                'MC', 'MD', 'ME', 'MF', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ', 'MR', 'MS',
                'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NI', 'NL',
                'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL',
                'PM', 'PN', 'PR', 'PS', 'PT', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA',
                'SB', 'SC', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR',
                'SS', 'ST', 'SV', 'SX', 'SZ', 'TA', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK',
                'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY',
                'UZ', 'VA', 'VC', 'VE', 'VG', 'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA',
                'ZM', 'ZW'
            ],
        },
        shipping_options: [
            {
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: {
                        amount: 500, // 5 USD shipping cost
                        currency: 'usd',
                    },
                    display_name: 'Standard Shipping',
                    delivery_estimate: {
                        minimum: {
                            unit: 'business_day',
                            value: 5,
                        },
                        maximum: {
                            unit: 'business_day',
                            value: 7,
                        },
                    },
                },
            },
            {
                shipping_rate_data: {
                    type: 'fixed_amount',
                    fixed_amount: {
                        amount: 1500, // 15 USD shipping cost
                        currency: 'usd',
                    },
                    display_name: 'Express Shipping',
                    delivery_estimate: {
                        minimum: {
                            unit: 'business_day',
                            value: 1,
                        },
                        maximum: {
                            unit: 'business_day',
                            value: 3,
                        },
                    },
                },
            },
        ],
        metadata: {
            userId: user.id,
            postId: user.post,
            ownerEmail: user.owner,
            ownerName: product.productBy,
            userEmail: user.email,
            amount: product.price,
            productImage: product.productImage,
            productName: product.name
        }
    });

    res.json({ id: session.id });
});
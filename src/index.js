import { config } from "dotenv";
import express from 'express';
import dbConnection from "./db/index.js";
import app from "./app.js";

config({
    path: './.env'
});

dbConnection()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });
    })
    .catch(err => {
        console.log("Database connection failed!!", err);
    });

import mongoose from "mongoose";


const dbConnection = async () => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}`)
        console.log(`database connected !! host ${connection.connection.host}`);
    } catch (error) {
        console.log(`db connection error : ${error}`);
    }
}

export default dbConnection;
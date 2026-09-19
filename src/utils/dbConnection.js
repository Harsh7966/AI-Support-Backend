import mongoose from "mongoose";

const connectDb=async()=>{
    try{    
        const connectionString= process.env.CONNECTION_STRING;
        const connect= await mongoose.connect(connectionString);
        if(connect){
            console.log("MongoDb Connected Successfully!");
            return;
        }else{
            console.log("MongoDb Connection Failed!");
            exit(0);
        }
    }catch(err){
        console.log(err, "Db connection error");
    }
}

export default connectDb;
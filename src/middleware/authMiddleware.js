import jwt from "jsonwebtoken";

export const adminAuthMiddleware=(req, res, next) =>{
    try{
        const token = req.headers.authorization.split(" ").pop();
        const decodeToken= jwt.decode(token);
        if(decodeToken?.role !== "admin") return res.status(200).json({status: false, msg: "Unauthorized user"});
        res.admin= decodeToken;
        next();
    }catch(err){
        console.log(err);
    }
}


export const customerAuthMiddleware=(req, res, next) =>{
    try{
        const token = req.headers.authorization.split(" ").pop();
        const decodeToken= jwt.decode(token);
        if(decodeToken?.role !== "user") return res.status(200).json({status: false, msg: "Unauthorized user"});
        res.customer= decodeToken;
        next();
    }catch(err){
        console.log(err);
    }
}

export const agentAuthMiddleware=(req, res, next) =>{
    try{
        const token = req.headers.authorization.split(" ").pop();
        const decodeToken= jwt.decode(token);
        if(decodeToken?.role !== "agent") return res.status(200).json({status: false, msg: "Unauthorized user"});
        res.agent= decodeToken;
        next();
    }catch(err){
        console.log(err);
    }
}
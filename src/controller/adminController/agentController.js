import User from "../../Schema/auth/userSchema.js";

export const createAgent= async(req, res)=>{
    try{
        const {firstName, lastName, email, password, role}= req.body;

        const isUserExist= await User.findOne({email});
        if(isUserExist) return res.status(200).json({status: true, msg: "Email already exists"});
        const createAgt= await User.create({firstName, lastName, email, password, role});
        if(createAgt) return res.status(200).json({status: true, data: createAgt, msg: "Agent created successfully"});
    }catch(err){
        console.log(err);
    }
}

export const getAllAgent= async(req, res)=>{
    try{
        const allAgent= await User.find({isActive: true}).select("-password");
        if(allAgent.length === 0) return res.status(404).json({status: false, data: allAgent, msg: "No record found"});
        return res.status(200).json({status: true, data: allAgent, msg: "Record found"});
    }catch(err){
        console.log(err);
    }
}

export const getAgentDetails= async(req, res)=>{
    try{
        const agentDetails= await User.findById(req.params.id);
        if(!agentDetails) return res.status(404).json({status: false, data: agentDetails, msg: "Agent details not found"});
        return res.status(200).json({status: true, data: agentDetails, msg: "Agent details found"});
    }catch(err){
        console.log(err);
    }
}

export const updateAgent= async(req, res)=>{
    try{
        const {id}= req.params;
        const { firstName, lastName, email, password, role, phone, isEmailVerified, isActive }= req.body;
        const isExist= await User.findById(id);
        if(!isExist) return res.status(404).json({status: false, data: isExist, msg: "Agent not found"});
        if(firstName !== undefined) isExist.firstName= firstName;
        if(lastName !== undefined) isExist.lastName= lastName;
        if(email !== undefined) isExist.email= email;
        if(password !== undefined) isExist.password= password;
        if(role !== undefined) isExist.role= role;
        if(phone !== undefined) isExist.phone= phone;
        if(isEmailVerified !== undefined) isExist.isEmailVerified= isEmailVerified;
        if(isActive !== undefined) isExist.isActive= isActive;
        const updateAgt= await User.findByIdAndUpdate(id,
            {
                $set: isExist
            },
            {new: true}
        )
        if(updateAgt) return res.status(200).json({status: true, data: updateAgent, msg: "Agent updated successfully"});
    }catch(err){
        console.log(err);
    }
}

export default{
    createAgent,
    getAllAgent,
    getAgentDetails,
    updateAgent
}

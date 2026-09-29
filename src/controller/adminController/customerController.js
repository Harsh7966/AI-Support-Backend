import User from "../../Schema/auth/userSchema.js";

const AllCustomers= async(req, res)=>{
    try{
        const customers= await User.find({isActive: true});
        if(customers.length > 0){
            return res.status(200).json({
                status: true,
                msg: "Records found",
                data: customers
            })
        }else{
            return res.status(404).json({
                status: true,
                msg: "No Record found",
                data: customers
            })
        }
    }catch(err){
        console.log(err);
    }
}

const UpadteCustomer= async(req, res)=>{
    try{
        const customers= await User.findById(req.params.id);
        const {firstName, lastName, email, password, role, phone, isEmailVerified, isActive}= req.body;
        if(!customers){
            return res.status(404).json({
                status: false,
                msg: "User not found"
            })
        }

    }catch(err){
        console.log(err);
    }
}

export default{
    AllCustomers,
    UpadteCustomer
}


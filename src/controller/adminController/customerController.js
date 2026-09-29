import User from "../../Schema/auth/userSchema.js";

const getAllCustomers = async (req, res) => {
    try {
        const customer = await User.find({ role: "user" , isActive: true }).select("-password");

        if (customer.length > 0) {
            return res.status(200).json({
                status: true,
                data: customer,
                msg: "All customers found"
            });
        }

        return res.status(200).json({
            status: false,
            data: customer,
            msg: "No customers found"
        });

    } catch (err) {
        console.log(err);
    }
}

const getCustomerById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({
                status: false,
                msg: "User not found"
            })
        }

        return res.status(200).json({
            status: true,
            data: user,
            msg: "User details found"
        })
    } catch (err) {
        console.log(err);
    }
}

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.body, id);
        const { firstName, lastName, email, password, role, phone, isEmailVerified, isActive } = req.body;
        const customer= await User.findById(id);
        if(!customer) return res.status(200).json({status: false, msg: "Customer not found"});
        if(firstName !== undefined) customer.firstName= firstName;
        if(lastName !== undefined) customer.lastName= lastName;
        if(email !== undefined) customer.email= email;
        if(password !== undefined) customer.password= password;
        if(role !== undefined) customer.role= role;
        if(phone !== undefined) customer.phone= phone;
        if(isEmailVerified !== undefined) customer.isEmailVerified= isEmailVerified;
        if(isActive !== undefined) customer.isActive= isActive;
        const updateUser= await User.findByIdAndUpdate(
            id,
            {
                $set: customer
            },
            {new: true}
        )
        if(updateUser) return res.status(200).json({status: true, data: updateUser, msg: "User updated successfully"});
    } catch (err) {
        console.log(err);
    }
}

export default {
    getAllCustomers,
    getCustomerById,
    updateCustomer
}

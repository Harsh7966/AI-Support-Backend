import Category from "../../Schema/admin/categorySchema.js";

const getAllCategory= async(req, res)=>{
    try{
         const allCategory = await Category.find({isActive: true , isDeleted: false});
        if (allCategory.length > 0) return res.status(200).json({ status: true, msg: "Categories found", data: allCategory });
        return res.status(404).json({ status: false, msg: "No record found" });
    }catch(err){
        console.log(err);
    }
}

export default{
    getAllCategory
}
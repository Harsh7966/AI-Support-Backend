import Category from "../../Schema/admin/categorySchema.js";

const createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;

        const isExist = await Category.findOne({
            name:{
                $regex: `^${name}$`,
                $options: "i"
            }
        })

        if (isExist) return res.status(200).json({ status: false, msg: "Category already exists" });
        const addCategory = await Category.create({ name, description, isActive });
        if (addCategory) return res.status(200).json({ status: true, msg: "Category craeted successfully", data: addCategory });
    } catch (err) {
        console.log(err);
    }
}

const getAllCategory = async (req, res) => {
    try {
        const allCategory = await Category.find({isDeleted: false});
        if (allCategory.length > 0) return res.status(200).json({ status: true, msg: "Categories found", data: allCategory });
        return res.status(404).json({ status: false, msg: "No record found" });
    } catch (err) {
        console.log(err);
    }
}

const getCategoryDetails = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) return res.status(200).json({ status: true, msg: "Categories details found", data: category });
        return res.status(404).json({ status: false, msg: "No record found" });
    } catch (err) {
        console.log(err);
    }
}

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive, isDeleted } = req.body;
        const category = await Category.findById(req.params.id);
        if(!category) return res.status(404).json({ status: false, msg: "No record found" });
        if(name !== undefined) category.name= name;
        if(description !== undefined) category.description= description;
        if(isActive !== undefined) category.isActive= isActive;
        if(isDeleted !== undefined){
            category.isDeleted= isDeleted;
            category.isActive= isActive;
        } 
        const updatecategory = await Category.findByIdAndUpdate(id,{
            $set: category
        },{new: true});
        if (updatecategory) return res.status(200).json({ status: true, msg: "Categorie update successfully", data: updateCategory });
    } catch (err) {
        console.log(err);
    }
}

export default {
    createCategory,
    getAllCategory,
    getCategoryDetails,
    updateCategory
}

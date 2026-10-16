const {Product} = require("../models/Product");

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();

        if(!products || products.length === 0){
            return res.status(404).json({message: "No Product found"});
        }
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({message: "Error fetching products", error});
    }
}

const addProduct = async(req, res) => {
    try {
        const {name, sku, description, category, price , stockQuantity} = req.body;

        // Check if the product with the same SKU already exists for the user
        const existingProduct = await Product.findOne({userId: req.user._id, sku});
        if(existingProduct){
            return res.status(400).json({message: "Product with this SKU already exists"});
        }

        // Create a new product
        const product = new Product({name, sku, description, category, price, stockQuantity, userId: req.user._id});
        await product.save();

        res.status(201).json({message: "Product added successfully"});
    } catch (error) {
        res.status(500).json({message: "Error adding product", error});
    }
}

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if(!product){
            return res.status(404).json({message: "Product not found"});
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({message: "Error fetching product", error});
    }
}

const updateProduct = async (req, res) => {
    try {
        const {name, sku, description, category, price , stockQuantity} = req.body;

        const product = await Product.findByIdAndUpdate(req.params.id, {name, sku, description, category, price, stockQuantity}, {new: true});

        if(!product){
            return res.status(404).json({message: "Product not found"});
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({message: "Error updating product", error});
    }
}

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if(!product){
            return res.status(404).json({message: "Product not found"});
        }
        res.status(200).json({message: "Product deleted successfully"});
    } catch (error) {
        res.status(500).json({message: "Error deleting product", error});
    }
}

module.exports = {
    getAllProducts,
    addProduct,
    getProductById,
    updateProduct,
    deleteProduct
}
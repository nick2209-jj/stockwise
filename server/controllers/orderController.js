const {Order, Product, User} = require("../models");

const orderController = {
    async createOrder(req, res) {
        try {
            const { productId, customer_name, contact, quantity } = req.body;
            const product  = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            // Continue with order creation logic
            const order = new Order({
                productId,
                customer_name,
                contact,
                quantity,
                userId: req.user._id, // Assuming you have user authentication and req.user is available
            });
        } catch (error) {
            res.status(500).json({ message: "Error creating order", error });
        }
    }
};
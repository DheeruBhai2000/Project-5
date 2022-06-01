const cartModel = require("../model/cartModel")
const userModel = require("../model/userModel")
const productModel = require("../model/productModel")
const validator = require("../validator/validator")

// create cart If not Exist and Add product, if already exist Add Product Only

const createCart = async (req, res) => {
    try {
        let reqBody = req.body
        const userId = req.params.userId

        if(Object.keys(reqBody).length==0){
            return res.status(400).send({status:false, message:"Empty request body"})
        }

        const items = JSON.parse(reqBody.items)

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Not a valid UserId" })
        }

        if(validator.isValidBody(items)) {
           if(validator.isValidBody(items.productId)){
               if(!validator.isValidObjectId(items.productId)){
                return res.status(400).send({ status: false, message: "Invalid Product Id" });
               }
           }
           else{
                return res.status(400).send({ status: false, message: "Product ID is Empty" });
            }
            if (items.quantity) {
                //    if(typeof(items.quantity)!=Number){
                //    return res.status(400).send({ status: false, message: "Quantity is not Number Type" });
                //    }
            }
            else {
                return res.status(400).send({ status: false, message: "Quantity is not provided" });
            }

        }
        else {
            return res.status(400).send({ status: false, message: "Items is not given" });
        }

        const isProduct = await productModel.findOne({ _id: items.productId, isDeleted: false })
        if (!isProduct) {
            return res.status(404).send({ status: false, message: "No Product exist with given Product Id" })
        }

        const isCartExist = await cartModel.findOne({ userId: userId })

        if (isCartExist) {
            let count = isCartExist.totalItems + parseInt(items.quantity)
            let total = isCartExist.totalPrice + items.quantity * isProduct.price

            console.log(count);


            let existInCart = await cartModel.findOneAndUpdate({ userId: userId, "items.productId": items.productId }, {
                totalPrice: total,
                $inc: {
                    
                    "items.$.quantity": items.quantity,
                },
            }, { new: true });

            if (existInCart) {
                return res.status(200).send({ status: true, message: "cart Updated", data: existInCart })
            }
            
            let updatedcart = await cartModel.findOneAndUpdate({userId:userId},
                 {$push:{items:{productId:items.productId, quantity:parseInt(items.quantity)}},
                 $inc: {
                    
                    "totalItems": +1,

                }, totalPrice:total}, {new:true})
            return res.status(200).send({status:true, message:"cart Updated", data:updatedcart})
        }

        let totalPrice = items.quantity * isProduct.price

        const newCart = {
            userId: userId,
            items: [{
                productId: items.productId,
                quantity: parseInt(items.quantity)
            }],
            totalItems: 1,
            totalPrice:totalPrice

        }

        const cart = await cartModel.create(newCart)
        res.status(200).send({ status: true, message: " new Cart Created", data: cart })

    } catch (error) {
        console.log(error.message);
        res.status(500).send({ status: false, message: error.message })
    }
};


// ================================  GET  CART    ==================================
const getCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid User id " })
        }
        const existUser = await userModel.findById(userId);
        if (!existUser) {
            return res.status(404).send({ status: false, message: "User Does Not Exist" })
        }
        const existCart = await cartModel.findOne({ userId: userId })
        if (!existCart) {
            return res.status(404).send({ status: false, message: `Cart Does Not Exist for this ${userId} userId` })
        }
        //   --------------------   Autherization  Here    ---------------------------
        // if (req.loggedInUser != userId) {
        //     return res.status(401).send({ status: false, message: "Unautherize to make changes" })
        // }
        const productDetails = []
        const productsIds = existCart.items
        for (let i = 0; i < productsIds.length; i++) {
            productDetails.push(await productModel.findById(productsIds[i].productId))
        }
        // const productDetails = await productModel.find()
        //// kaise access kre ek cart me multiple product k id hoga

        res.status(200).send({ status: true, message: "Cart Summary here", data: productDetails })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
};

//===============================Update Api===============================
const updateCart = async function(req, res){
    try{
        let userId= req.params.userId
        let requestBody= req.body;

        const {productId, cartId, removeProduct} = requestBody // Destructuring

        //-------------userId exist check and validation-------------------
        if(!validator.isValidObjectId(userId)){
            return res.status(400).send({status:false, message:"Please Provide a valid User Id in path params"})
        }
        let userExist= await userModel.findOne({_id : userId})
        if(!userExist){
            return res.status(404).send({status:false, message:"User ID not found by ID given in params"})
        }
        //------------ Authorization Here -------------



        //-------------------RequestBody empty check---------------------
        if(!validator.isValidBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide mandatory field in request body to Remove products from cart" });
        }
        // if(!Object.keys(items).length ==0){
        //     return res.status(400).send({ status: false, message: "Please provide items in request body to Remove product" });
        // }
        //------------------Cart Exist check and validation-----------------------
        if(!validator.isValidBody(cartId) || !validator.isValidObjectId(cartId)){
            return res.status(400).send({status: false, message: "Please provide a valid cartId"})
        }
        const cartExist = await cartModel.findOne({_id: cartId})
        if(!cartExist){
            return res.status(404).send({status:false, message:"cart does not exist with given cartId"})
        }
        //------------------Product Existance check and validation-------------
        if(!validator.isValidBody(productId)|| !validator.isValidObjectId(productId)){
            return res.status(400).send({status: false, message: "Please provide a valid productId"})
        }
        const productCheck = await productModel.findOne({_id:productId, isDeleted:false})
        if(!productCheck){
            return res.status(404).send({status: false, message:"product Does not exists in DataBase with given productId in request body"})
        }
        //-----------------Remove Products-------------------------
        if(!validator.isValidBody(removeProduct) || !validator.isValidBinary(removeProduct)){
            return res.status(400).send({status:false, message:"Please enter a valid removeProduct key with value either '0' or '1' . "})
        }
        //---------------removeProduct is '1' -----------------
        if(removeProduct===1){
            cartUpdate = await cartModel.findOneAndUpdate({})
        }

        //--------------- Push Updated things to DB ---------------
    
        console.log("done")

    }
    catch(err){
        res.status(500).send({status: false, message: err.message})
    }
}

//  =======================================   DELETE   CART  ================================
const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Enter Valid Userid" })
        }
        const existCart = await cartModel.findOne({ userId: userId });
        if (!existCart || existCart.totalItems == 0) {
            return res.status(404).send({ status: false, message: "Cart Does Not Exist Or Allready Deleted" })
        }
        //  --------   Autherization  Here   ------------
        // if (req.loggedInUser != userId) {
        //     return res.status(401).send({ status: false, message: "Unautrherize To Make Changes" })
        // }
        await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [0], totalItems: 0, totalPrice: 0 } }, { new: true });
        res.status(200).send({ status: false, message: "Cart Deleted SuccessFully" })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createCart, getCart, deleteCart, updateCart }

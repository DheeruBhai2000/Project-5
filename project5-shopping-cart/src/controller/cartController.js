const cartModel = require("../model/cartModel")
const userModel = require("../model/userModel")
const productModel = require("../model/productModel")
const validator = require("../validator/validator")

// create cart If not Exist and Add product, if already exist Add Product Only

const createCart = async (req, res) => {
    try {
        let reqBody = req.body
        const userId = req.params.userId
        const productId = req.body.productId
        const cartId = req.body.cartId

        if(Object.keys(reqBody).length==0){
            return res.status(400).send({status:false, message:"Empty request body"})
        }
        console.log(productId);

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Not a valid UserId" })
        }
        if(!req.body.productId || productId.length==0 ){
            return res.status(400).send({ status: false, message: "ProductId is not given" })
        }
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Not a valid productId" })
        }
        if(cartId){
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Not a valid cartId" })
        }
        }

        const isUser = await userModel.findById(userId)
        if(!isUser){
            return res.status(404).send({ status: false, message: "No User exist with given user Id" })
        }

        const isProduct = await productModel.findOne({ _id:productId, isDeleted: false })
        if (!isProduct) {
            return res.status(404).send({ status: false, message: "No Product exist with given Product Id" })
        }

        const isCartExist = await cartModel.findOne({ $or:[{userId: userId} , {_id:cartId}]})

        if (isCartExist) {
            let count = isCartExist.totalItems +  1
            let total = isCartExist.totalPrice +  isProduct.price

            let productExistInCart = await cartModel.findOneAndUpdate({ userId: userId, "items.productId": productId }, {
             totalPrice: total,
             $inc: {
                    "items.$.quantity":  +1,
                    },
             }, { new: true }
            );
                
            if (productExistInCart) {
                 return res.status(200).send({ status: true, message: "cart Updated", data: productExistInCart })
                }

        let updatedcart = await cartModel.findOneAndUpdate({userId:userId},
            {$push:{items:{productId:productId, quantity: 1}},
             $inc: {
                    "totalItems": +1,
                   }, totalPrice:total}, {new:true})
            if(updateCart){
                return res.status(200).send({status:true, message:"cart Updated", data:updatedcart})
                }
         }
        const newCart = {
            userId: userId,
            items: [{
                productId: isProduct._id,
                quantity: 1
            }],
            totalItems: 1,
            totalPrice:isProduct.price

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

        // res.status(200).send({ status: true, message: "Cart Summary here", data: productDetails })
        // res.status(200).send({ status: true, message: "Cart Summary here", data: existCart })
        res.status(200).send({ status: true, message: "Cart Summary here", data: [existCart, productDetails] })
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
        let cartExist = {}

        const {productId, cartId, removeProduct} = requestBody // Destructuring

        //-------------userId exist check and validation-------------------
        if(!validator.isValidObjectId(userId)){
            return res.status(400).send({status:false, message:"Please Provide a valid User Id in path params"})
        }
        let userExist = await userModel.findOne({ _id: userId })
        if (!userExist) {
            return res.status(404).send({ status: false, message: "User ID not found by ID given in params" })
        }
        //------------ Authorization Here -------------



        //-------------------RequestBody empty check---------------------
        if(!validator.isValidBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide mandatory field in request body to Remove products from cart" });
        }
        //------------------Cart Exist check and validation-----------------------
        if(!validator.isValidBody(cartId) || !validator.isValidObjectId(cartId)){
            return res.status(400).send({status: false, message: "Please provide a valid cartId"})
        }
        cartExist = await cartModel.findOne({_id: cartId}) // DB call------------
        if(!cartExist){
            return res.status(404).send({status:false, message:"cart does not exist with given cartId"})
        }
        //-----------------Remove Products-------------------------
        if(!validator.isValidBody(removeProduct) || !validator.isValidBinary(removeProduct)){
            return res.status(400).send({status:false, message:"Please enter a valid removeProduct key with value either '0' or '1' . "})
        }
        //------------------Product Existance check and validation-------------
        if(!validator.isValidBody(productId)|| !validator.isValidObjectId(productId)){
            return res.status(400).send({status: false, message: "Please provide a valid productId"})
        }
        const productCheck = await productModel.findOne({_id:productId, isDeleted:false})
        if(!productCheck){
            return res.status(404).send({status: false, message:"product Does not exists in DataBase with given productId in request body"})
        }
        //---------------Updating cart with checking product------------------
    if(productId){
        for(let i=0; i<cartExist.items.length; i++){
            if(cartExist.items[i].productId == productId && cartExist.items[i].quantity>0){
                if(removeProduct===1){
                    cartExist.items[i].quantity -=1
                    cartExist.totalPrice -= productCheck.price
                    console.log(cartExist.items[i].quantity)
                    console.log(cartExist)
                    // newCart === cartExist
                }
                if(removeProduct===0){
                    cartExist.totalItems -=1
                    cartExist.totalPrice -= (cartExist.items[i].quantity*productCheck.price)
                    cartExist.items.remove(cartExist.items[i])
                    console.log(cartExist)
                    // newCart === cartExist
                }  
            }       
            if(cartExist.items[i].productId == productId && cartExist.items[i].quantity===0){
                cartExist.items.remove(cartExist.items[i])
                return res.status(404).send({status:false, message:"The Product has 0 quantity, and Consider as a deleted Product in cart."})
            }
        }
    }
    
    else{
            return res.status(404).send({status:false, message:"Product does not exist in the cart"})
    } 
        
        //--------------- Push Updated things to DB ---------------

        const updatingCart = await cartModel.findOneAndUpdate({_id:cartId},
            {$set:{totalPrice:cartExist.totalPrice, totalItems:cartExist.totalItems, items: cartExist.items}}, {new: true})
        return res.status(200).send({status:true,message:"Success",data:updatingCart})
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
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



// const createCart = async (req, res) => {
//     try {
//         let reqBody = req.body
//         const userId = req.params.userId
//         const productId = req.body.productId
//         const cartId = req.body.cartId

//         if(Object.keys(reqBody).length==0){
//             return res.status(400).send({status:false, message:"Empty request body"})
//         }

//         const items = JSON.parse(reqBody.items)

//         if (!validator.isValidObjectId(userId)) {
//             return res.status(400).send({ status: false, message: "Not a valid UserId" })
//         }

//         if(validator.isValidBody(items)) {
//            if(validator.isValidBody(items.productId)){
//                if(!validator.isValidObjectId(items.productId)){
//                 return res.status(400).send({ status: false, message: "Invalid Product Id" });
//                }
//            }
//            else{
//                 return res.status(400).send({ status: false, message: "Product ID is Empty" });
//             }
//             if (items.quantity) {
//                 //    if(typeof(items.quantity)!=Number){
//                 //    return res.status(400).send({ status: false, message: "Quantity is not Number Type" });
//                 //    }
//             }
//             else {
//                 return res.status(400).send({ status: false, message: "Quantity is not provided" });
//             }

//         }
//         else {
//             return res.status(400).send({ status: false, message: "Items is not given" });
//         }

//         const isProduct = await productModel.findOne({ _id: items.productId, isDeleted: false })
//         if (!isProduct) {
//             return res.status(404).send({ status: false, message: "No Product exist with given Product Id" })
//         }

//         const isCartExist = await cartModel.findOne({ userId: userId })

//         if (isCartExist) {
//             let count = isCartExist.totalItems + parseInt(items.quantity)
//             let total = isCartExist.totalPrice + items.quantity * isProduct.price

//             console.log(count);


//             let productExistInCart = await cartModel.findOneAndUpdate({ userId: userId, "items.productId": items.productId }, {
//                 totalPrice: total,
//                 $inc: {
                    
//                     "items.$.quantity": items.quantity || +1,
//                 },
//             }, { new: true });

//             if (productExistInCart) {
//                 return res.status(200).send({ status: true, message: "cart Updated", data: productExistInCart })
//             }
            
//             let updatedcart = await cartModel.findOneAndUpdate({userId:userId},
//                  {$push:{items:{productId:items.productId, quantity:parseInt(items.quantity)}},
//                  $inc: {
                    
//                     "totalItems": +1,

//                 }, totalPrice:total}, {new:true})
//             return res.status(200).send({status:true, message:"cart Updated", data:updatedcart})
//         }

//         let totalPrice = items.quantity * isProduct.price

//         const newCart = {
//             userId: userId,
//             items: [{
//                 productId: items.productId,
//                 quantity: parseInt(items.quantity)
//             }],
//             totalItems: 1,
//             totalPrice:totalPrice

//         }

//         const cart = await cartModel.create(newCart)
//         res.status(200).send({ status: true, message: " new Cart Created", data: cart })

//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send({ status: false, message: error.message })
//     }
// };
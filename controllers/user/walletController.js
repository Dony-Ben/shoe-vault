const Wallet = require("../../models/wallet.js");
const { STATUS_CODES } = require("../../constants/httpStatusCodes.js");

const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId, balance: 0, transactions: [] });
            await wallet.save();
        }
        res.render("user/wallet", { wallet, transactions: wallet.transactions });
    } catch (error) {
        console.error("Error loading wallet:", error);
        res.status(STATUS_CODES.InternalServerError).send("Internal Server Error");
    }
}


const addFunds = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        const { amount } = req.body;
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId, balance: 0, transactions: [] });
        } else {
            
            wallet.balance += amount;
            wallet.transactions.push({ type: "credit", amount });
        }
        let walletdata =  await wallet.save();
        res.status(STATUS_CODES.OK).json({ message: "Fund added successfully",  walletdata });
    } catch (error) {
        res.status(STATUS_CODES.InternalServerError).json({ message: "Server error", error });
    }
};

module.exports = {
    loadWallet,
    addFunds,
}
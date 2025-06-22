const Wallet = require("../../models/wallet.js");

const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            wallet = new Wallet({ userId, balance: 0, transactions: [] });
            await wallet.save();
        }
        res.render("user/wallet", { wallet });
    } catch (error) {
        console.error("Error loading wallet:", error);
        res.status(500).send("Internal Server Error");
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
        res.status(200).json({ message: "Funds added ayi",  walletdata });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

module.exports = {
    loadWallet,
    addFunds,
}
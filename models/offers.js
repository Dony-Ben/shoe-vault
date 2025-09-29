const mongoose = require('mongoose');
const { OFFER_TYPE, DISCOUNT_TYPE } = require('../constants/enums');
const { Schema } = mongoose;

const offerSchema = new Schema({
    offerName: {
        type: String,
        required: true,
        unique: true
    },
     offerType: {
        type: String,
        required: true,
        enum:OFFER_TYPE,
    },
    categories: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Category', 
        required: false
    }],
     products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    }],
    discountType: { 
    type: String, 
    required: true, 
    enum:DISCOUNT_TYPE,
    
  },
  discountValue: { 
    type: Number, 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
    isActive: {
        type: Boolean,
        default: true
    }
});
const Offer = mongoose.model('Offer', offerSchema);
module.exports = Offer;

export const RESPONSE_SUCCESS = {
    
    // Authentication
    login: "Login successful",
    signup: "Signup successful",
    resetpassword: "Password reset successfully please login",
    logout: "Logged out successfully",
    otpSent: "OTP sent successfully",
    otpVerified: "OTP verified successfully",
    otpResent: "OTP resent successfully",
    
    // User Management
    profileUpdated: "Profile updated successfully",
    addressAdded: "Address added successfully",
    addressUpdated: "Address updated successfully",
    addressDeleted: "Address deleted successfully",
    
    // Product Management
    productAdded: "Product added successfully",
    productUpdated: "Product updated successfully",
    productDeleted: "Product deleted successfully",
    productImageDeleted: "Product image deleted successfully",
    
    // Category Management
    categoryAdded: "Category added successfully",
    categoryUpdated: "Category updated successfully",
    categoryDeleted: "Category deleted successfully",
    categoryOfferAdded: "Category offer added successfully",
    categoryOfferRemoved: "Category offer removed successfully",
    
    // Brand Management
    brandAdded: "Brand added successfully",
    brandUpdated: "Brand updated successfully",
    brandDeleted: "Brand deleted successfully",
    
    // Order Management
    orderPlaced: "Order placed successfully",
    orderStatusUpdated: "Order status updated successfully",
    orderCancelled: "Order cancelled successfully",
    returnApproved: "Return approved successfully",
    returnRejected: "Return rejected successfully",
    
    // Cart & Wishlist
    itemAddedToCart: "Item added to cart successfully",
    itemRemovedFromCart: "Item removed from cart successfully",
    cartUpdated: "Cart updated successfully",
    itemAddedToWishlist: "Item added to wishlist successfully",
    itemRemovedFromWishlist: "Item removed from wishlist successfully",
    
    // Coupon Management
    couponAdded: "Coupon added successfully",
    couponUpdated: "Coupon updated successfully",
    couponDeleted: "Coupon deleted successfully",
    couponApplied: "Coupon applied successfully",
    couponRemoved: "Coupon removed successfully",
    
    // Wallet
    walletRecharged: "Wallet recharged successfully",
    refundProcessed: "Refund processed successfully",
    
    // General
    dataSaved: "Data saved successfully",
    dataUpdated: "Data updated successfully",
    dataDeleted: "Data deleted successfully",
    operationSuccessful: "Operation completed successfully"
}

export const RESPONSE_ERROR = {
    // Authentication Errors
    loginRequired: "Please login to continue",
    invalidCredentials: "Invalid email or password",
    userNotFound: "User not found. Please signup",
    userBlocked: "You are blocked by admin",
    emailAlreadyExists: "Email is already registered",
    invalidOtp: "Invalid OTP, please try again",
    otpExpired: "OTP has expired, please request a new one",
    sessionExpired: "Session expired, please login again",
    sessionNotFound: "Session data not found",
    unauthorized: "Unauthorized access",
    
    // Validation Errors
    allFieldsRequired: "All fields are required",
    passwordMismatch: "Passwords do not match",
    invalidPassword: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    invalidEmail: "Please enter a valid email address",
    invalidPhone: "Please enter a valid phone number",
    invalidData: "Invalid data provided",
    
    // Product Errors
    productNotFound: "Product not found",
    productOutOfStock: "Product is out of stock",
    productAlreadyExists: "Product already exists",
    invalidProductData: "Invalid product data",
    productImageRequired: "Product image is required",
    productImageUploadFailed: "Failed to upload product image",
    
    // Category Errors
    categoryNotFound: "Category not found",
    categoryAlreadyExists: "Category already exists",
    categoryInUse: "Cannot delete category as it contains products",
    categoryOfferExists: "Products with this category already have product offers",
    
    // Brand Errors
    brandNotFound: "Brand not found",
    brandAlreadyExists: "Brand already exists",
    brandInUse: "Cannot delete brand as it contains products",
    
    // Order Errors
    orderNotFound: "Order not found",
    orderAlreadyCancelled: "Order is already cancelled",
    orderCannotBeCancelled: "Order cannot be cancelled",
    invalidOrderStatus: "Invalid order status",
    paymentFailed: "Payment failed",
    paymentVerificationFailed: "Payment verification failed",
    orderCreationFailed: "Order creation failed",
    itemNotMarkedForReturn: "Item not marked for return",
    
    // Cart & Wishlist Errors
    itemNotFound: "Item not found",
    itemAlreadyInCart: "Item already in cart",
    itemAlreadyInWishlist: "Item already in wishlist",
    cartEmpty: "Cart is empty",
    wishlistEmpty: "Wishlist is empty",
    insufficientStock: "Insufficient stock available",
    
    // Coupon Errors
    couponNotFound: "Coupon not found",
    couponExpired: "Coupon has expired",
    couponAlreadyUsed: "Coupon already used",
    couponInvalid: "Invalid coupon code",
    couponMinimumAmount: "Minimum order amount not met for this coupon",
    
    // Wallet Errors
    insufficientWalletBalance: "Insufficient wallet balance",
    walletNotFound: "Wallet not found",
    refundFailed: "Refund failed",
    
    // File Upload Errors
    fileUploadFailed: "File upload failed",
    invalidFileType: "Invalid file type",
    fileSizeExceeded: "File size exceeded",
    noFileSelected: "No file selected",
    
    // Server Errors
    internalServerError: "Internal server error",
    serverError: "Server error",
    databaseError: "Database error",
    networkError: "Network error",
    serviceUnavailable: "Service unavailable",
    
    // General Errors
    operationFailed: "Operation failed",
    somethingWentWrong: "Something went wrong. Please try again",
    tryAgainLater: "Something went wrong. Please try again later",
    accessDenied: "Access denied",
    notFound: "Not found",
    badRequest: "Bad request",
    conflict: "Conflict occurred",
    tooManyRequests: "Too many requests",
    validationError: "Validation error"
}



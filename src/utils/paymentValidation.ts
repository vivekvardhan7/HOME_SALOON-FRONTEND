export const PATTERNS = {
    // Allow spaces for display, but regex checks digits
    CARD_NUMBER: /^[0-9]{16}$/,
    EXPIRY_DATE: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
    CVV: /^[0-9]{3}$/,
    NAME: /^[a-zA-Z\s]{1,50}$/,
    // Simple UPI regex: username@bank (alphanumeric, dot, underscore, hyphen)
    UPI_ID: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/,
    PHONE: /^[0-9]{10}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    WALLET_PHONE: /^[0-9]{10}$/,
};

export const MESSAGES = {
    CARD_NUMBER: "Card number must be exactly 16 digits",
    EXPIRY_DATE: "Invalid expiry date (MM/YY)",
    CVV: "CVV must be 3 digits",
    NAME: "Name must contain only letters and spaces (max 50)",
    UPI_ID: "Invalid UPI ID format (e.g. user@bank)",
    PHONE: "Phone must be exactly 10 digits",
    EMAIL: "Invalid email address",
    WALLET_PHONE: "Wallet number must be 10 digits",
    WALLET_SELECTION: "Please select a wallet provider",
    ADDRESS_LENGTH: "Address cannot exceed 250 characters",
    REQ_FIELDS: "Please fill in all required fields correctly"
};

// --- Formatters (Input Masking) ---

export const formatCardNumber = (value: string): string => {
    // Remove non-digits
    const clean = value.replace(/\D/g, '').slice(0, 16);
    // Add space every 4 digits
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

export const formatExpiryDate = (value: string): string => {
    const clean = value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
        return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    return clean;
};

export const formatCVV = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 3);
};

export const formatName = (value: string): string => {
    // Allow letters and spaces only, max 50
    return value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
};

export const formatUPI = (value: string): string => {
    // Allow alphanumeric, ., _, -, @
    // Max length 50
    return value.replace(/[^a-zA-Z0-9._@-]/g, '').slice(0, 50);
};

export const formatPhoneNumber = (value: string): string => {
    return value.replace(/\D/g, '').slice(0, 10);
};

// --- Validators (Logic) ---

export const isValidExpiry = (mm: string, yy: string): boolean => {
    const currentYear = new Date().getFullYear() % 100; // Last 2 digits
    const currentMonth = new Date().getMonth() + 1;
    const month = parseInt(mm, 10);
    const year = parseInt(yy, 10);

    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
};

export const validateCard = (number: string, expiry: string, cvv: string, name: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    const [mm, yy] = expiry.split('/');

    const errors: Record<string, string> = {};

    if (!PATTERNS.CARD_NUMBER.test(cleanNumber)) errors.cardNumber = MESSAGES.CARD_NUMBER;
    if (!PATTERNS.EXPIRY_DATE.test(expiry) || !isValidExpiry(mm, yy)) errors.expiryDate = MESSAGES.EXPIRY_DATE;
    if (!PATTERNS.CVV.test(cvv)) errors.cvv = MESSAGES.CVV;
    if (!PATTERNS.NAME.test(name)) errors.cardName = MESSAGES.NAME;

    return errors;
};

export const validateUPI = (upiId: string) => {
    const errors: Record<string, string> = {};
    if (!PATTERNS.UPI_ID.test(upiId)) errors.upiId = MESSAGES.UPI_ID;
    return errors;
};

export const validateWallet = (provider: string, phone: string) => {
    const errors: Record<string, string> = {};
    if (!provider) errors.walletProvider = MESSAGES.WALLET_SELECTION;
    if (!PATTERNS.WALLET_PHONE.test(phone)) errors.walletPhone = MESSAGES.WALLET_PHONE;
    return errors;
};

export const validateCustomerInfo = (name: string, phone: string, email: string) => {
    const errors: Record<string, string> = {};
    if (!PATTERNS.NAME.test(name)) errors.name = MESSAGES.NAME;
    if (!PATTERNS.PHONE.test(phone)) errors.phone = MESSAGES.PHONE;
    if (!PATTERNS.EMAIL.test(email)) errors.email = MESSAGES.EMAIL;
    return errors;
};

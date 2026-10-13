// Конфигурация BK-Bank
// Все константы проекта — в одном месте.

export const BASE_SALT = "BK_SECURE_SALT_V2_2026";
export const CHAT_SALT_SUFFIX = "BK_CHAT_ENCRYPT";

export const MAX_ITERATIONS = 1000;
export const FEE_RATE = 0.001;
export const MAX_ORDER_AMOUNT = 1000000;
export const PBKDF2_ITERATIONS = 100000;
export const PBKDF2_KEY_SIZE = 256 / 32;

export const STORAGE_KEYS = {
    BANK_USERS: "bankUsers",
    PUBLIC_TRADES: "public_bktokTrades",
    PUBLIC_ORDERS: "public_bktokOrders",
    SAVED_ACCOUNTS: "savedAccounts",
};

export const IMAGES = {
    LOGO: "assets/images/2025-01-31_14-13-47-Photoroom.png",
    AVATAR_DEFAULT: "assets/images/2025-01-30_17-50-13-Photoroom.png",
    CARDS: [
        "assets/images/2025-01-30_15-13-31-Photoroom.png",
        "assets/images/2025-01-30_15-58-26-Photoroom.png",
        "assets/images/2025-01-30_21-48-25-Photoroom.png",
        "assets/images/2025-01-30_22-57-01-Photoroom.png",
        "assets/images/2025-01-30_23-01-20-Photoroom.png",
        "assets/images/classkr.png",
        "assets/images/Bk-bakcl.png",
    ],
};

export const CONFIG = {
    VERSION: "2.0",
    SESSION_TTL_MS: 24 * 60 * 60 * 1000,
    RESET_TOKEN_TTL_MS: 60 * 60 * 1000,
};

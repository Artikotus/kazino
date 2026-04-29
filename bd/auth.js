// Mock authentication API for local development
class AuthHandler {
    constructor() {
        this.STORAGE_KEY = 'koto_user';
    }

    async register(username, password) {
        const user = {
            id: Date.now(),
            login: username,
            crystals: 150,
            coins: 500,
            created_at: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        return { success: true, user };
    }

    async login(username, password) {
        let user = this.getCurrentUser();
        if (!user) {
            user = {
                id: Date.now(),
                login: username || 'demo_user',
                crystals: 150,
                coins: 500,
                created_at: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        }
        return { success: true, user };
    }

    async logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        return { success: true };
    }

    async getCurrentUser() {
        const userData = localStorage.getItem(this.STORAGE_KEY);
        if (userData) {
            return JSON.parse(userData);
        }
        return null;
    }
}

const authHandler = new AuthHandler();
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = void 0;
class Authentication {
    constructor(authkit, params, state) {
        this.authkit = authkit;
        this.params = params;
        this.state = state;
    }
    async getTokens(params) {
        if (this.isAuthenticated()) {
            return this.state.tokens;
        }
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
            const tokens = await this.authkit.attemptRefresh(refreshToken);
            if (tokens) {
                this.state = this.authkit.makeStateFromTokens(tokens);
                return tokens;
            }
        }
        // TODO - handle iFrame
        // TODO - handle redirect
        throw new Error('unable to retrieve tokens');
    }
    async getUserinfo() {
        return {
            sub: '',
        };
    }
    isAuthenticated() {
        var _a;
        return !!(((_a = this.state) === null || _a === void 0 ? void 0 : _a.tokens) && this.state.expiresIn < Date.now());
    }
    // Has tokens but are expired
    getRefreshToken() {
        if (this.state.tokens) {
            return this.state.tokens.refreshToken;
        }
        else {
            return undefined;
        }
    }
    async logout(redirectHandler) {
        return this.authkit.logout(redirectHandler);
    }
}
exports.Authentication = Authentication;
//# sourceMappingURL=Authentication.js.map
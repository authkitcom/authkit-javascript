"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthKit = void 0;
const Authentication_1 = require("./Authentication");
const Urls_1 = require("./Urls");
const storageConversationKey = '__authkit.storage.conversation';
const storageAuthenticationKey = '__authkit.storage.authentication';
class AuthKit {
    constructor(params, api, storage, pkceSource, queryParamSupplier, iFrame) {
        this.api = api;
        this.storage = storage;
        this.pkceSource = pkceSource;
        this.queryParamSupplier = queryParamSupplier;
        this.iFrame = iFrame;
        this.issuer = params.issuer;
        this.clientId = params.clientId;
        this.redirectHandler = params.redirectHandler;
    }
    randomString(length) {
        return makeId(length);
    }
    async authorize(params) {
        const authState = this.readStateFromStorage(storageAuthenticationKey);
        let auth;
        if (authState) {
            // TODO - wire up redirect handlers
            auth = await this.attemptMakeAuthentication(params, authState);
        }
        else {
            auth = await this.authorizeAndStoreFromCode(params);
        }
        if (auth) {
            return auth;
        }
        // See if we have a code
        let aParams = {
            clientId: this.clientId,
            issuer: this.issuer,
        };
        // Handle code return
        let redirectHandler = this.redirectHandler;
        if (params.redirectHandler) {
            redirectHandler = params.redirectHandler;
        }
        aParams = {
            ...aParams,
            redirectUri: params.redirectUri,
            scope: params.scope ? params.scope.join(' ') : undefined,
            state: params.state,
        };
        switch (params.mode || 'redirect') {
            case 'silent':
                return this.makeAuthenticationFromTokens(params, await this.attemptAuthorizeWithIFrame(aParams));
            case 'redirect':
                await this.authorizeRedirect(aParams, redirectHandler);
                return undefined;
        }
    }
    async authorizeAndStoreFromCode(params) {
        const code = this.queryParamSupplier('code');
        const state = this.queryParamSupplier('state');
        if (!code) {
            return undefined;
        }
        const tokens = await this.authorizeFromCodeParams(code);
        const auth = await this.makeAuthenticationFromTokens(params, tokens);
        if (auth && state && params.stateReturnHandler) {
            params.stateReturnHandler(state);
        }
        return auth;
    }
    async attemptAuthorizeWithIFrame(params) {
        return this.iFrame.getTokens(params);
    }
    async authorizeRedirect(params, redirectHandler) {
        if (!redirectHandler) {
            throw new Error('redirect handler not provided');
        }
        const nonce = this.randomString(32);
        const pkce = this.pkceSource.create();
        const state = {
            codeVerifier: pkce.verifier,
            nonce,
        };
        this.writeConversationStateToStorage(state);
        redirectHandler((0, Urls_1.makeAuthorizeUrl)({
            clientId: this.clientId,
            codeChallenge: pkce.challenge,
            issuer: this.issuer,
        }));
    }
    newAuthentication(params, state) {
        return new Authentication_1.Authentication(this, params, state);
    }
    async logout(redirectHandler) {
        if (!redirectHandler) {
            redirectHandler = this.redirectHandler;
        }
        if (!redirectHandler) {
            throw new Error('redirect required and no redirect handler provided');
        }
        redirectHandler(this.issuer + '/logout');
    }
    async attemptRefresh(refreshToken) {
        return await this.api.refresh({
            clientId: this.clientId,
            refreshToken,
        });
    }
    makeStateFromTokens(tokens) {
        // 60 seconds grace period
        return {
            expiresIn: Date.now() + tokens.expiresIn - 60,
            tokens,
        };
    }
    async authorizeFromCodeParams(code) {
        const convState = this.readStateFromStorage(storageConversationKey);
        if (!convState) {
            throw new Error('no stored conversation state');
        }
        return await this.api.getTokens({
            clientId: this.clientId,
            codeVerifier: convState.codeVerifier,
            redirectUri: convState.redirectUri,
        });
    }
    readStateFromStorage(key) {
        const state = this.storage.getItem(key);
        if (!state) {
            return undefined;
        }
        else {
            return JSON.parse(state);
        }
    }
    writeAuthenticationStateToStorage(state) {
        this.storage.setItem(storageAuthenticationKey, JSON.stringify(state));
    }
    writeConversationStateToStorage(state) {
        this.storage.setItem(storageConversationKey, JSON.stringify(state));
    }
    async attemptMakeAuthentication(params, state) {
        const result = this.newAuthentication(params, state);
        if (result.isAuthenticated()) {
            return result;
        }
        const refreshToken = result.getRefreshToken();
        if (refreshToken) {
            return await this.makeAuthenticationFromTokens(params, await this.attemptRefresh(refreshToken));
        }
        return undefined;
    }
    async makeAuthenticationFromTokens(params, tokens) {
        if (tokens) {
            const state = this.makeStateFromTokens(tokens);
            this.writeAuthenticationStateToStorage(state);
            const auth = this.newAuthentication(params, state);
            return auth;
        }
        else {
            return undefined;
        }
    }
}
exports.AuthKit = AuthKit;
// Visible for testing
// https://stackoverflow.com/a/1349426
function makeId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
//# sourceMappingURL=AuthKit.js.map
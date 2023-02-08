"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthKit = void 0;
const Authentication_1 = require("./Authentication");
const Urls_1 = require("./Urls");
const storageConversationKey = '__authkit.storage.conversation';
const storageAuthenticationKey = '__authkit.storage.authentication';
class AuthKit {
    constructor(params, storage, pkceSource, queryParamSupplier) {
        this.storage = storage;
        this.pkceSource = pkceSource;
        this.queryParamSupplier = queryParamSupplier;
        this.issuer = params.issuer;
        this.clientId = params.clientId;
        this.redirectHandler = params.redirectHandler;
    }
    randomString(length) {
        return makeId(length);
    }
    async authorize(params) {
        let authState = this.readStateFromStorage();
        if (authState) {
            // TODO - wire up redirect handlers
            return this.makeAuthentication(authState);
        }
        authState = await this.authorizeFromCode(params === null || params === void 0 ? void 0 : params.stateReturnHandler);
        if (authState) {
            return this.makeAuthentication(authState);
        }
        // See if we have a code
        let aParams = {
            clientId: this.clientId,
            issuer: this.issuer,
        };
        // Handle code return
        let redirectHandler = this.redirectHandler;
        if (params) {
            if (params.redirectHandler) {
                redirectHandler = params.redirectHandler;
            }
            aParams = {
                ...aParams,
                redirectUri: params.redirectUri,
                scope: params.scope ? params.scope.join(' ') : undefined,
                state: params.state,
            };
        }
        switch ((params === null || params === void 0 ? void 0 : params.mode) || 'Redirect') {
            case 'Silent':
                return this.authorizeWithIFrame({
                    ...aParams,
                    prompt: 'none',
                    responseMode: 'web_message',
                });
            case 'Redirect':
                await this.authorizeRedirect(aParams, redirectHandler);
                return undefined;
        }
    }
    async authorizeFromCode(stateReturnHandler) {
        const code = this.queryParamSupplier('code');
        const state = this.queryParamSupplier('state');
        if (!code) {
            return undefined;
        }
        const auth = await this.authorizeFromCodeParams(code);
        if (auth && state && stateReturnHandler) {
            stateReturnHandler(state);
        }
        return auth;
    }
    async authorizeWithIFrame(params) {
        throw new Error('support this');
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
            ...params,
            codeChallenge: pkce.challenge,
        }));
    }
    async authorizeFromCodeParams(code) {
        const convState = this.readStateFromStorage();
        return undefined;
    }
    readStateFromStorage() {
        // TODO - how to determine if it is expired?
        const state = this.storage.getItem(storageAuthenticationKey);
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
    makeAuthentication(authState) {
        const result = new Authentication_1.Authentication(this);
        result.setState(authState);
        return result;
    }
}
exports.AuthKit = AuthKit;
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
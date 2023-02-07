"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomStringDefault = exports.AuthKit = void 0;
const async_mutex_1 = require("async-mutex");
const axios_1 = require("axios");
const queryString = require("query-string");
const storageFlowKey = 'authkit.storage.flow';
const storageTokensKey = 'authkit.storage.tokens';
const storageUserinfoKey = 'authkit.storage.userinfo';
const codeKey = 'code';
const errorCategoryKey = 'error';
const errorDescriptionKey = 'error_description';
const randomStringDefault = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
exports.randomStringDefault = randomStringDefault;
const getQueryDefault = () => location.search;
const submitFormDefault = (form) => {
    form.submit();
};
const redirectDefault = (url) => {
    window.location.assign(url);
};
class AuthKit {
    constructor(params, pkceSource) {
        // Visible for testing
        this.randomString = randomStringDefault;
        // Visible for testing
        this.getQuery = getQueryDefault;
        // Visible for testing
        this.refreshLimit = -1;
        // Visible for testing
        this.redirect = redirectDefault;
        // Visible for testing
        this.submitForm = submitFormDefault;
        this.refreshCount = 0;
        this.mutex = new async_mutex_1.Mutex();
        this.params = params;
        this.pkceSource = pkceSource;
        this.bindings = new Map();
        this.bindings.set('get', async (storage, state, extensions) => {
            const p = this.params;
            this.redirect(`${p.issuer}/authorize?client_id=${p.clientId}&redirect_uri=${encodeURIComponent(storage.thisUri)}${(() => {
                if (state) {
                    return `&state=${state}`;
                }
                else {
                    return '';
                }
            })()}&nonce=${storage.nonce}&response_type=code&scope=${encodeURIComponent(p.scope.join(' '))}&code_challenge=${encodeURIComponent(storage.pkce.challenge)}`);
        });
        // TODO - Need some unit tesing around this
        this.bindings.set('post', async (storage, state, extensions) => {
            const p = this.params;
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `${p.issuer}/authorize`;
            form.style.display = 'none';
            const addField = (name, value) => {
                const f = document.createElement('input');
                f.type = 'hidden';
                f.name = name;
                f.value = value;
                form.appendChild(f);
            };
            addField('client_id', p.clientId);
            addField('redirect_uri', storage.thisUri);
            if (state) {
                addField('state', state);
            }
            addField('nonce', storage.nonce);
            addField('response_type', 'code');
            addField('scope', p.scope.join(' '));
            addField('code_challenge', storage.pkce.challenge);
            if (extensions) {
                addField('extensions', JSON.stringify(extensions));
            }
            document.body.appendChild(form);
            this.submitForm(form);
        });
    }
    isAuthenticated() {
        return this.tokens ? true : false;
    }
    getTokens() {
        return this.tokens;
    }
    removeTokens() {
        sessionStorage.removeItem(storageTokensKey);
        sessionStorage.removeItem(storageUserinfoKey);
        sessionStorage.removeItem(storageFlowKey);
        this.tokens = undefined;
        this.userinfo = undefined;
    }
    getUserinfo() {
        return this.userinfo;
    }
    async authorize(params = {}) {
        return await this.mutex.runExclusive(async () => {
            if (await this.loadFromStorage()) {
                return Promise.resolve(this);
            }
            const q = queryString.parse(this.getQuery());
            const code = this.stringFromQuery(q, codeKey);
            const errorCategory = this.stringFromQuery(q, errorCategoryKey);
            const errorDescription = this.stringFromQuery(q, errorDescriptionKey) || '';
            if (errorCategory) {
                this.tokens = undefined;
                const $storage = await this.getStorage();
                if ($storage === null || $storage === void 0 ? void 0 : $storage.thisUri) {
                    window.history.pushState('page', '', $storage.thisUri);
                }
                throw new Error(`[${errorCategory}] ${errorDescription}`);
            }
            if (code) {
                await this.loadFromCode(code);
                return Promise.resolve(this);
            }
            const storage = await this.createAndStoreStorage(params.redirectUri);
            const binding = this.bindings.get(params.binding || 'get');
            if (!binding) {
                throw new Error(`Invalid binding ${params.binding}`);
            }
            await binding(storage, params.state, params.extensions);
            return Promise.resolve(this);
        });
    }
    async setTokens(tokens) {
        this.tokens = tokens;
        await this.loadUserinfo();
        if (this.userinfo) {
            this.finalStorage(this.tokens, this.userinfo);
        }
        else {
            throw new Error('User info not available');
        }
    }
    logout(returnTo) {
        this.removeTokens();
        window.location.replace(this.params.issuer + `/logout?return_to=${returnTo}`);
    }
    stringFromQuery(q, name) {
        const raw = q[name];
        if (typeof raw === 'string') {
            return raw;
        }
        return undefined;
    }
    async loadFromCode(code) {
        const storage = await this.getStorage();
        if (!storage) {
            throw new Error('Nothing in storage');
        }
        const res = await axios_1.default.post(this.params.issuer + '/oauth/token', queryString.stringify({
            client_id: this.params.clientId,
            code,
            code_verifier: storage.pkce.verifier,
            grant_type: 'authorization_code',
            redirect_uri: storage.thisUri,
        }), {
            adapter: require('axios/lib/adapters/xhr'),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const resp = res.data;
        try {
            await this.processTokenResponse(resp);
        }
        finally {
            window.history.pushState('page', '', storage.thisUri);
        }
    }
    async processTokenResponse(resp) {
        if (resp.error) {
            this.tokens = undefined;
            throw new Error(`[${resp.error}] ${resp.error_description}`);
        }
        if (resp.access_token) {
            this.tokens = {
                accessToken: resp.access_token,
                expiresIn: resp.expires_in,
                idToken: resp.id_token,
                refreshToken: resp.refresh_token,
            };
            // Only need to load this once
            if (!this.userinfo) {
                await this.loadUserinfo();
            }
            await this.finalStorage(this.tokens, this.userinfo);
            this.refreshLoop(this);
        }
    }
    refreshLoop(that) {
        // seconds -> milliseconds
        const interval = (that.tokens.expiresIn - 30) * 1000;
        setTimeout(async function refresh() {
            if (that.refreshLimit === -1 || that.refreshLimit >= that.refreshCount) {
                await that.refresh(that);
                that.refreshCount++;
            }
        }, interval);
    }
    async refresh(that) {
        const res = await axios_1.default.post(that.params.issuer + '/oauth/token', queryString.stringify({
            grant_type: 'refresh_token',
            refresh_token: that.tokens.refreshToken,
        }), {
            adapter: require('axios/lib/adapters/xhr'),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const resp = res.data;
        that.processTokenResponse(resp);
    }
    async loadUserinfo() {
        if (this.userinfo) {
            return;
        }
        if (!this.tokens) {
            throw new Error('Not authenticated');
        }
        const resp = await axios_1.default.get(this.params.issuer + '/userinfo?client_id=' + encodeURIComponent(this.params.clientId), {
            headers: {
                Authorization: 'Bearer ' + this.tokens.accessToken,
            },
        });
        this.userinfo = resp.data;
    }
    async getStorage() {
        const raw = sessionStorage.getItem(storageFlowKey);
        if (raw == null) {
            return undefined;
        }
        return JSON.parse(raw);
    }
    async createAndStoreStorage(redirectUri) {
        let thisUri = window.location.href;
        if (redirectUri) {
            thisUri = redirectUri;
        }
        if (thisUri.indexOf('#') > 0) {
            thisUri = thisUri.substring(0, thisUri.indexOf('#'));
        }
        const storage = {
            nonce: this.randomString(32),
            pkce: this.pkceSource.create(),
            thisUri,
        };
        sessionStorage.setItem(storageFlowKey, JSON.stringify(storage));
        return storage;
    }
    async finalStorage(authentication, userinfo) {
        sessionStorage.setItem(storageTokensKey, JSON.stringify(authentication));
        sessionStorage.setItem(storageUserinfoKey, JSON.stringify(userinfo));
        sessionStorage.removeItem(storageFlowKey);
    }
    async loadFromStorage() {
        const authString = sessionStorage.getItem(storageTokensKey);
        const userinfoString = sessionStorage.getItem(storageUserinfoKey);
        if (authString && userinfoString) {
            this.tokens = JSON.parse(authString);
            this.userinfo = JSON.parse(userinfoString);
            this.refreshLoop(this);
            return true;
        }
        else {
            return false;
        }
    }
}
exports.AuthKit = AuthKit;
//# sourceMappingURL=AuthKit.js.map
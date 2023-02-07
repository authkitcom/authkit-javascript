"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PkceSource = void 0;
const crypto_js_1 = require("crypto-js");
const base64 = require("crypto-js/enc-base64");
const randombytes = require("randombytes");
class PkceSource {
    randomBuffer() {
        return randombytes(32);
    }
    create() {
        const verifier = urlReplace(this.randomBuffer().toString('base64'));
        const challenge = urlReplace((0, crypto_js_1.SHA256)(verifier).toString(base64));
        return {
            challenge,
            verifier,
        };
    }
}
exports.PkceSource = PkceSource;
function urlReplace(input) {
    return input
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
//# sourceMappingURL=Pkce.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtParser = exports.Tokens = exports.createAuthKit = void 0;
const AuthKit_1 = require("./AuthKit");
const Parser_1 = require("./Parser");
Object.defineProperty(exports, "jwtParser", { enumerable: true, get: function () { return Parser_1.jwtParser; } });
const Pkce_1 = require("./Pkce");
const Tokens_1 = require("./Tokens");
Object.defineProperty(exports, "Tokens", { enumerable: true, get: function () { return Tokens_1.Tokens; } });
const createAuthKit = (params) => new AuthKit_1.AuthKit(params, new Pkce_1.PkceSource());
exports.createAuthKit = createAuthKit;
//# sourceMappingURL=index.js.map
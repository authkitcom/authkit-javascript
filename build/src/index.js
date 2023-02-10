"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthKitForDOM = void 0;
const Api_1 = require("./Api");
const AuthKit_1 = require("./AuthKit");
const IFrame_1 = require("./IFrame");
const Pkce_1 = require("./Pkce");
const Query_1 = require("./Query");
const createAuthKitForDOM = (params) => new AuthKit_1.AuthKit(params, new Api_1.Api(params.issuer), sessionStorage, new Pkce_1.PkceSource(), Query_1.QueryParamSupplier, new IFrame_1.IFrame());
exports.createAuthKitForDOM = createAuthKitForDOM;
//# sourceMappingURL=index.js.map
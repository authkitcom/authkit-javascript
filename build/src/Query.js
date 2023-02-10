"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParamSupplier = void 0;
const QueryParamSupplier = (name) => {
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.href);
    if (!results) {
        return undefined;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
exports.QueryParamSupplier = QueryParamSupplier;
//# sourceMappingURL=Query.js.map
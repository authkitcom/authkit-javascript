"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Pkce_1 = require("../src/Pkce");
describe('PckeSource', () => {
    it('generates unique and correct strings', () => {
        const unit = new Pkce_1.PkceSource();
        const iterations = 1000;
        const entires = new Map();
        for (let i = 0; i < iterations; i++) {
            entires.set(unit.create(), true);
        }
        expect(entires.size).toBe(iterations);
    });
    it('generates a correct pair', () => {
        const unit = new Pkce_1.PkceSource();
        unit.randomBuffer = () => {
            return Buffer.from('test-verifier');
        };
        const result = unit.create();
        expect(result).toEqual({
            challenge: 'Xy4z2k3vdPEL7_IN1u0R0AuTrvud4feLffzULBuEWfc',
            verifier: 'dGVzdC12ZXJpZmllcg',
        });
    });
});
//# sourceMappingURL=Pkce.test.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parser_1 = require("../Parser");
describe('jwtParser', () => {
    const parameters = [
        { description: 'empty', input: '', expected: {} },
        {
            description: 'no claims',
            input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.Et9HFtf9R3GEMA0IICOfFMVXY7kkTX1wr4qCyhIf58U',
            expected: {},
        },
        { description: 'no claims header and signature not touched', input: 'header.e30.signature', expected: {} },
        {
            description: 'with claims',
            input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkxIjoxMjAwLCJrZXkyIjoiVmFsdWVBQkMifQ.lsm6sd9V8Zry71LB-8btsFdcnmUYls4TubXqV7pn7aw',
            expected: {
                key1: 1200,
                key2: 'ValueABC',
            },
        },
    ];
    parameters.forEach(parameter => {
        it(parameter.description, () => {
            expect((0, Parser_1.jwtParser)(parameter.input)).toEqual(parameter.expected);
        });
    });
});
//# sourceMappingURL=Parser.test.js.map
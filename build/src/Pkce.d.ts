/// <reference types="node" />
interface IPkce {
    challenge: string;
    verifier: string;
}
declare class PkceSource {
    randomBuffer(): Buffer;
    create(): IPkce;
}
export { IPkce, PkceSource };

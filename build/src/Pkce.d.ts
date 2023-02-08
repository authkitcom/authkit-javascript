/// <reference types="node" />
interface IPkce {
    challenge: string;
    verifier: string;
}
interface IPkceSource {
    create(): IPkce;
}
declare class PkceSource implements IPkceSource {
    randomBuffer(): Buffer;
    create(): IPkce;
}
export { IPkce, IPkceSource, PkceSource };

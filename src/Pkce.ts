import * as Cryptojs from 'crypto-js';
import { SHA256 } from 'crypto-js';
import * as base64 from 'crypto-js/enc-base64';

interface IPkce {
  challenge: string;
  verifier: string;
}

interface IPkceSource {
  create(): IPkce;
}

class PkceSource implements IPkceSource {
  public randomBuffer(): string {
    return Cryptojs.lib.WordArray.random(32).toString(Cryptojs.enc.Base64);
  }

  public create(): IPkce {
    const verifier = urlReplace(this.randomBuffer());
    const challenge = urlReplace(SHA256(verifier).toString(base64));

    return {
      challenge,
      verifier,
    };
  }
}

function urlReplace(input: string) {
  return input
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export { IPkce, IPkceSource, PkceSource };

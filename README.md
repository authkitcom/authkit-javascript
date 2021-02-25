# AuthKit Javascript

## Overview

The AuthKit Javascript library performs OAuth2 authentication 

## Install

NPM:

``` bash
npm install --save @authkitcom/core
```

Yarn:

``` bash
yarn add @authkitcom/core
```

## Usage

To use the library, create and AuthKit object and call the authorize method.  If
the user is not authenticated, they will be redirected to the authorize endpoint
first.

``` javascript

import { Tokens, createAuthKit, jwtParser } from '@authkitcom/core';

var authKit = createAuthKit({
  clientId: '9cc49356-433b-49a1-bf24-4dd00cb34523', 
  issuer: 'https://tenant.authkit.com',
  scope: ['email profile openid'],
});

var tokens = (await authKit.authorize()).getTokens();

var idFields = jwtParser(tokens.idToken);

console.log(idFields);

```


# AuthKit Javascript

## Overview

The AuthKit core JavaScript library.

## Install

NPM:

``` bash
npm install --save @authkitcom/core
```

Yarn:

``` bash
yarn add @authkitcom/core
```

## Basic Usage

To use the library, create and AuthKit object and call the authorize method.  If
the user is not authenticated, they will be redirected to the authorize endpoint
first.

``` javascript

import { createAuthKitForDOM } from '@authkitcom/core';

const authKit = createAuthKitForDOM({
  clientId: '9cc49356433b89a1bf244dd00cb34523', 
  issuer: 'https://mytenant.authkit.com',
  scope: ['email', 'profile', 'openid'],
});

// Authorize

const auth = await authkit.authorize();

const accessToken = await auth.getTokens().accessToken;

```


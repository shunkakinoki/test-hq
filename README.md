# test-hq

A small storefront used as a fixture for automated maintenance and end-to-end testing.

Live site: https://shunkakinoki.github.io/test-hq/

## Flows

- Sign up: `docs/signup.html`, then the welcome page
- Checkout: `docs/checkout.html`, priced by `docs/lib/cart.js`
- Invite a teammate: `docs/invite.html`, validated by `docs/lib/invite.js`

## Layout

- `docs/` - the static site, published by GitHub Pages from `main:/docs`
- `docs/lib/` - browser ES modules shared with the tests
- `tests/` - `node --test` suites

## Develop

```bash
npm test
```

# babel-plugin-expressionify

[WIP] Super silly Babel plugin that turns most JavaScript into expressions.

## Example

```js
const a = require('a-number')
const b = 3
module.exports = a * b
```

↓

```js
(b =>
  (a => () => module.exports = a * b)(require('a-number'))
)(3)()
```

## License

[ISC]

[ISC]: ./LICENSE

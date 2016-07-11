import { transform } from 'babel-core'
import expressionify from '../src'

console.log(transform(`
const x = require('something')
class Y {
  constructor () {
    for (let i = 0; i < 10; i++) {
      x.something()
    }
  }
}
module.exports = Y
`, {
  plugins: [expressionify]
}).code)

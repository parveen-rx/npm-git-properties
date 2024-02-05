# npm-git-properties

Generate repository git details

## Example

```js
var git = require('npm-git-properties');

console.log(git.commitIdAbbrev());
// 18f5104

console.log(git.commitIdFull());
// 18f51041eead0e4952bfe11987504e6fdf682a0f

console.log(git.currentBranch());
// v1.0.0
```

To understand better, run the examples: `node .\examples\example-simple.js`  or `node run .\examples\example-complex.js`

To run test cases, run the file: `node .\tests\tests.js`

## Install

`npm install npm-git-properties --save`

## Inspiration
1. https://github.com/kurttheviking/git-rev-sync-js (NPM Module)
2. https://github.com/n0mer/gradle-git-properties (Gradle Module)

## License

[MIT](https://github.com/parveen-rx/npm-git-properties/blob/main/LICENSE)


## Donations

[Donate on UPI ID(India): parveensoni14891@okhdfcbank]()
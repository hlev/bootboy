var fs = require('fs'),
    tests, loop;

tests = fs.readdirSync(__dirname).filter(function (file) {
  return file !== 'index.js';
});


loop = function () {
  var next = tests.shift();

  if (!next) {
    console.log('\033[32m[ok]\033[39m  all ok');

    return;
  }

  process.nextTick(loop);
};

loop();
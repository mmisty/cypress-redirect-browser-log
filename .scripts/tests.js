#!/usr/bin/env node

const exec = require('child_process');
const latest = '@15.1.0';
const versionJest = '@13.3.0'; // yes, @14.1.1 no

const execute = (cmd) => {
  console.log(cmd);
  exec.execSync(cmd, { stdio: 'inherit'});
  console.log('');
}

console.log(' ======== Clear')
execute('rm -rf reports instrumented lib .nyc_output coverage');

console.log(' ======== Instrument')
execute(`npx nyc${latest} instrument ./src ./instrumented --nycrc-path nyc.instrument.config.js`);

console.log(' ======== Jest');
execute(`TEST=jest npx nyc${versionJest} --all npm run test`, );

console.log(' ======== Cypress');
execute('TEST=cypress npm run cy:run:cov');

console.log(' ======== MERGE');
execute(`npx nyc${latest} merge .nyc_output reports/full.json`);

console.log(' ======== REPORT');
execute(`npx nyc${latest} report --report-dir coverage --temp-dir reports --check-coverage false`);

console.log(' ======== Serve');
execute(`http-server coverage/lcov-report`)
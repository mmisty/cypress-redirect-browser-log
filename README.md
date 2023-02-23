# cypress-redirect-browser-log

Install:

`npm i --save-dev cypress-redirect-browser-log`

Will connect to **chrome** debugging protocol and redirect logs to node process

Will redirect browser console events like: 
 - console API events
 - uncaught exceptions
 - some browser console events

## Setup
1. setup support

```typescript
// support/index.ts or where is support located
redirectLogsBrowser({
  isLogFromTest: false, // when 'true' will log all commands from cypress command log to output
});
```

2. setup plugins (setupNodeEvents)

```javascript
// cypress.config.ts
setupNodeEvents(on, config){
  const redirect = redirectLog({isLog: true});
  redirect.beforeBrowserLaunch(on);
  
  //... other existing configrations
  
  return config;
}

```

if you need to handle 'before:browser:launch' you can use this configuration :
```javascript
// cypress.config.ts
setupNodeEvents(on, config){
  const redirect = redirectLog({ isLog: true });
  const browserHandler = redirect.browserLaunchHandler(filterFunc(true));
  
  on('before:browser:launch', (browser: Browser, browserLaunchOptions: BrowserLaunchOptions) => {
    return browserHandler(browser, browserLaunchOptions);
  });
  
  return config;
}
```

3. run tests with `--browser chrome --headless` (for electron logs will not be redirected)
4. you'll see logs in console like:
```text
FROM CHROME >> 2022-11-25T22:27:07.441Z |   debug |  ======== TEST STARTED: test integration should be no details for commands
FROM CHROME >> 2022-11-25T22:27:07.464Z |    test |  command: Coverage -> Reset [@cypress/code-coverage]
  test integration
FROM CHROME >> 2022-11-25T22:27:07.495Z |    test |  command: route
FROM CHROME >> 2022-11-25T22:27:07.501Z |    test |  command: visit -> mytest.com
FROM CHROME >> 2022-11-25T22:27:07.538Z |    test |  command: request -> mytest.com, {}
FROM CHROME >> 2022-11-25T22:27:07.778Z |     log |  LOG FROM APPLICATION!!
FROM CHROME >> 2022-11-25T22:27:07.778Z | warning |  WARN FROM APPLICATION!!

```

### Advanced config: 

In support config you can choose whether to redirect all commands from tests or not:

```javascript
// no logs for tests, only application logs and browser
redirectLogsBrowser({
  isLogFromTest: false,
});
```

```javascript
// logs all commands, does not log details for each command
redirectLogsBrowser({
  isLogFromTest: {
    isLogCommandDetails: false,
  },
});
```

```javascript
// logs all commands, logs details for each command
redirectLogsBrowser({
  isLogFromTest: {
    isLogCommandDetails: true,
  },
});
```

## Contribution

- [x] typescript
- [x] code coverage for cypress and jest, merge coverage
- [x] formatting and eslint
- [x] jest tests
- [x] log uncaught exceptions from your Application
- [ ] todo to file
- [ ] todo config
- [ ] todo docs

### Scripts

| script          | description                                                                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `husky:install` | install precommit hooks                                                                                                                                     |
| `lint`          | lint code                                                                                                                                                   |
| `build`         | compile typescript by [tsconfig.build.json](./tsconfig.build.json)                                                                                            |
| `test`          | run all jest tests                                                                                                                                          |
| `test:cov`      | run all jest tests with coverage                                                                                                                            |
| `cy:open`       | start cypress in interactive mode                                                                                                                           |
| `cy:open:cov`   | start cypress in interactive mode with coverage                                                                                                             |
| `cy:run`        | run cypress tests                                                                                                                                           |
| `cy:run:cov`    | run cypress tests with coverage                                                                                                                             |
| `cov:merge`     | merge jest and cypress coverage results                                                                                                                     |
| `cov:jest`      | show html report for jest coverage                                                                                                                          |
| `cov:cy`        | show html report for cypress coverage                                                                                                                       |
| `cov`           | show html report for full coverage                                                                                                                          |
| `cov:check`     | check coverage by thresholds specified in [nyc.config.js](./nyc.config.js)                                                                                  |
| `pre`           | run all necessary scripts  (fmt, lint, build, tests and check cov)                                                                                          |
| `extract`       | should be run after tsc and after everything is staged. Extracts everything from 'lib' to root directory. This is required for nice imports in target library |
| `extract:undo`  | Be careful, commit everything you need before. Removes files and dirs that were extracted after `extract`                                                     |

# cypress-redirect-browser-log

Will connect to **chrome** debugging protocol and redirect logs to node process

Will redirect browser console events like: 
 - console API events
 - uncaught exceptions
 - browser console events

Install:

`npm i --save-dev cypress-redirect-browser-log`

Requires Cypress >11.x as peer dependency 

## Setup

### 1. Set environment variable
Logs will be redirected to node console when environment variable `REDIRECT_BROWSER_LOG` is set to true.

### 2. Setup plugins

You need to add `redirectLog(on, config);` into your plugins file.

See example of the simplest configuration:

```typescript
// cypress.config.ts
import { redirectLog } from 'cypress-redirect-browser-log/plugins';

export default defineConfig({
  e2e: {
    // ...
    setupNodeEvents(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
      redirectLog(on, config);
    
      //... other existing configrations
    
      return config;
    }
  }
});
```
For more options see [advanced section](#advanced) below.

### 3. Setup support (e2e.ts)

To see logs from tests put this into your support file (`e2e.ts` or `support/index.ts`)

```typescript
// support/index.ts or where is support located (e2e.ts)
import { redirectTestLogs } from 'cypress-redirect-browser-log';

redirectTestLogs({
  isLogCommandDetails: false,
});
```

- `isLogCommandDetails`:  set to true to see all commands with details from test when `isLogFromTest` is true

To disable logs from tests you can 
setup plugins as follows: 
```typescript
// disable test log
redirectLog(on, config, handler => {
  handler.on('test:log', () => {
    // ignore 
  });
});

// or specify only event you want to see
redirectLog(on, config, ['excpetion', 'error', 'log', 'warn']);
```


### 4. Run tests
Run tests with `--browser chrome --headless` (for electron logs will not be redirected)

### 5. That's it
You'll see logs in node console like:
```text
FROM CHROME >> 2023-06-06T07:12:01.046Z |     test | ======== TEST STARTED: test integration should be no details for commands
FROM CHROME >> 2023-06-06T07:12:01.148Z |     test | command: route ->
FROM CHROME >> 2023-06-06T07:12:01.166Z |     test | command: visit -> mytest.com
FROM CHROME >> 2023-06-06T07:12:01.438Z |      log | LOG FROM APPLICATION!!
FROM CHROME >> 2023-06-06T07:12:01.438Z |  warning | WARN FROM APPLICATION!!
FROM CHROME >> 2023-06-06T07:12:01.438Z |  warning |     at http://localhost:58040/mytest.com:23:16 (<no functionName>)
FROM CHROME >> 2023-06-06T07:12:01.438Z |    error | ERROR FROM APPLICATION!!
FROM CHROME >> 2023-06-06T07:12:01.438Z |    error |     at http://localhost:58040/mytest.com:24:16 (<no functionName>)
FROM CHROME >> 2023-06-06T07:12:01.466Z |     test | command: get -> div
FROM CHROME >> 2023-06-06T07:12:01.486Z |     test | command: assert -> expected [ <div>, 1 more... ] to exist in the DOM
FROM CHROME >> 2023-06-06T07:12:01.504Z |     test | ==== TEST RESULT: PASSED
```

:tada:

For your own log events and formatting see [advanced](#advanced)

## Advanced

With default configuration you will see logs from events : `exception`, `error`, `warn`, `log`, `debug`, `test:log`. 

### Showing only specific events
- If you need to show for example only errors and exceptions in
plugins add one more argument:

   ```typescript
   // will show only errors in excpetions
   redirectLog(on, config, ['error', 'exception']);
   ```

- If you want to create your own message (or do anything you want with result): 
   ```typescript
   // will override output of errors and excpetions
   redirectLog(on, config, handler => {
     handler.on('error', res => {
       console.error(res.message);
     });
        
     handler.on('exception', res => { 
       console.error(res.message);
     });
   });
   ```
  
- If you want to show default log for specific events and own messages:
  ```typescript
      // will show all from test logs and your errors and exceptions
      redirectLog(on, config, ['test:log'], handler => {
          handler.on('error', res => {
            console.error(res.message);
          });
          handler.on('exception', res => {
            console.error(res.message);
          });
        });
  ```

### Handling before:browser:launch
if you need to handle 'before:browser:launch' you can use this configuration :

```typescript
  const browserHandler = redirectLogBrowser(config);
  
  on('before:browser:launch', (browser: Browser, browserLaunchOptions: BrowserLaunchOptions) => {
    // your other browser handling
    return browserHandler(browser, browserLaunchOptions);
  });

```
redirectLogBrowser accepts similar overloads as redirectLog

## Contribution

- [x] typescript
- [x] code coverage for cypress and jest, merge coverage
- [x] formatting and eslint
- [x] jest tests
- [x] log uncaught exceptions from your Application
- [ ] todo to file
- [ ] todo config
- [ ] todo docs

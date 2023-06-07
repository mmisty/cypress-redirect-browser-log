# DEV: cypress-redirect-browser-log

To see instructions and usage take a look on [README](./README-pack.md)


## Contribution
Feel free to contribute!

### Changes
- after making changes run:
    - `npm run pre`

### Publishing
- all publishing files (specified in [tsconfig.build.json](./tsconfig.build.json)) will go to 'lib' folder and also - [README-pack](./README-pack.md)
  and [package-publish.json](./package-publish.json)
- to change some data for publishing change within file [package-publish.json](./package-publish.json), version will be set automatically
- when adding prod dependancy add to [package-publish.json](./package-publish.json)



### Scripts
todo fix

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

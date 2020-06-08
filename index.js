const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fetch = require('node-fetch');

async function main() {
  try {
    const appName = core.getInput('app-name');
    const resourceGroup = core.getInput('resource-group');
    const package = core.getInput('package');
    const scriptFile = core.getInput('script-file');
    const denoVersion = core.getInput('deno-version') || 'latest';

    const tags = await getImageTags();
    if (!tags.includes(denoVersion)) {
      core.error(`${denoVersion} is not valid.`);
      core.info('Please use one of the following versions:');
      core.info(tags.sort().join('\n'));
      core.setFailed();
      return;
    }

    const imageName = `anthonychu/azure-webapps-deno:${denoVersion}`;
  
    const { output: containerInfoJson } = await runAzCommand([ 'webapp', 'config', 'container', 'show', '-n', appName, '-g', resourceGroup ]);
    const containerInfo = JSON.parse(containerInfoJson);

    const webAppImageName = containerInfo.find(i => i.name === 'DOCKER_CUSTOM_IMAGE_NAME');
    const webAppEnableStorage = containerInfo.find(s => s.name === 'WEBSITES_ENABLE_APP_SERVICE_STORAGE');

    const { output: appSettingsJson } = await runAzCommand([ 'webapp', 'config', 'appsettings', 'list', '-n', appName, '-g', resourceGroup ]);
    const appSettings = JSON.parse(appSettingsJson);

    const webAppRunFromPackage = appSettings.find(s => s.name === 'WEBSITE_RUN_FROM_PACKAGE');

    const hasCorrectImage = webAppImageName && webAppImageName.value === imageName;
    const isAppServiceStorageEnabled = webAppEnableStorage && webAppEnableStorage === 'true';
    if (!hasCorrectImage || !isAppServiceStorageEnabled) {
      core.info('Configuring custom Deno runtime image...');
      await runAzCommand([ 'webapp', 'config', 'container', 'set', '-n', appName, '-g', resourceGroup, '-i', imageName, '-r', 'https://index.docker.io', '-u', '', '-p', '', '-t', 'true' ]);
      await runAzCommand([ 'webapp', 'config', 'set', '-n', appName, '-g', resourceGroup, '--startup-file', '' ]);
    }

    const isRunFromPackageEnabled = webAppRunFromPackage && webAppRunFromPackage.value === '1';
    if (!isRunFromPackageEnabled) {
      core.info('Configuring run from package...');
      await runAzCommand([ 'webapp', 'config', 'appsettings', 'set', '-n', appName, '-g', resourceGroup, '--settings', 'WEBSITE_RUN_FROM_PACKAGE=1' ]);
    }
    
    let retryCount = 0;
    while (retryCount < 3) {
      try {
        core.info('Uploading package...')
        await runAzCommand([ 'webapp', 'deployment', 'source', 'config-zip', '-n', appName, '-g', resourceGroup, '--src', package ]);
        break;
      } catch (ex) {
        // sometimes deployment fails transiently
        core.error(ex);
        retryCount += 1;
      }
    }
    await runAzCommand([ 'webapp', 'config', 'set', '-n', appName, '-g', resourceGroup, '--startup-file', `deno run -A --unstable ${scriptFile}` ]);

  } catch (error) {
    core.setFailed(error.message);
  }
  
  async function runAzCommand(args) {
    let output = '';
    let error = '';
    
    const options = {
      listeners: {
        stdout: (data) => {
          output += data.toString();
        },
        stderr: (data) => {
          error += data.toString();
        }
      },
      silent: false
    };
  
    const exitCode = await exec.exec('az', [...args, '-o', 'json'], options);
  
    return {
      exitCode,
      output,
      error
    };
  }

  async function getImageTags() {
    const tags = [];
    let url = 'https://registry.hub.docker.com/v2/repositories/anthonychu/azure-webapps-deno/tags';
    while(true) {
      const resp = await fetch(url);
      const { next, results } = await resp.json();
      tags.push(...(results.map(r => r.name)));
      if (!next) {
        return tags;
      }
      url = next;
    }
  }
}

main();
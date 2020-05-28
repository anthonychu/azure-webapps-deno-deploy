const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

const imageName = 'anthonychu/azure-webapps-deno:latest';

async function main() {
  try {
    const appName = core.getInput('app-name');
    const resourceGroup = core.getInput('resource-group');
    const package = core.getInput('package');
    const scriptFile = core.getInput('script-file');
  
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
      console.log('Configuring custom Deno runtime image...');
      await runAzCommand([ 'webapp', 'config', 'container', 'set', '-n', appName, '-g', resourceGroup, '-i', imageName, '-r', 'https://index.docker.io', '-u', '', '-p', '', '-t', 'true' ]);
      await runAzCommand([ 'webapp', 'config', 'set', '-n', appName, '-g', resourceGroup, '--startup-file', '' ]);
    }

    const isRunFromPackageEnabled = webAppRunFromPackage && webAppRunFromPackage.value === '1';
    if (!isRunFromPackageEnabled) {
      console.log('Configuring run from package...');
      await runAzCommand([ 'webapp', 'config', 'appsettings', 'set', '-n', appName, '-g', resourceGroup, '--settings', 'WEBSITE_RUN_FROM_PACKAGE=1' ]);
      await runAzCommand([ 'webapp', 'config', 'set', '-n', appName, '-g', resourceGroup, '--startup-file', `deno run -A --unstable "${scriptFile}"` ]);
    }

    console.log('Uploading package...')
    await runAzCommand([ 'webapp', 'deployment', 'source', 'config-zip', '-n', appName, '-g', resourceGroup, '--src', package ]);

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
      silent: true
    };
  
    const exitCode = await exec.exec('az', [...args, '-o', 'json'], options);
  
    return {
      exitCode,
      output,
      error
    };
  }
}

main();
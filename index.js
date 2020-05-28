const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

const imageName = 'anthonychu/azure-webapps-deno';

async function main() {
  try {
    const appName = core.getInput('app-name');
    const resourceGroup = core.getInput('resource-group');
    const package = core.getInput('package');
  
    const { output: containerInfoJson } = await runAzCommand([ 'webapp', 'config', 'container', 'show', '-n', appName, '-g', resourceGroup, '-o', 'json' ]);
    const containerInfo = JSON.parse(containerInfoJson);

    const webAppImageName = containerInfo.find(i => i.name === 'DOCKER_CUSTOM_IMAGE_NAME');

    const { output: appSettingsJson } = await runAzCommand([ 'webapp', 'config', 'appsettings', 'list', '-n', appName, '-g', resourceGroup, '-o', 'json' ]);
    const appSettings = JSON.parse(appSettingsJson);

    const webAppRunFromPackage = appSettings.find(s => s.name === 'WEBSITE_RUN_FROM_PACKAGE');
    const webAppEnableStorage = appSettings.find(s => s.name === 'WEBSITES_ENABLE_APP_SERVICE_STORAGE');

    console.log("image", webAppImageName);
    console.log("runfrompackage", webAppRunFromPackage);
    console.log("enablestroage", webAppEnableStorage);
  
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
      }
    };
  
    const exitCode = await exec.exec('az', args, options);
  
    return {
      exitCode,
      output,
      error
    };
  }
}

main();
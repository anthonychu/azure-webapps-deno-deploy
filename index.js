const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

try {
  const appName = core.getInput('app-name');
  const resourceGroup = core.getInput('resource-group');
  const package = core.getInput('package');

  const containerShowResult = await runAzCommand([ 'webapp', 'config', 'container', 'show', '-n', appName, '-g', resourceGroup, '-o', 'json' ]);
  console.log(JSON.stringify(containerShowResult, null, 2));

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
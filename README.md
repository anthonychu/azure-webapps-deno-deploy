# Azure Web Apps Deno Deploy action

This action deploys a Deno app to Azure Web Apps (Linux).

## Inputs

### `app-name`

**Required** Name of the Azure Web App.

### `resource-group`

**Required** Name of the resource group.

### `package`

**Required** Path to zip package to deploy.

### `script-file`

**Required** Path to the script file to pass to `deno run`.

### `deno-version`

**Optional** Deno version to use (default: `latest`).

See the [image tags](https://hub.docker.com/r/anthonychu/azure-webapps-deno/tags) for valid versions.

## Outputs

None

## Example usage

```yaml
on: [push]

name: Deploy to Azure

jobs:

  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    
    - uses: actions/checkout@v2

    - uses: azure/login@v1.1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Set up Deno
      uses: denolib/setup-deno@master
      with:
        deno-version: "1.2.0"

    - name: Bundle and zip Deno app
      run: |
        deno bundle server.ts server.bundle.js
        zip app.zip server.bundle.js

    - name: Deploy to Azure Web Apps
      uses: anthonychu/azure-webapps-deno-deploy@main
      with:
        app-name: my-app
        resource-group: my-resource-group
        package: app.zip
        script-file: server.bundle.js
        deno-version: "1.2.0"
```

## How it works

This action configures an Azure Web App for Linux to use a [custom runtime image](https://hub.docker.com/r/anthonychu/azure-webapps-deno) and deploys your code using [Run From Package](https://docs.microsoft.com/azure/azure-functions/run-functions-from-deployment-package).

It calls the Azure CLI. Ensure your workflow first authenticates `azure/login`.

---

*This is a community open source project. No official support is provided by Microsoft.*

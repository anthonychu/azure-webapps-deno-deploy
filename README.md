# Azure Web Apps Deno Deploy action

This action deploys a Deno app to Azure Web Apps.

> **Note:** Works with Web Apps for Linux. Create a web app with the default NGINX container and deploy to it.

## Inputs

### `app-name`

**Required** Name of the Azure Web App.

### `resource-group`

**Required** Name of the resource group.

### `package`

**Required** Path to zip package to deploy.

### `script-file`

**Required** Path to the script file to pass to `deno run`.

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
        deno-version: 1.x

    - name: Bundle and zip Deno app
      run: |
        deno bundle server.ts server.bundle.js
        zip app.zip server.bundle.js

    - name: Deploy to Azure Web Apps
      uses: anthonychu/azure-webapps-deno-deploy@master
      with:
        app-name: my-app
        resource-group: my-resource-group
        package: app.zip
        script-file: server.bundle.js
```
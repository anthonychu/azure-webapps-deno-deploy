#!/bin/bash
set -e

echo deno version `deno --version`
exec "$@"

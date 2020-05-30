#!/bin/bash
set -e

# starting sshd process
sed -i "s/SSH_PORT/$SSH_PORT/g" /etc/ssh/sshd_config
/usr/sbin/sshd

echo deno version `deno --version`
exec "$@"

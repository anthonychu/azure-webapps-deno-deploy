FROM debian:stable-20200514-slim

ARG DENO_VERSION=1.0.2
ENV DENO_VERSION=${DENO_VERSION}
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get -qq update \
  && apt-get -qq install -y --no-install-recommends curl ca-certificates unzip openssh-server \
  && curl -fsSL https://github.com/denoland/deno/releases/download/v${DENO_VERSION}/deno-x86_64-unknown-linux-gnu.zip \
  --output deno.zip \
  && unzip deno.zip \
  && rm deno.zip \
  && chmod +x deno \
  && mv deno /usr/bin/deno \
  && apt-get -qq remove --purge -y curl ca-certificates unzip \
  && apt-get -y -qq autoremove \
  && apt-get -qq clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && mkdir -p /home/site/wwwroot /opt/defaultsite \
  && echo "root:Docker!" | chpasswd \
  && rm -f /etc/ssh/sshd_config \
  && mkdir -p /var/run/sshd \
  && chmod 0755 /var/run/sshd

ENV DENO_DIR /deno-dir/
ENV PORT 80
ENV SSH_PORT 2222
EXPOSE 80 2222

COPY sshd_config /etc/ssh/

WORKDIR /home/site/wwwroot
COPY . /opt/defaultsite
RUN chmod +x /opt/defaultsite/startup.sh

ENTRYPOINT [ "/opt/defaultsite/startup.sh" ]
CMD ["deno", "run", "-A", "/opt/defaultsite/server.ts"]

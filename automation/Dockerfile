FROM node:24-bookworm-slim
ARG CODEX_VERSION=0.167.0
RUN apt-get update && apt-get install -y --no-install-recommends python3 git ca-certificates && rm -rf /var/lib/apt/lists/* && npm install -g @openai/codex@${CODEX_VERSION}
COPY proxy.py container.py /opt/aiqa/
USER 1000:1000
ENV HOME=/home/node CODEX_HOME=/tmp/codex GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0 GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=/workspace
WORKDIR /workspace
CMD ["sleep", "infinity"]

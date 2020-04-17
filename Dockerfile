######################
# Stage 1 - Base Build
######################
FROM node AS stage1

WORKDIR /build

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

COPY package.json yarn.lock ./

## force production to false to make sure we install our dev build deps
RUN yarn install --production=false --non-interactive --frozen-lockfile

# copying afterwards makes it nicer for caching
COPY . .

# fire off a clean build
RUN yarn build:clean && yarn build

# Install the production version -we do this here in case we need git, which will fail on node:alpine
RUN yarn install --modules-folder dist/node_modules --production=true --non-interactive --frozen-lockfile

######################
# Stage 2 - Package
######################
FROM node:buster-slim AS stage2
WORKDIR /build

ENV NODE_ENV=$NODE_ENV

WORKDIR /srv/app
COPY --from=stage1 /build .

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable \
      --no-install-recommends \
    && apt-get install -y fonts-noto fonts-noto-cjk fonts-noto-color-emoji fonts-lato \
                          fonts-liberation fonts-thai-tlwg fonts-indic \
                          fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg \
                          fonts-kacst fonts-freefont-ttf \
   && rm -rf /var/lib/apt/lists/*

RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome \
    && mkdir -p /home/chrome/Downloads \
    && chown -R chrome:chrome /home/chrome

# copy build artifacts
COPY --from=stage2 /build/packages/browser/dist/index.* /srv/app/dist/
COPY --from=stage2 /build/packages/browser/package.json /srv/app/package.json

# Run everything after as non-privileged user.
USER chrome

CMD [ "yarn", "start" ]

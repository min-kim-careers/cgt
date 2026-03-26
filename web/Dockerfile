FROM node:23-slim AS base

RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps

ARG PORT
ARG HOST

ENV PORT=${PORT}
ENV HOST=${HOST}

COPY package.json pnpm-lock.yaml /app/
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .

RUN pnpm build

FROM build AS prod

COPY --from=build /app /app
ENV NODE_ENV=production

CMD ["pnpm", "preview", "--host"]

FROM deps AS dev

ENV NODE_ENV=development

CMD ["pnpm", "dev", "--host"]

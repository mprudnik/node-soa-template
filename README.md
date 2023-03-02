# Node.js template for [Service-oriented architecture](https://en.wikipedia.org/wiki/Service-oriented_architecture)

## Components

Template consist of:
1. Infrastructural services (`src/infra/`)
1. Application and domain services (`src/services/`)
1. API layer (`src/api`)
1. Server with its plugins as a separate unit

Built using:
 - `fastify` and its ecosystem - https://www.fastify.io/
 - `prisma` - https://www.prisma.io/
 - `redis` - https://redis.io/

Above dependencies can be replaced, but it will probably require some effort since they contain
a lot of out-of-the-box functionality, that aren't always present in their alternatives.

### Infrastructure

Contains services required by domain and application services to do their job.
Database connections, logging, messsaging, external API clients - all are valid examples
of Infrastructural services. Those services contain no logic and as result can be reused
on any project.

#### Bus

Important part of infrastructure as it helps to decouple different parts of application
(as a midiator) and also handles communication between services. Implements `Pub/Sub` and
`Command` interfaces allowing RPC-like calls and handling of events. Additonally contains
methods for handling schemas and injecting metadata.
Has 2 implementations - `local` (using `EventEmitter`) and `distributed` (using `redis`)
for ability to start from monolith and later smoothly transition to microservices.

### Services

This layer contains all app specific logic. Each service consist of `commands` and `eventHandlers`
implemented using domain function like style where each function receives `infra` as a first
argument and actual payload as a second. Infrastructe gets injected into each function using
partial application.
Services should know only about Infrastructure (interfaces) and `lib` (utility functions, commun
schemas etc...).
`src/services/error.js` contains general `ServiceError` that should be used inside services.
Those errors are caught and processed as expected errors. All other errors are treated as
internal errors so they cannot be used to communicate to end user.
`src/services/types.d.ts` contains `Command` and `EventHandler` generic types as well as typings
for services supporting functions.
`src/services/services.js` contains logic to initialize services - inject `infra`, wrap into helper
function and register them to `bus`.

#### Commands

Consist of named commands, each of which consist of `auth`, `input`, `output` schemas and `handler`.
`auth` schema can contain any metadata to define access to current service function (e.g. list
of allowed roles or required permissions) - this data will be passed to `auth` service's `verify`
function along with users data to check access rights.
`input` and `output` are used to validate `payload` and results, described using JSONSchema
allowing getting types from it and easy integration into `fastify`'s ecosystem.
`handler` - service function.

#### EventHandlers

Consist of `eventName` `eventHandler` pairs. Each `eventHandler` is a service function.

### API

This layer maps service commands to external users. Currently supports HTTP requests only.
Each endpoint definition implements `HTTPRoute` or `HTTPRouteRaw`.
First one is simple mapping of HTTP's `url`, `method` and `inputSource` to a `command`.
Second one is used when more flexibility required - it has access to `req`/`res` objects
inside its `handler` with `bus` injected.

### Server

Contains `fastify` HTTP and WebSocket (currently only for notification like messages) servers.
Additionally has multiple plugins from `fastify`'s ecosystem (cors, swagger, auth...) as well as
custom plugins for transforming HTTP mapping into `fastify` route, handling custom auth and
WebSockets. Currently, `custom-websocket` only emits WS open/close events with `server` and
`websocket` meta and subscribes to new WS message events for current instance of the server.

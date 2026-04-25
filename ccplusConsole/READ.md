# MiniMQ

A RabbitMQ-inspired message broker written in C, using raw TCP sockets.

```
Publisher ──PUBLISH──► Broker (C TCP server) ──stream──► Consumer(s)
                            │
                     Exchange + Routing
                     (direct / fanout / topic)
```

## Features

- **TCP server** — one `pthread` per client connection
- **Exchange types** — direct, fanout, topic (with `*` and `#` wildcards)
- **Pub/Sub** — blocking server-streaming subscribe
- **Thread-safe queues** — `pthread_mutex` + `pthread_cond`
- **Simple text protocol** — telnet-friendly, easy to extend

---

## Build

```bash
make
```

Binaries land in `bin/`:

| Binary              | Purpose              |
|---------------------|----------------------|
| `minimq-server`     | The broker           |
| `minimq-publish`    | CLI publisher client |
| `minimq-consume`    | CLI consumer client  |

---

## Quick Start Demo

Open **three terminals**.

### Terminal 1 — Start the broker
```bash
./bin/minimq-server
# [minimq] listening on port 5673
```

### Terminal 2 — Set up and subscribe
```bash
# You can also use plain telnet for setup:
# telnet 127.0.0.1 5673

# Declare queue
echo -e "QUEUE errors\n" | nc 127.0.0.1 5673

# Declare a topic exchange
echo -e "EXCHANGE app_logs topic\n" | nc 127.0.0.1 5673

# Bind queue to exchange with wildcard
echo -e "BIND errors app_logs app.#\n" | nc 127.0.0.1 5673

# Subscribe (blocks and streams messages)
./bin/minimq-consume errors
```

### Terminal 3 — Publish messages
```bash
./bin/minimq-publish app_logs app.error "disk full on server-01"
./bin/minimq-publish app_logs app.warn  "high memory usage"
./bin/minimq-publish app_logs app.info  "this won't match app.# ... wait, it will"
```

---

## Wire Protocol

All commands are newline-terminated (`\n`). Responses start with `+OK` or `-ERR`.

### Commands

```
QUEUE <name>
    Declare a queue (idempotent).

EXCHANGE <name> <direct|fanout|topic>
    Declare an exchange (idempotent).

BIND <queue> <exchange> <routing_key>
    Bind a queue to an exchange.

PUBLISH <exchange> <routing_key> <payload_len>
<payload bytes>
    Publish a message. Payload follows on the next line.

SUBSCRIBE <queue>
    Enter streaming mode. Server pushes messages as they arrive:
      +MSG <routing_key> <payload_len>
      <payload bytes>

QUIT
    Close connection.
```

### Exchange Routing

| Type    | Routing behaviour                              |
|---------|------------------------------------------------|
| direct  | Exact match on `routing_key`                  |
| fanout  | All bound queues receive the message           |
| topic   | `*` matches one word, `#` matches zero or more |

---

## Architecture

```
main.c          TCP accept loop, spawns pthread per client
handler.c       Line parser, command dispatch, subscribe stream
broker.c        Queue CRUD, exchange CRUD, routing engine
broker.h        All shared data structures (Queue, Exchange, Broker)
```

### Key data structures

```c
Broker          // singleton: owns all queues + exchanges
  Exchange[]    // name, type, bindings[]
    Binding[]   // routing_key → queue_name
  Queue[]       // name, message linked-list, subscriber fds[]
    Message*    // routing_key, payload, next
```

---

## Roadmap (Day 2+)

- [ ] Message persistence (append-only log file)
- [ ] ACK / NACK with re-queue on timeout
- [ ] Round-robin delivery across multiple consumers
- [ ] AMQP 0-9-1 wire compatibility
- [ ] gRPC transport layer on top of broker core
- [ ] Prometheus metrics endpoint
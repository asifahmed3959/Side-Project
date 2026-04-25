#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <pthread.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>

#include "broker.h"
#include "handler.h"

#define DEFAULT_PORT 5673
#define BACKLOG      128

static Broker g_broker;

static void handle_sigint(int sig) {
    (void)sig;
    printf("\n[minimq] shutting down\n");
    exit(0);
}

int main(int argc, char *argv[]) {
    int port = DEFAULT_PORT;
    if (argc == 2) port = atoi(argv[1]);

    signal(SIGINT,  handle_sigint);
    signal(SIGPIPE, SIG_IGN);   /* don't crash on broken subscriber pipes */

    broker_init(&g_broker);
    printf("[minimq] broker initialised\n");

    /* ── create TCP listen socket ── */
    int srv = socket(AF_INET, SOCK_STREAM, 0);
    if (srv < 0) { perror("socket"); return 1; }

    int opt = 1;
    setsockopt(srv, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr = {
        .sin_family      = AF_INET,
        .sin_port        = htons((uint16_t)port),
        .sin_addr.s_addr = INADDR_ANY
    };

    if (bind(srv, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("bind"); return 1;
    }
    if (listen(srv, BACKLOG) < 0) {
        perror("listen"); return 1;
    }

    printf("[minimq] listening on port %d\n", port);

    /* ── accept loop ── */
    for (;;) {
        struct sockaddr_in cli_addr;
        socklen_t cli_len = sizeof(cli_addr);
        int cli_fd = accept(srv, (struct sockaddr *)&cli_addr, &cli_len);
        if (cli_fd < 0) { perror("accept"); continue; }

        char ip[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &cli_addr.sin_addr, ip, sizeof(ip));
        printf("[minimq] client connected: %s:%d (fd=%d)\n",
               ip, ntohs(cli_addr.sin_port), cli_fd);

        ClientCtx *ctx = malloc(sizeof(ClientCtx));
        if (!ctx) { close(cli_fd); continue; }
        ctx->fd     = cli_fd;
        ctx->broker = &g_broker;

        pthread_t tid;
        pthread_attr_t attr;
        pthread_attr_init(&attr);
        pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
        pthread_create(&tid, &attr, handle_client, ctx);
        pthread_attr_destroy(&attr);
    }

    close(srv);
    return 0;
}
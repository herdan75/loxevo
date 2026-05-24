#include <arpa/inet.h>
#include <ctype.h>
#include <errno.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <time.h>
#include <unistd.h>

#ifndef SO_REUSEPORT
#define SO_REUSEPORT 15
#endif

#define SSDP_PORT 1900
#define SSDP_GROUP "239.255.255.250"
#define BUFFER_SIZE 4096
#define RESPONSE_SIZE 2048

static volatile sig_atomic_t running = 1;

static void handle_signal(int signum) {
  (void)signum;
  running = 0;
}

static bool is_empty(const char *value) {
  return value == NULL || value[0] == '\0';
}

static void log_line(const char *level, const char *format, ...) {
  va_list args;
  fprintf(stdout, "%s ", level);
  va_start(args, format);
  vfprintf(stdout, format, args);
  va_end(args);
  fprintf(stdout, "\n");
  fflush(stdout);
}

static const char *arg_value(int argc, char **argv, const char *name, const char *fallback) {
  for (int i = 1; i < argc - 1; i += 1) {
    if (strcmp(argv[i], name) == 0) {
      return argv[i + 1];
    }
  }
  return fallback;
}

static bool contains_ci(const char *haystack, const char *needle) {
  if (!haystack || !needle) return false;
  size_t needle_len = strlen(needle);
  if (needle_len == 0) return true;

  for (const char *cursor = haystack; *cursor; cursor += 1) {
    size_t index = 0;
    while (index < needle_len && cursor[index] &&
           tolower((unsigned char)cursor[index]) == tolower((unsigned char)needle[index])) {
      index += 1;
    }
    if (index == needle_len) return true;
  }
  return false;
}

static void trim(char *value) {
  if (!value) return;

  char *start = value;
  while (*start && isspace((unsigned char)*start)) start += 1;
  if (start != value) memmove(value, start, strlen(start) + 1);

  size_t len = strlen(value);
  while (len > 0 && isspace((unsigned char)value[len - 1])) {
    value[len - 1] = '\0';
    len -= 1;
  }
}

static void read_header(const char *message, const char *header_name, char *out, size_t out_size) {
  if (!message || !header_name || !out || out_size == 0) return;
  out[0] = '\0';

  size_t header_len = strlen(header_name);
  const char *line = message;
  while (*line) {
    const char *line_end = strstr(line, "\n");
    size_t line_len = line_end ? (size_t)(line_end - line) : strlen(line);
    if (line_len > 0 && line[line_len - 1] == '\r') line_len -= 1;

    if (line_len > header_len && strncasecmp(line, header_name, header_len) == 0 && line[header_len] == ':') {
      size_t value_len = line_len - header_len - 1;
      if (value_len >= out_size) value_len = out_size - 1;
      memcpy(out, line + header_len + 1, value_len);
      out[value_len] = '\0';
      trim(out);
      return;
    }

    if (!line_end) break;
    line = line_end + 1;
  }
}

static void build_response(char *out, size_t out_size, const char *ip, const char *port,
                           const char *bridge_id, const char *uuid, const char *st) {
  char usn[256];
  if (strncmp(st, "uuid:", 5) == 0) {
    snprintf(usn, sizeof(usn), "%s", st);
  } else {
    snprintf(usn, sizeof(usn), "uuid:%s::%s", uuid, st);
  }

  snprintf(out, out_size,
           "HTTP/1.1 200 OK\r\n"
           "CACHE-CONTROL: max-age=100\r\n"
           "EXT:\r\n"
           "LOCATION: http://%s:%s/description.xml\r\n"
           "SERVER: Linux/3.14.0 UPnP/1.0 IpBridge/1.50.0\r\n"
           "ST: %s\r\n"
           "USN: %s\r\n"
           "hue-bridgeid: %s\r\n"
           "\r\n",
           ip, port, st, usn, bridge_id);
}

static void build_notify(char *out, size_t out_size, const char *ip, const char *port,
                         const char *bridge_id, const char *uuid, const char *nt) {
  char usn[256];
  if (strncmp(nt, "uuid:", 5) == 0) {
    snprintf(usn, sizeof(usn), "%s", nt);
  } else {
    snprintf(usn, sizeof(usn), "uuid:%s::%s", uuid, nt);
  }

  snprintf(out, out_size,
           "NOTIFY * HTTP/1.1\r\n"
           "HOST: 239.255.255.250:1900\r\n"
           "CACHE-CONTROL: max-age=1800\r\n"
           "LOCATION: http://%s:%s/description.xml\r\n"
           "NT: %s\r\n"
           "NTS: ssdp:alive\r\n"
           "SERVER: Linux/3.14.0 UPnP/1.0 IpBridge/1.50.0\r\n"
           "USN: %s\r\n"
           "hue-bridgeid: %s\r\n"
           "\r\n",
           ip, port, nt, usn, bridge_id);
}

static int create_socket_with_options(const char *ip, bool use_reuse_port) {
  int sock = socket(AF_INET, SOCK_DGRAM, 0);
  if (sock < 0) return -1;

  int enabled = 1;
  setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &enabled, sizeof(enabled));
  if (use_reuse_port) {
    setsockopt(sock, SOL_SOCKET, SO_REUSEPORT, &enabled, sizeof(enabled));
  }

  int recv_buffer = 65536;
  setsockopt(sock, SOL_SOCKET, SO_RCVBUF, &recv_buffer, sizeof(recv_buffer));

  struct sockaddr_in bind_addr;
  memset(&bind_addr, 0, sizeof(bind_addr));
  bind_addr.sin_family = AF_INET;
  bind_addr.sin_port = htons(SSDP_PORT);
  bind_addr.sin_addr.s_addr = htonl(INADDR_ANY);

  if (bind(sock, (struct sockaddr *)&bind_addr, sizeof(bind_addr)) < 0) {
    int saved_errno = errno;
    close(sock);
    errno = saved_errno;
    return -1;
  }

  struct ip_mreq mreq;
  memset(&mreq, 0, sizeof(mreq));
  mreq.imr_multiaddr.s_addr = inet_addr(SSDP_GROUP);
  mreq.imr_interface.s_addr = htonl(INADDR_ANY);

  if (setsockopt(sock, IPPROTO_IP, IP_ADD_MEMBERSHIP, &mreq, sizeof(mreq)) < 0) {
    int saved_errno = errno;
    close(sock);
    errno = saved_errno;
    return -1;
  }

  if (!is_empty(ip)) {
    struct in_addr iface;
    iface.s_addr = inet_addr(ip);
    setsockopt(sock, IPPROTO_IP, IP_MULTICAST_IF, &iface, sizeof(iface));
  }

  unsigned char ttl = 2;
  setsockopt(sock, IPPROTO_IP, IP_MULTICAST_TTL, &ttl, sizeof(ttl));

  return sock;
}

static int create_socket(const char *ip, bool *reuse_port_used) {
  int sock = create_socket_with_options(ip, true);
  if (sock >= 0) {
    if (reuse_port_used) *reuse_port_used = true;
    return sock;
  }

  if (errno != EADDRINUSE) {
    return -1;
  }

  sock = create_socket_with_options(ip, false);
  if (sock >= 0) {
    if (reuse_port_used) *reuse_port_used = false;
    return sock;
  }

  return -1;
}

static void send_notify_burst(int sock, const char *ip, const char *port,
                              const char *bridge_id, const char *uuid) {
  struct sockaddr_in target;
  memset(&target, 0, sizeof(target));
  target.sin_family = AF_INET;
  target.sin_port = htons(SSDP_PORT);
  target.sin_addr.s_addr = inet_addr(SSDP_GROUP);

  char uuid_nt[256];
  snprintf(uuid_nt, sizeof(uuid_nt), "uuid:%s", uuid);
  const char *nts[] = {
    "upnp:rootdevice",
    uuid_nt,
    "urn:schemas-upnp-org:device:Basic:1"
  };

  char packet[RESPONSE_SIZE];
  for (size_t i = 0; i < sizeof(nts) / sizeof(nts[0]); i += 1) {
    build_notify(packet, sizeof(packet), ip, port, bridge_id, uuid, nts[i]);
    sendto(sock, packet, strlen(packet), 0, (struct sockaddr *)&target, sizeof(target));
    sleep(1);
  }
  log_line("INFO", "SSDP NOTIFY burst sent");
}

static void respond_if_search(int sock, char *message, ssize_t length, struct sockaddr_in *remote,
                              const char *ip, const char *port, const char *bridge_id, const char *uuid) {
  if (length <= 0) return;
  message[length] = '\0';
  if (strncasecmp(message, "M-SEARCH", 8) != 0) return;
  if (!contains_ci(message, "ssdp:discover")) return;

  char st_header[256];
  read_header(message, "st", st_header, sizeof(st_header));
  char address[INET_ADDRSTRLEN];
  inet_ntop(AF_INET, &remote->sin_addr, address, sizeof(address));

  char uuid_st[256];
  snprintf(uuid_st, sizeof(uuid_st), "uuid:%s", uuid);

  const char *targets[3];
  size_t target_count = 0;
  if (contains_ci(st_header, "ssdp:all")) {
    targets[target_count++] = "upnp:rootdevice";
    targets[target_count++] = uuid_st;
    targets[target_count++] = "urn:schemas-upnp-org:device:Basic:1";
  } else if (contains_ci(st_header, "upnp:rootdevice")) {
    targets[target_count++] = "upnp:rootdevice";
  } else if (contains_ci(st_header, "basic:1")) {
    targets[target_count++] = "urn:schemas-upnp-org:device:Basic:1";
  } else if (contains_ci(st_header, "uuid:")) {
    targets[target_count++] = uuid_st;
  }
  if (target_count == 0) return;

  log_line("INFO", "SSDP search received from %s:%d ST=%s", address, ntohs(remote->sin_port), st_header);

  char response[RESPONSE_SIZE];
  for (size_t index = 0; index < target_count; index += 1) {
    const char *target = targets[index];
    build_response(response, sizeof(response), ip, port, bridge_id, uuid, target);
    ssize_t sent = sendto(sock, response, strlen(response), 0, (struct sockaddr *)remote, sizeof(*remote));
    if (sent < 0) {
      log_line("ERROR", "SSDP response failed to %s:%d: %s", address, ntohs(remote->sin_port), strerror(errno));
      continue;
    }

    log_line("INFO", "SSDP response sent to %s:%d ST=%s", address, ntohs(remote->sin_port), target);
  }
}

int main(int argc, char **argv) {
  const char *ip = arg_value(argc, argv, "--ip", "");
  const char *port = arg_value(argc, argv, "--port", "8080");
  const char *bridge_id = arg_value(argc, argv, "--bridge-id", "");
  const char *uuid = arg_value(argc, argv, "--uuid", "");

  if (is_empty(ip) || is_empty(port) || is_empty(bridge_id) || is_empty(uuid)) {
    fprintf(stderr, "Usage: %s --ip <ip> --port <port> --bridge-id <bridgeId> --uuid <uuid>\n", argv[0]);
    return 2;
  }

  setvbuf(stdout, NULL, _IOLBF, 0);
  signal(SIGTERM, handle_signal);
  signal(SIGINT, handle_signal);

  bool reuse_port_used = false;
  int sock = create_socket(ip, &reuse_port_used);
  if (sock < 0) {
    fprintf(stderr, "ERROR bind UDP 1900 failed: %s\n", strerror(errno));
    return 1;
  }

  log_line("READY", "bind=0.0.0.0:%d reuseport=%d location=http://%s:%s/description.xml", SSDP_PORT, reuse_port_used ? 1 : 0, ip, port);
  send_notify_burst(sock, ip, port, bridge_id, uuid);

  time_t last_notify = time(NULL);
  char buffer[BUFFER_SIZE + 1];

  while (running) {
    fd_set read_fds;
    FD_ZERO(&read_fds);
    FD_SET(sock, &read_fds);

    struct timeval timeout;
    timeout.tv_sec = 1;
    timeout.tv_usec = 0;

    int result = select(sock + 1, &read_fds, NULL, NULL, &timeout);
    if (result > 0 && FD_ISSET(sock, &read_fds)) {
      struct sockaddr_in remote;
      socklen_t remote_len = sizeof(remote);
      ssize_t length = recvfrom(sock, buffer, BUFFER_SIZE, 0, (struct sockaddr *)&remote, &remote_len);
      if (length > 0) {
        respond_if_search(sock, buffer, length, &remote, ip, port, bridge_id, uuid);
      }
    }

    time_t now = time(NULL);
    if (now - last_notify >= 300) {
      send_notify_burst(sock, ip, port, bridge_id, uuid);
      last_notify = now;
    }
  }

  close(sock);
  log_line("INFO", "SSDP helper stopped");
  return 0;
}

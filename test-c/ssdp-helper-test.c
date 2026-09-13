#define main ssdp_helper_main
#include "../src/ssdp-helper.c"
#undef main
#include <assert.h>

int main(void) {
  char header[16];
  read_header("M-SEARCH * HTTP/1.1\r\nsT: ssdp:all\r\n\r\n", "ST", header, sizeof(header));
  assert(strcmp(header, "ssdp:all") == 0);
  read_header("ST:aaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n", "st", header, sizeof(header));
  assert(strlen(header) == sizeof(header) - 1);
  read_header("X-ST: ignored\n", "st", header, sizeof(header));
  assert(header[0] == '\0');
  char response[RESPONSE_SIZE];
  build_response(response, sizeof(response), "127.0.0.1", "8080", "TESTBRIDGE", "test-id", "upnp:rootdevice");
  assert(strstr(response, "LOCATION: http://127.0.0.1:8080/description.xml\r\n"));
  assert(strstr(response, "USN: uuid:test-id::upnp:rootdevice\r\n"));
  build_notify(response, sizeof(response), "127.0.0.1", "8080", "TESTBRIDGE", "test-id", "uuid:test-id");
  assert(strstr(response, "NTS: ssdp:alive\r\n"));
  assert(strstr(response, "USN: uuid:test-id\r\n"));
  puts("SSDP helper parser and packet tests passed");
  return 0;
}

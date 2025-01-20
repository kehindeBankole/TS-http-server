import * as net from "net";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    console.log("Received data:", data.toString());
  });

  socket.write("HTTP/1.1 200 OK\r\n\r\n");
  socket.end();

  socket.on("close", () => {
    console.log("Client disconnected!");
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });
});

server.listen(4221, "localhost");

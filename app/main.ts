import * as net from "net";
import * as fs from "fs";
import * as zlib from "zlib";
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const body = request.split("\r\n\r\n")[1];
    const method = request.split(" ")[0];
    const path = request.split(" ")[1];
    const query = path.split("/")[2];
    const headers = request.split("\r\n");
    const userAgentHeader = headers.find((header) =>
      header.toLowerCase().startsWith("user-agent:")
    );
    const userAgentValue = userAgentHeader
      ? userAgentHeader.split(": ")[1]
      : "";

    const acceptEncodingHeader = headers.find((header) =>
      header.toLowerCase().startsWith("accept-encoding:")
    );

    const acceptEncodingValue = acceptEncodingHeader
      ? acceptEncodingHeader.split(": ")[1]
      : "";

    const supportsGzip = acceptEncodingValue.includes("gzip");

    // const response = path === '/' ? 'HTTP/1.1 200 OK\r\n\r\n' : 'HTTP/1.1 404 Not Found\r\n\r\n';
    // socket.write(response);
    console.log({ path, request });
    if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
      socket.end();
    } else if (path === `/echo/${query}`) {
      //  let responseHeaders = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n`;

      if (supportsGzip) {
       
        zlib.gzip(query, (err, compressedData) => {
          if (err) {
            socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
            return;
          }

          // Send the response with gzip encoding
          const responseHeaders = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${compressedData.length}\r\n\r\n`;
          socket.write(responseHeaders);
          socket.write(compressedData);
         socket.end();
        });
      } else {
        // Send the response without compression
        const responseHeaders = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n\r\n`;
        socket.write(responseHeaders);
        socket.write(query);
       socket.end();
      }
    
      // responseHeaders += `\r\n${query}`;
      // socket.write(responseHeaders);
      // socket.write(
      //   `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${query.length}\r\n\r\n${query}`
      // );
    } else if (path === "/user-agent") {
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgentValue.length}\r\n\r\n${userAgentValue}`
      );
    } else if (path.startsWith("/files/")) {
      console.log({ method });
      if (method === "GET") {
        let directory: string = process.argv[3];
        let fileName: string = query;
        try {
          const content = fs.readFileSync(directory + fileName);
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
          );
        } catch (error) {
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
      } else if (method === "POST") {
        let directory: string = process.argv[3];
        let fileName: string = query;
        try {
          fs.writeFileSync(`${directory}${fileName}`, body, "utf8");
          socket.write("HTTP/1.1 201 Created\r\n\r\n");
        } catch (error) {
          socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        }
      }
      socket.end();
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.end();
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected!");
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });
});

server.listen(4221, "localhost", () => {
  console.log("Server is listening on localhost:4221");
});

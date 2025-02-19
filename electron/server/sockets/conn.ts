let io;

export function connectSocket(cio) {
  io = cio;

  // 클라이언트 연결 시 이벤트 처리
  io.on("connection", (socket) => {
    console.log("클라이언트 연결:", socket.id);

    socket.on("chat message", (msg) => {
      console.log("메시지 수신:", msg);
      io.emit("chat message", msg);
    });

    // 클라이언트 연결 종료 시
    socket.on("disconnect", () => {
      console.log("클라이언트 연결 종료:", socket.id);
    });
  });
}

export function sendRenderProgress(per: number) {
  io.emit("render:progress", per);
}

export function sendRenderDone(path: string) {
  io.emit("render:done", path);
}

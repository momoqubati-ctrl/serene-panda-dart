import { createSocketServer } from "../socket";

export default (nitroApp: any) => {
  let initialized = false;

  nitroApp.hooks.hook("request", (event: any) => {
    if (initialized) return;

    // Extract the raw HTTP server instance from the request/response socket
    const httpServer = event.node.req.socket?.server || event.node.res.socket?.server;
    
    if (httpServer) {
      try {
        createSocketServer(httpServer);
        initialized = true;
        console.log("[Socket.io] Successfully initialized Socket.io server on Nitro HTTP server");
      } catch (error) {
        console.error("[Socket.io] Error initializing Socket.io server:", error);
      }
    }
  });
};

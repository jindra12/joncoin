import { createServer } from "http2";
import { Server } from "socket.io";
import { Manager } from "socket.io-client";
import sample from "lodash-es/sample";
import Settings from "../../settings.json";
import { nameListNameSpace, nameListEventName, nameListReceived } from "./constants";
import { NameList } from "./types";

let io: Server | undefined;

export const buildServer = () => new Promise<Server>((resolve, reject) => {
    if (io) {
        return resolve(io);
    }
    const httpServer = createServer();
    io = new Server(httpServer);
    io.on("connection", (socket) => {
        io = io;
        resolve(io!);
        socket.on("disconnect", () => {
            reject();
        });
    });

    httpServer.listen(Settings.socketio.port);
});

export const getNeighbors = async () => {
    const connectionPool: Manager[] = [];
    Settings.socketio.localAgents.forEach((localAgent) => {
        const client = new Manager(localAgent);
        const nameSocket = client.socket(nameListNameSpace);
        nameSocket.emit(nameListEventName);
        nameSocket.on(nameListReceived, (list: NameList) => {
            list.names.forEach((name) => {
                if (connectionPool.length < Settings.socketio.maxNeighbours) {
                    connectionPool.push(new Manager(name));
                }
            });
        });
        if (connectionPool.length < Settings.socketio.maxNeighbours) {
            connectionPool.push(client);
        }
    });
    return connectionPool;
};

export const spreadRumor = <T>(namespace: string, eventType: string, data: T, neighbors: Manager[]) => {
    const randomNeighbor = sample(neighbors);
    if (randomNeighbor) {
        const socket = randomNeighbor.socket(namespace);
        socket.emit(eventType, data);
    }
};
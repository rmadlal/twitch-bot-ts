import * as tmi from "tmi.js";
import * as funcs from "./funcs";
import * as fs from "fs";

interface ConfigJson {
    myChannelName: string,
    myChannelID: string,
    botChannelName: string,
    clientID: string,
    botChatOAuth: string,
    botAPIOAuth: string
}

export interface Command {
    name: string,
    fun: () => void;
}

export let chatclient;
export let myChannelName, myChannelID, clientID, botAPIOAuth;
let botChannelName, botChatOAuth;

export let commands: Command[] = [
    {
        name: "!help",
        fun: funcs.displayCommands
    },
    {
        name: "!highlight",
        fun: funcs.saveTimestamp
    },
    {
        name: "!joke",
        fun: funcs.sendJoke
    },
    {
        name: "!pyramid",
        fun: funcs.printPyramidUsage
    }
];

function main() {
    let configFile: ConfigJson = JSON.parse(fs.readFileSync("botconfig.json", "utf8"));
    myChannelName = configFile.myChannelName;
    myChannelID = configFile.myChannelID;
    botChannelName = configFile.botChannelName;
    clientID = configFile.clientID;
    botChatOAuth = configFile.botChatOAuth;
    botAPIOAuth = configFile.botAPIOAuth;

    chatclient = new tmi.client({
        options: {
            debug: true
        },
        connection: {
            cluster: "aws",
            reconnect: true
        },
        identity: {
            username: botChannelName,
            password: botChatOAuth
        },
        channels: [myChannelName]
    }) as any;

    chatclient.connect()
    .then((data) => console.log(`connected to ${data[0]}:${data[1]}`))
    .catch((err) => console.error(err));

    chatclient.on("chat", (channel, userstate, message, self) => {
        if (self) return;
        if (userstate.username === myChannelName) {
            if (message.startsWith("!game ")) {
                funcs.changeGame(message.slice("!game ".length, message.length));
                return;
            }
            if (message.startsWith("!title ")) {
                funcs.changeTitle(message.slice("!title ".length, message.length));
                return;
            }
        }
        let command = commands.find((command) => command.name === message);
        if (command !== undefined) {
            command.fun();
        } else {
            if (message.startsWith("!pyramid ") || message.startsWith("!p ")) {
                funcs.makePyramid(message.split(' ').slice(1));
                return;
            } 
            if (message.startsWith("!")) {
                chatclient.action(myChannelName, "Type !help for a list of commands!")
                .catch((err) => console.error(err));
                return;
            } 
            if (message === "PogChamp") {
                chatclient.say(myChannelName, "ChampPog")
                .catch((err) => console.error(err));
                return;
            }
            if (message === "ChampPog") {
                chatclient.say(myChannelName, "PogChamp")
                .catch((err) => console.error(err));
                return;
            }
        }
    });

    chatclient.on("hosted", (channel, username, viewers, autohost) => {
        chatclient.action(myChannelName, `${username}, thanks for the host!`)
        .catch((err) => console.error(err));
    });

    chatclient.on("join", (channel, username, self) => {
        if (self) {
            chatclient.action(myChannelName, "Hi!")
            .catch((err) => console.error(err));
            return;
        }
        switch (username) {
        case "zet237":
            chatclient.say(myChannelName, "zetChamp")
            .catch((err) => console.error(err));
            break;
        case "elojimmini":
            chatclient.say(myChannelName, "eloChamp")
            .catch((err) => console.error(err));
            break;
        case "willson93":
            chatclient.say(myChannelName, "shut the fuck up willson Kappa")
            .catch((err) => console.error(err));
            break;
        case "toothpickwilly":
            chatclient.say(myChannelName, "toothO")
            .catch((err) => console.error(err));
            break;
        }
    });
}

main();

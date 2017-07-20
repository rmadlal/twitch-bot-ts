import fetch from "node-fetch";
import { appendFile } from "fs";
import { compose, pluck, filter, join, slice } from 'ramda';
import { Command, commands, chatclient, myChannelName, myChannelID, botAPIOAuth, clientID } from "./app";

const getCommandNames: (commands: Command[]) => string = compose(
    (names: string[]) => join(' ', names),
    (commands: Command[]) => pluck("name", commands),
    (commands: Command[]) => slice(1, commands.length, commands));

export function displayCommands(): void {
    let cmdNames = getCommandNames(commands);
    chatclient.action(myChannelName, `Commands: ${cmdNames}`)
    .catch((err) => console.error(err));
}

export function saveTimestamp(): void {
    fetch("https://api.twitch.tv/kraken/streams/" + myChannelID, {
        headers: {
            "Accept": "application/vnd.twitchtv.v5+json",
            "Client-ID": clientID
        }
    })
    .then((res) => res.json())
    .then((json) => {
        if (json.stream === null) return;
        let streamStart = new Date(json.stream.created_at);
        let elapsed = Date.now() - streamStart.valueOf();
        let hours = "" + Math.floor((elapsed / (1000*60*60)) % 24);
        let minutes = Math.floor((elapsed / (1000*60)) % 60);
        let time = hours + ":" + (minutes < 10 ? "0" : "") + minutes;
        return appendFile("timestamps.txt", time + "\r\n", (err) => {
            if (err) throw err;
            return chatclient.action(myChannelName, `Timestamp saved! [${time}]`);
        });
    })
    .catch((err) => console.error(err));
}

let jokes;
export function sendJoke(): void {
    if (!jokes) {
        fetch("https://www.reddit.com/r/Jokes/top.json?sort=top&t=week&limit=100")
        .then((res) => res.json())
        .then((json) => {
            jokes = filter((post: any) => post.data.selftext.length < 150, json.data.children);
            console.log(`Got ${jokes.length} jokes!`);
            let randomJoke = jokes[Math.floor(Math.random()*jokes.length)].data;
            return chatclient.say(myChannelName, 
                                  `${randomJoke.title} ${randomJoke.selftext.replace("\n", " ")}`);
        }) 
        .catch((err) => console.error(err));
    } else {
        let randomJoke = jokes[Math.floor(Math.random()*jokes.length)].data;
        chatclient.say(myChannelName, 
                       `${randomJoke.title} ${randomJoke.selftext.replace("\n", " ")}`)
        .catch((err) => console.error(err));
    }
}

export function printPyramidUsage(): void {
    chatclient.action(myChannelName, "Usage: !pyramid (<size>) <word>")
    .catch((err) => console.error(err));
}

export function makePyramid(messageArr: string[]): void {
    if (messageArr.length > 2) return;
    let size: number = 3;
    let text: string = (messageArr.length == 1 || isNaN(parseInt(messageArr[0]))) ? messageArr[0] : messageArr[1];
    if (messageArr.length > 1 && 
        !isNaN(parseInt(messageArr[0])) && ((size = parseInt(messageArr[0])) < 1 || size >= 8)) {
        chatclient.action(myChannelName, "Pyramid size must be a number between 1 and 7")
        .catch((err) => console.error(err));
    }
    if (text.length >= 50) {
        chatclient.action(myChannelName, "Your word is too long!")
        .catch((err) => console.error(err));
    }
    if (text === "" || text === ' ') return;
    makePyramidRec(size, text, 2*size - 1);
}
function makePyramidRec(size: number, text: string, counter: number): void {
        if (counter === 0) return;
        let textArr: string[] = [];
        for (let i = 1; i <= (counter <= size ? counter : 2*size - counter); i++) {
            textArr.push(text);
        }
        chatclient.say(myChannelName, join(' ', textArr))
        .then((data) => makePyramidRec(size, text, counter-1))
        .catch((err) => console.error(err));
}

export function changeGame(game: string) : void {
    fetch("https://api.twitch.tv/kraken/channels/" + myChannelID, {
        method: "PUT",
        headers: {
            "Accept": "application/vnd.twitchtv.v5+json",
            "Client-ID": clientID,
            "Authorization": "OAuth " + botAPIOAuth,
            "Content-Type": "application/json"
        },
        body: `{"channel": {"game": "${game}"}}`
    })
    .catch((err) => console.error(err));
}

export function changeTitle(title: string) : void {
    fetch("https://api.twitch.tv/kraken/channels/" + myChannelID, {
        method: "PUT",
        headers: {
            "Accept": "application/vnd.twitchtv.v5+json",
            "Client-ID": clientID,
            "Authorization": "OAuth " + botAPIOAuth,
            "Content-Type": "application/json"
        },
        body: `{"channel": {"status": "${title}"}}`
    })
    .catch((err) => console.error(err));
}

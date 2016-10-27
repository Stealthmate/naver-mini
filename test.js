let parseArgs = require('minimist');
let aliases = {
    "h":"host",
    "p":"port",
    "d": "delay",
    "s": "silent"
};
const ARGS = parseArgs(process.argv.slice(2), {alias: aliases});

const HOST = ARGS.host || "localhost";
const TEST_PORT = ARGS.port || 25565;
const PATH = ARGS.path || "/kr/details?lnk=detail.nhn?docid=41273900";
const MAX_REQUESTS = ARGS.n || 200;
const DELAY = ARGS.delay || 100;
const SILENT = ARGS.silent || true;
const NOSERV = ARGS.noserv || false;

let serverproc = undefined;

if(!NOSERV) {
    let childproc = require('child_process');
    let arg_port = "-p=" + TEST_PORT;
    serverproc = childproc.fork("./server.js", [arg_port], {
        silent: SILENT
    });
}

let http = require('http');
const REQUEST_OPTIONS = {
    host: HOST,
    port: TEST_PORT,
    path: "/kr?q=남자",
    method: 'GET'
};

let reqs = [];
let responses = 0;
let totalTime = 0;

const readline = require('readline');

function postTest() {
    console.log("Test over.");
    let avg = 0;
    let max = -1;
    let min = 9999999999999;
    for (let i = 0; i <= reqs.length - 1; i++) {
        avg += reqs[i];
        if(max < reqs[i]) max = reqs[i];
        if(min > reqs[i]) min = reqs[i];
    }
    avg = avg / reqs.length;
    console.log("Average response time: " + avg.toFixed(2));
    console.log("Max response time: " + max);
    console.log("Min response time: " + min);
    totalTime = (Date.now() - totalTime) / 1000;
    console.log("Total time: " + totalTime);
    process.exit(0);

}

function request(i) {
    let req = http.request(REQUEST_OPTIONS, res => {
        res.setEncoding("utf-8");

        res.on('data', ()=>{}).on('end', () => {
            responses++;
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0, null);
            process.stdout.write((responses * 100 / MAX_REQUESTS).toFixed(0) + "%...");
            reqs[i] = (Date.now() - reqs[i]) / 1000.0;
            if (responses == MAX_REQUESTS) {
                console.log();
                postTest();
            }
        });
    });
    reqs.push(Date.now());
    req.end();
}

function runTest() {
    console.log("Running test...");
    console.log("Running " + MAX_REQUESTS + " requests.");
    totalTime = Date.now();
    for (let i = 0; i <= MAX_REQUESTS - 1; i++) {
        setTimeout(request, DELAY * i, [i]);
    }
}

const MAX_TRIES = 3;
const TIMEOUT = 1000;
let tries = 0;

function repoll() {
    console.log("Server is not yet up. Rechecking in " + TIMEOUT + " seconds...");
    setTimeout(poll, TIMEOUT);
}

function poll() {
    if (tries >= MAX_TRIES) {
        console.log("Could not connect to server after " + tries + " tries (max:" + MAX_TRIES + "). Aborting test.");
        process.exit(0);
    }
    tries++;
    console.log("Check server status...(" + tries + ")");
    let req = http.request(REQUEST_OPTIONS, res => {

        if (res.statusCode == 404) {
            console.log("Error 404. Aborting test...");
            process.exit(0);
        }

        console.log("Server is up. " + res.statusCode);
        runTest();
    });
    req.on('error', repoll);
    req.end();
}

poll();

let http = require('http');
const REQUEST_OPTIONS = {
    host: "localhost",
    port: 80,
    path: "/kr/details?lnk=",
    method: 'GET'
};

var reqs = {};

REQUEST_OPTIONS.path += encodeURIComponent("detail.nhn?docid=41273900");

function dummy(res) {
	console.log("Response");
	return;
}

for(let i=0;i<=100;i++) {
	console.log("Request");
	let req = http.request(REQUEST_OPTIONS, res => {
		console.log(i, (Date.now() - reqs[i]) / 1000.0);
	});
	reqs[i] = Date.now();
	req.end();
}

/*
let html = "<html>ASDASDASD</html>";
console.log(process.memoryUsage().heapUsed / 1024);
let $ = undefined;
let cheerio = require('cheerio');
for(let i=0;i<=10000;i++) {
	$ = cheerio.load(html);
	$.close();
}
gc();
console.log(process.memoryUsage().heapUsed / 1024);*/

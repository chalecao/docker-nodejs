/**
 * a barebones HTTP server in JS
 */

var port = 8888,
    http = require('http'),
    urlParser = require('url'),
    fs = require('fs'),
    path = require('path');
// __dirname 获取的是当前软件的路径，是内置变量；process.cwd()获取的是当前命令行目录
const CurrentDir = process.cwd();
const Port = "8088";

let journey = require('journey');
let {
    resolve,
    dirname,
    join
} = require("path");

//
// Create a Router
//
var router = new (journey.Router);

// Create the routing table
//{
// ext: '{"name":"' + _compName + '", "url":"' + _dest + '"}',
//     cmpData: _contBuild
// }
router.map(function () {
    this.post(/^api\/(.*)$/).bind(function (req, res, id, data) {
        console.log(id);
        console.log(data);


    });
});

function handleRequest(request, response) {

    var urlObject = urlParser.parse(request.url, true);
    var pathname = decodeURIComponent(urlObject.pathname);
    console.log('[' + (new Date()).toUTCString() + '] ' + '"' + request.method + ' ' + pathname + '"');
    if (/(api|ajax)/g.test(pathname)) {
        var body = "";
        request.addListener('data', function (chunk) {
            body += chunk
        });
        request.addListener('end', function () {
            //
            // Dispatch the request to the router
            //
            router.handle(request, body, function (result) {
                // response.writeHead(result.status, result.headers);
                response.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
                    "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS"
                });
                response.end(result.body);
            });
        });

    } else {
        var filePath = "";
        if (pathname.indexOf("cmpApp") >= 0) {
            // currentDir = __dirname;
            // console.log(__dirname);
            // console.log(pathname);
            var _subPath = pathname.substr(pathname.indexOf("cmpApp") + 6);
            // console.log(_subPath);
            //静态文件处理
            // filePath = path.join(__dirname, "../static" + (_subPath == "/" ? "/index.html" : _subPath));
            filePath = join(__dirname, ".." + _subPath);
        } else {
            //静态文件处理
            filePath = join(currentDir, pathname);
        }
        fs.stat(filePath, function (err, stats) {
            if (err) {
                response.writeHead(404, {});
                response.end('File not found!');
                return;
            }
            console.log(stats.isDirectory());
            if (stats.isFile()) {
                fs.readFile(filePath, function (err, data) {
                    if (err) {
                        response.writeHead(404, {});
                        response.end('Opps. Resource not found');
                        return;
                    }

                    if (filePath.indexOf("svg") > 0) {
                        response.writeHead(200, {
                            'Content-Type': 'image/svg+xml; charset=utf-8'
                        });
                    } else {
                        response.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
                            "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS"
                        });
                    }
                    response.write(data);
                    response.end();
                });

            } else if (stats.isDirectory()) {
                fs.readdir(filePath, function (error, files) {
                    if (error) {
                        response.writeHead(500, {});
                        response.end();
                        return;
                    }
                    var l = pathname.length;
                    if (pathname.substring(l - 1) != '/') pathname += '/';


                    response.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    response.write('<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>' + filePath + '</title></head><body>');
                    response.write('<a href="/cmpApp/static/index.html" target="_blank"><h1>&nbsp;&nbsp; Start CmpApp </h1></a>');
                    response.write('<h1>' + filePath + '</h1>');
                    response.write('<ul style="list-style:none;font-family:courier new;">');
                    files.unshift('.', '..');
                    files.forEach(function (item) {

                        var urlpath, itemStats;
                        if (pathname.indexOf("cmpApp") >= 0) {
                            urlpath = pathname.substr(pathname.indexOf("cmpApp") + 6) + item;
                            itemStats = fs.statSync(__dirname + "\\.." + urlpath);
                        } else {
                            urlpath = pathname + item
                            itemStats = fs.statSync(currentDir + urlpath);

                        }

                        if (itemStats.isDirectory()) {
                            urlpath += '/';
                            item += '/';
                        }

                        response.write('<li><a href="' + urlpath + '">' + item + '</a></li>');
                    });

                    response.end('</ul></body></html>');
                });
            }
        });
    }
}
let createServer = function (config) {

    currentDir = (config && config.path) || CurrentDir;
    port = +((config&&config.port) || Port);
    let server = http.createServer(handleRequest).listen(port);
    // console.log(port);

    require('dns').lookup(require('os').hostname(), function (err, addr, fam) {
        console.log('server Running at http://' + addr + ((port == 80) ? '' : (':' + port)) + '/');
    })
    console.log('Base directory at ' + currentDir);
    return server;
}
module.exports = createServer()

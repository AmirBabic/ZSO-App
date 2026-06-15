const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const exphbs  = require('express-handlebars');
const showdown  = require('showdown');


// HTTPS server
var converter = new showdown.Converter();

var app = express();
var hbs = exphbs.create({ /* config */ });
app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs');
app.use(express.static('public'))

function traverseContent(dir) {
	var navHtml = '';
    var listHtml = '';
	var cacheHtml = '';
	fs.readdirSync(dir).forEach(file => {
		var filePath = dir  + '/' + file;
		var stats = fs.statSync(filePath);
		if (stats.isDirectory()) {
			// dir
			var result = traverseContent(filePath);
			var name = file.replace(/_/g, ' ');
			
			navHtml += `<li>${name}</li>`;
			navHtml += result.navHtml;
			
			cacheHtml += result.cacheHtml;
		} else {
			// file
			var name = file.split('.')[0].replace(/_/g, ' ');
			if (file.endsWith(".md")) {
				navHtml += `<li><a href='/${filePath}'>${name}</a></li>`;
				cacheHtml += `\"${filePath}\",`	;
			} else if (file.endsWith(".png")) {
				cacheHtml += `\"${filePath}\",`	;
			} else if (file.endsWith(".jpg")) {
				cacheHtml += `\"${filePath}\",`	;
			}		
		}
	})
	navHtml += '</ul>';
	return {navHtml: navHtml, cacheHtml: cacheHtml};
}

var result = traverseContent('content');
var navHtml = result.navHtml;
var cacheHtml = `[${result.cacheHtml}]`;



var tiles = {};
tiles['Lage'] = {'tileName':'Lage', 'tileDescr':'FU - Lage', tileHtml:'<section class="area"><a href="/content/Lage/"><h1>FU</h1><h2>Lage</h2></a></section>'};
tiles['Telematik'] = {'tileName':'Telematik', 'tileDescr':'FU - Telematik', tileHtml:'<section class="area"><a href="/content/Telematik/"><h1>FU</h1><h2>Telematik</h2></a></section>', listHtml:''};
tiles['Unterstützung'] = {'tileName':'Unterstützung', 'tileDescr':'Ustü - Allgemeines', tileHtml:'<section class="area" style="background-color:deepskyblue;"><a href="/content/Unterstützung/"><h1>Ustü</h1><h2>Allgemeines</h2></a></section>', listHtml:''};
tiles['NTP'] = {'tileName':'NTP', 'tileDescr':'Notfall Treffpunkt', tileHtml:'<section class="area" style="background-color:limegreen"><a href="/content/NTP/"><h1>NTP</h1><h2>Allgemeines</h2></a></section>', listHtml:''};


var cacheHtml2 = '"/","/content/Telematik/","/content/Lage/","/content/Unterstützung/","/content/NTP/","/styles.css",';

function traverseListContent(dir) {
    listHtml = '<section class="list"><ul>'
    fs.readdirSync(dir).forEach(file => {
        var filePath = dir  + '/' + file;
        var stats = fs.statSync(filePath);
        if (!stats.isDirectory()) {
            
			var name = file.split('.')[0].replace(/_/g, ' ');
			if (file.endsWith(".md")) {
				listHtml += `<li><a href='/${filePath}'>${name}</a></li>`;
			} 
            cacheHtml2 += `\"${filePath}\",`;
        }
    })
    listHtml += '</ul></section>';
    return listHtml;
}

//traverse content of all tiles
var tileHtml = '';
for(var key in tiles) {
  tiles[key].listHtml = traverseListContent(`content/${tiles[key].tileName}`);
  tileHtml += tiles[key].tileHtml
}
cacheHtml2 = `[${cacheHtml2}]`;


app.get('/', function (req, res) {  
	res.render('tile', {
		title: 'Fachbereiche',
		tileHtml: tileHtml
	});
});

let serviceWorkerJS = fs.readFileSync('pwabuilder-sw.js','utf8').replace('{{{cache}}}', cacheHtml2);

app.get('/pwabuilder-sw.js', function (req, res) {
	res.type('text/javascript');
	res.send(serviceWorkerJS);
	// res.sendFile(__dirname + '/pwabuilder-sw.js');
});

app.get('/content/*', function (req, res) {	
	var path = decodeURIComponent(req.path).substring(1); // path starts with / 
	if (path.endsWith(".md")) {
		var split = path.split('/');
		var title = split[split.length -1].split('.')[0].replace(/_/g, ' ');
        var tile = split[split.length -2];
		var content = fs.readFileSync(path,'utf8'); 
		contentHtml = converter.makeHtml(content);
		res.render('content', {
			title: title,
			contentHtml: contentHtml,
			tileName: tile,
            tileDescr: tiles[tile].tileDescr
		});
	} else if (path.endsWith("/")) {
        var split = path.split('/');
		var tileName = split[split.length -2];
        res.render('list', {
			title: tiles[tileName].tileDescr,
			listHtml: tiles[tileName].listHtml
		});
    } else {
		if (typeof req.query.origin === 'undefined' ) {
			res.sendFile(__dirname + '/' + path);
		} else {
			path_arr = path.split('/');
			origin = req.query.origin;
			res.render('image', {
				titel: path_arr[path_arr.length - 1],
				image: `/${path}`,
				origin: origin
			});
		}
		//res.sendFile(__dirname + '/' + path);
	}
	
});

app.use(function(err, req, res, next) {
	res.status(500);
	res.render('error', {
		title: 'Error'
	});
});

const httpServer = http.createServer(app);
httpServer.listen(8081, () => console.log('ZS App listening for http on port 8081'));


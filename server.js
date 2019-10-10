// Built-in Node.js modules
var fs = require('fs')
var path = require('path')

// NPM modules
var express = require('express')
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var template_dir = path.join(__dirname, 'templates');
var db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

var app = express();
var port = 8000;

// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));


// GET request handler for '/'
app.get('/', (req, res) => {
    ReadFile(path.join(template_dir, 'index.html')).then((template) => {
        let response = template;
		//response = response.toString();
		db.all("SELECT * FROM Consumption WHERE year = ? ORDER BY state_abbreviation", "2017", (err, rows) => {
			var i;
			var coal = 0;
			var nat = 0;
			var nuc = 0;
			var pet = 0;
			var ren = 0;
			var tableItem = ""
			for (i = 0; i < rows.length; i++)
			{
				coal = coal + rows[i].coal;
				nat = nat + rows[i].natural_gas;
				nuc = nuc + rows[i].nuclear;
				pet = pet + rows[i].petroleum;
				ren = ren + rows[i].renewable;
				tableItem = tableItem + " <tr>  <td>" + rows[i].state_abbreviation + "</td>\n <td>" + rows[i].coal + "</td>\n <td>" + rows[i].natural_gas + "</td>\n <td>" + rows[i].nuclear + "</td>\n <td>" + rows[i].petroleum + "</td>\n <td>"  + rows[i].renewable + "</td>\n </tr>";
			}
			response = response.replace("<!-- Data to be inserted here -->" , tableItem);
			response = response.replace("coal_count", "coal_count = " + coal);
			response = response.replace("natural_gas_count", "natural_gas_count = " + nat);
			response = response.replace("nuclear_count", "nuclear_count = " + nuc);
			response = response.replace("petroleum_count", "petroleum_count = " + pet);
			response = response.replace("renewable_count", "renewable_count = " + ren);
			 WriteHtml(res, response);
		});
        // modify `response` here
       
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    ReadFile(path.join(template_dir, 'year.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/energy-type/*'
app.get('/energy-type/:selected_energy_type', (req, res) => {
    ReadFile(path.join(template_dir, 'energy.html')).then((template) => {
        let response = template;
        // modify `response` here
        WriteHtml(res, response);
    }).catch((err) => {
        Write404Error(res);
    });
});

function ReadFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.toString());
            }
        });
    });
}

function Write404Error(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error: file not found');
    res.end();
}

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}


var server = app.listen(port);

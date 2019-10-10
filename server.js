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
		db.all("SELECT * FROM Consumption WHERE year = ? ORDER BY state_abbreviation", "2017", (err, rows) => {
			var i;
			var coal = 0;
			var nat = 0;
			var nuc = 0;
			var pet = 0;
			var ren = 0;
			var tableItem = "";
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
		var year = req.path.substring(6,req.path.length);
        db.all("SELECT * FROM Consumption WHERE year = ? ORDER BY state_abbreviation", year, (err, rows) => {
			var i;
			var coal = 0;
			var nat = 0;
			var nuc = 0;
			var pet = 0;
			var ren = 0;
			var stateTotal = 0;
			var tableItem = "";
			for (i = 0; i < rows.length; i++)
			{
				coal = coal + rows[i].coal;
				nat = nat + rows[i].natural_gas;
				nuc = nuc + rows[i].nuclear;
				pet = pet + rows[i].petroleum;
				ren = ren + rows[i].renewable;
				stateTotal = rows[i].coal + rows[i].natural_gas + rows[i].nuclear + rows[i].petroleum + rows[i].renewable;
				tableItem = tableItem + " <tr>  <td>" + rows[i].state_abbreviation + "</td>\n <td>" + rows[i].coal + "</td>\n <td>" + rows[i].natural_gas + "</td>\n <td>" + rows[i].nuclear + "</td>\n <td>" + rows[i].petroleum + "</td>\n <td>"  + rows[i].renewable + "</td>\n <td>" + stateTotal + "</td>\n </tr>";
			}
			response = response.replace("National Snapshot", "National Snapshot " + year);//populate header
			response = response.replace("US Energy Consumption", year + " US Energy Consumption");//populate title
			response = response.replace("var year", "var year = " + year);//populate year
			response = response.replace("<!-- Data to be inserted here -->" , tableItem);//populate table
			response = response.replace("coal_count", "coal_count = " + coal);
			response = response.replace("natural_gas_count", "natural_gas_count = " + nat);
			response = response.replace("nuclear_count", "nuclear_count = " + nuc);
			response = response.replace("petroleum_count", "petroleum_count = " + pet);
			response = response.replace("renewable_count", "renewable_count = " + ren);
			 WriteHtml(res, response);
		});
    }).catch((err) => {
        Write404Error(res);
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    ReadFile(path.join(template_dir, 'state.html')).then((template) => {
        let response = template;
		var state = req.path.substring(7,req.path.length).toString();
         db.all("SELECT c.*, s.state_name FROM Consumption c INNER JOIN States s ON c.state_abbreviation = s.state_abbreviation WHERE s.state_abbreviation = ? ORDER BY year", state, (err, rows) => {
			var i;
			var coal = new Array();
			var nat = new Array();
			var nuc = new Array();
			var pet = new Array();
			var ren = new Array();
			var yearTotal = 0;
			var tableItem = "";
			var stateName = "";
			for (i = 0; i < rows.length; i++)
			{
				coal[i] = rows[i].coal;
				nat[i] = rows[i].natural_gas;
				nuc[i] = rows[i].nuclear;
				pet[i] = rows[i].petroleum;
				ren[i] = rows[i].renewable;
				stateName = rows[i].state_name;
				yearTotal = rows[i].coal + rows[i].natural_gas + rows[i].nuclear + rows[i].petroleum + rows[i].renewable;
				tableItem = tableItem + " <tr>  <td>" + rows[i].year + "</td>\n <td>" + rows[i].coal + "</td>\n <td>" + rows[i].natural_gas + "</td>\n <td>" + rows[i].nuclear + "</td>\n <td>" + rows[i].petroleum + "</td>\n <td>"  + rows[i].renewable + "</td>\n <td>" + yearTotal + "</td>\n </tr>";
			}
			response = response.replace("Yearly Snapshot", stateName + " Yearly Snapshot");//populate header
			//response = response.replace("US Energy Consumption", state + " US Energy Consumption");//populate title
			response = response.replace("var state", "var state = '" + state + "'");//populate state
			response = response.replace("<!-- Data to be inserted here -->" , tableItem);//populate table
			response = response.replace("coal_counts", "coal_counts = [" + coal + ']');
			response = response.replace("natural_gas_counts", "natural_gas_counts = [" + nat + ']');
			response = response.replace("nuclear_counts", "nuclear_counts = [" + nuc + ']');
			response = response.replace("petroleum_counts", "petroleum_counts = [" + pet + ']');
			response = response.replace("renewable_counts", "renewable_counts = [" + ren + ']');
			WriteHtml(res, response);
		});
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

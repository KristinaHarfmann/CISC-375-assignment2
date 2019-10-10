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
        var allStatesAbbreviations = ["AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY"]
        var allStateNames = ["Alaska", "Alabama", "Arkansas", "Arizona", "California", "Colorado", "Connecticut", "District of Columbia", "Delaware", "Florida", "Georgia", "Hawaii", "Iowa", "Idaho", "Illinois", "Indiana", "Kansas", "Kentucky", "Louisiana", "Massachusettes", "Maryland", "Maine", "Michigan", "Minnesota", "Missouri", "Mississippi", "Montana", "North Carolina", "North Dakota", "Nebraska", "New Hampshire", "New Jersey", "New Mexico", "Nevada", "New York", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Virginia", "Vermont", "Washington", "Wisconsin", "West Virginia", "Wyoming"];
        var stateIndex = 0;
        var nextState = "";
        var prevState = "";
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
            stateIndex = allStateNames.indexOf(stateName);
            if (stateIndex == 0){
                nextState = allStatesAbbreviations[stateIndex + 1];
                prevState = allStatesAbbreviations[50];
            }
            else if (stateIndex == 50){
                nextState = allStatesAbbreviations[0];
                prevState = allStatesAbbreviations[stateIndex - 1];
            }
            else {
                nextState = allStatesAbbreviations[stateIndex + 1];
                prevState = allStatesAbbreviations[stateIndex - 1];
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
            response = response.replace("noimage.jpg", stateName + ".jpg");
            response = response.replace("No Image", "Image of "+ stateName)
            response = response.replace("prevhref=\"\"", "href=\"/state/"+prevState+"\"");
            response = response.replace("nexthref=\"\"", "href=\"/state/"+nextState+"\"");
            response = response.replace("prevXX", prevState);
            response = response.replace("nextXX", nextState);
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
		var energyType = req.path.substring(13,req.path.length).toString();
		var flag1 = 0;
		var flag2 = 0;
         db.all("SELECT * FROM Consumption c ORDER BY c.state_abbreviation, year", (err, rows) => {
			var i;
			var energy_counts;
			for (i = 0; i < rows.length; i++)
			{
				if(i == 0)
				{//first one
					energy_counts = "{" + rows[i].state_abbreviation + ": [" + rows[i][energyType];
				}
				else if(i + 1 == rows.length)
				{//last one
					energy_counts = energy_counts + ", " + rows[i][energyType] + "] }"
				}
				else if(rows[i].state_abbreviation == rows[i - 1].state_abbreviation && rows[i].state_abbreviation == rows[i + 1].state_abbreviation)
				{//same state before and after
					energy_counts = energy_counts + ", " + rows[i][energyType];
				}
				else if(rows[i].state_abbreviation != rows[i - 1].state_abbreviation && rows[i].state_abbreviation == rows[i + 1].state_abbreviation)
				{//first of state
					energy_counts = energy_counts + rows[i].state_abbreviation + ": [" + rows[i][energyType];
				}
				else
				{//end of state
					energy_counts = energy_counts + ", " + rows[i][energyType] + "], "; 
				}
				
			}
			response = response.replace("Consumption Snapshot", energyTypes + " Consumption Snapshot");//populate header
			//response = response.replace("US Energy Consumption", state + " US Energy Consumption");//populate title
			response = response.replace("var energy_type", "var energy_type = '" + energyType + "'");//populate state
			response = response.replace("energy_counts", "energy_counts = " + energy_counts);
			flag1 = 1;
		});	//all
		
		db.all("SELECT * FROM Consumption c ORDER BY year, c.state_abbreviation", (err, row) => {
				var i = 0;
				var tableItem = "";
				var totalYear = 0;
				for (i = 0; i < row.length; i++)
				{
					if(i == 0)
					{//first one
						tableItem = tableItem + " <tr> <td>" + row[i].year + "</td> <td>" + row[i][energyType] + "</td>";
						totalYear = totalYear + row[i][energyType];
					}
					else if(i + 1 == row.length)
					{//last one
						totalYear = totalYear + row[i][energyType];
						tableItem = tableItem + "<td>" + row[i][energyType] + "</td> <td>" + totalYear + "</td> </tr>\n";
						totalYear = 0;
					}
					else if(row[i].year == row[i - 1].year && row[i].year == row[i + 1].year )
					{//same year before and after
						totalYear = totalYear + row[i][energyType];
						tableItem = tableItem + "<td>" + row[i][energyType] + "</td>";
					}
					else if(row[i].year != row[i - 1].year && row[i].year == row[i + 1].year)
					{//first of year
						totalYear = totalYear + row[i][energyType];
						tableItem = tableItem + "<tr> <td>" + row[i].year + "</td> <td>" + row[i][energyType] + "</td>";
					}
					else 
					{//end of year
						totalYear = totalYear + row[i][energyType];
						tableItem = tableItem + "<td>" + row[i][energyType] + "</td> <td>" + totalYear + "</td> </tr>\n"; 
						totalYear = 0;
					}
				}
				response = response.replace("<!-- Data to be inserted here -->" , tableItem);//populate table
				flag2 = 1;
				WriteHtml(res, response);
		});//all
		//if(flag1 == 1 && flag2 ==1)
		//{
			
		//}
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

const fs = require('fs');
const { createInterface } = require('readline');
const { performance } = require('perf_hooks');
const https = require('https');

// Arguments passed via cli
const args = process.argv.slice(2);

// Column number (starts in 0)
const DATE = 0;
const COUNTRY = 4;
const CITY = 5;
const LAT = 6;
const LON = 7;

// Show complete output in terminal (It slows down the processing)
const VERBOSE = false;

// Stop processing on...
const LIMIT_LINES = args[1] || null; // null to process the entire file


(async function processLineByLine() {

    try {

        let counterLinesReaded = 0;
        let counterCountry = 0;
        let counterIncomplete = 0;
        const file = args[0];

        console.log('Start!');

        const outputFile = fs.createWriteStream('processed_' + file);

        // timestamp on start
        const t0 = performance.now();

        // Read line by line
        const rl = createInterface({
            input: fs.createReadStream(file, { 'encoding': 'utf8' }),
            output: (VERBOSE) ? process.stdout : false,
            crlfDelay: Infinity
        });


        for await (const line of rl) {

            if (LIMIT_LINES && counterLinesReaded == LIMIT_LINES) {
                console.log('Stopped');
                rl.close()
                break;
            }

            let columns = line.split('\t'); // Only for tabs

            let _country = columns[COUNTRY];

            if (_country == 'Argentina') {

                counterCountry++;

                let _lat = columns[LAT];
                let _lon = columns[LON];
                let _city = columns[CITY];
                let _date = columns[DATE];

                // If exists lat and lon, but not the city
                if (_lat && _lon && _lat !== 'N/A' && _lon !== 'N/A' && _city === 'N/A') {

                    counterIncomplete++;
                    let city = await getGeoData(`/reverse?lat=${_lat}&lon=${_lon}&format=json`);
                    columns[CITY] = city;
                    
                    // Extra column
                    columns.push('-completed-');

                    console.log('Filled:', city, [_lat, _lon]);

                } else {

                    // Extra empty column
                    columns.push('');

                    //console.log('TOTAL:', counterLinesReaded, 'ARG:', counterCountry, _date, _city, [_lat, _lon]);

                }

                // Only country matched
                outputFile.write(columns.join('\t') + '\r');

            }

            counterLinesReaded++;

            if ((counterLinesReaded % 100000) == 0)
                console.log(`__${counterLinesReaded} lines__`);

        };

        // timestamp on end
        const t1 = performance.now();

        console.log('Finished!');
        console.log(`Readed ${counterLinesReaded} lines in ${((t1 - t0) / 1000).toFixed(2)} seconds`);
        console.log(`Argentina: ${counterCountry}. Incomplete: ${counterIncomplete}`);

    } catch (err) {
        console.error(err);
    }

})()



// Store parameters to avoid multiples requests
let storedValues = {};

const getGeoData = (path) => {

    // If the value was already searched, get that
    if (storedValues[path]) {
        return storedValues[path];
    }

    return new Promise((resolve, reject) => {

        let options = {
            hostname: 'nominatim.openstreetmap.org',
            path: path,
            port: 443,
            headers: { 'User-Agent': 'Mozilla/5.0' } // Required for Nominatim
        }

        https.get(options, (res) => {

            res.setEncoding('utf8');
            res.on('data', (d) => {

                let json = JSON.parse(d);

                let city = json.address.city || json.address.town || json.address.county || json.address.village || json.address.state_district;

                // Store the value
                storedValues[path] = city;
                resolve(city);
            });

        }).on('error', (err) => {
            console.error(err);
            reject(false);
        });

    }).catch(err => {
        console.error(err)
        return false;
    })

}
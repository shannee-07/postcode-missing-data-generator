const fs = require('fs');
const csv = require('csv-parser');

let csvData = [];
let csvPostCodeSet = new Set();
let jsonPostCodeSet = new Set();
let missingInJson = [];
let missingInCsv = [];
let csvFile = "country,latitude,longitude,postcode,countryCodeAlpha2,countryCodeAlpha3";

function findDuplicate(list) {
    const map = new Map();

    list.forEach(item => {
        if (map.has(item)) {
            map.set(item, map.get(item) + 1);
        } else {
            map.set(item, 1);
        }
    });

    for (const [item, count] of map.entries()) {
        if (count > 1) {
            console.log(`postcode "${item}" appears ${count} times`);
        }
    }
}

function writeIntoFile(fileName, data) {
    fs.writeFile(fileName, data, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('File has been written successfully.');
    });
}

let formattedJson = "[";

fs.readFile('us.json', 'utf8', (err, json) => {
    if (err) {
        console.error(err);
        return;
    }
    try {
        const jsonData = JSON.parse(json);
        let postcodesInJson = jsonData.map(location => location.postcode);
        // console.log(typeof postcodesInJson[0]);
        new Set();
        fs.createReadStream('source.csv')
            .pipe(csv())
            .on('data', (row) => {
                csvData.push(row);
                csvPostCodeSet.add(Number(row["destination-zip-code"]));
                // csvDataSet.add(row);

                if (!postcodesInJson.includes(Number(row["destination-zip-code"]))) {
                    // console.log(row["destination-zip-code"]);
                    missingInJson.push(row["destination-zip-code"]);
                    csvFile += `\nUSA,${row["latitude"]},${row["longitude"]},${row["destination-zip-code"]},US,USA`
                }
            })
            .on('end', () => {
                let postcodesInCsv = csvData.map(location => Number(location["destination-zip-code"]));
                for (let i = 0; i < postcodesInJson.length; i++) {
                    jsonPostCodeSet.add(postcodesInJson[i]);
                    if (!postcodesInCsv.includes(postcodesInJson[i])) {
                        missingInCsv.push(postcodesInJson[i]);
                    }
                }

                console.log("PostCodes that are in csv but not in json:", missingInJson.length);
                console.log("PostCodes that are in json but not in csv:", missingInCsv.length);
                console.log();
                console.log("csv data:", csvData.length);
                console.log("Csv post code unique set", csvPostCodeSet.size);
                console.log();
                console.log("jsonData:", jsonData.length);
                console.log("Json post code unique set", jsonPostCodeSet.size);
                console.log("\nDuplicates in postcodes in CSV:");
                findDuplicate(postcodesInCsv);


                // Writing into file:

                let missingInCsvFile = "";
                let missingInJsonFile = "";
                for (let i = 0; i < missingInJson.length; i++) {
                    missingInJsonFile += `${missingInJson[i]}\n`
                }
                for (let i = 0; i < missingInCsv.length; i++) {
                    missingInCsvFile += `${missingInCsv[i]}\n`
                }

                formattedJson= formattedJson.substring(0, formattedJson.length - 1)+"]";
                writeIntoFile("formatted.csv",csvFile);


            });
    } catch (e) {
        console.error('Error parsing JSON:', e);
    }
});
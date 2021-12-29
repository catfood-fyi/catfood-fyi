const fs = require('fs');

const writeFile = (brand, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(`./scrapers/${brand}/output.json`, JSON.stringify(data, null, 2), (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

module.exports = writeFile;

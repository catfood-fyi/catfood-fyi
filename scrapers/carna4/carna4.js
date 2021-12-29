const axios = require('axios');
const cheerio = require('cheerio');
const writeFile = require('../utils');

const URL = 'https://carna4.com/our-products/cat-food/';

const parseNutrientText = (value) => {
  // replace all whitespace with a single space
  return value
    .replaceAll(/[ \u00A0\s]+/g, ' ')
    .replaceAll(/\u2013/g, '-')
    .trim().toLowerCase()
  ;
};

const main = async (url = URL) => {
  const products = [];

  try {
    const result = await axios.get(url);
    const $ = cheerio.load(result.data);
    
    const bits = $('div.et_pb_text_inner > *');
    bits.each((_, el) => {
      // break out when you get to the h2 that says "Recommended Daily Feeding Guide"
      if ($(el).text().includes('Recommended Daily Feeding Guide')) return false;

      const firstChild = $(el).children().first();
      if (firstChild && firstChild.text().toLowerCase().endsWith('ingredients')) {
        const name = firstChild.text().toLowerCase().split(' ').slice(0, -1).join(' ');
        const ingredients = $(el)
          .children().remove().end().text()
          .slice(1, -1).trim().toLowerCase()
          .split(',').map(i => i.trim())
        ;

        const product = {
          name,
          ingredients,
          'guaranteed_analysis': {}
        };
        products.push(product);
      }

      // if the element is a table...
      let currentTable = 'guaranteed_analysis';
      let currentNutrient = '';
      if ($(el).is('table')) {
        // get the body of the table
        const body = $(el).find('tbody');

        body.find('tr').each((_, tr) => {
          // if the first td has a strong tag as a child, set the currentTable to that text
          const firstTd = $(tr).find('td').first();
          if (firstTd.find('strong').length) {
            currentTable = parseNutrientText($(firstTd).children().first().text());
            products.forEach(p => p[currentTable] = {});
          } else {
            $(tr).find('td').each((i, td) => {
              // if non-empty td
              if ($(td).text().trim()) {
                if (i === 0) {
                  currentNutrient = parseNutrientText($(td).text());
                } else {
                  const biotics = currentTable.includes('biotics') || currentTable.includes('enzymes');
                  if (biotics && (i === 2 || i === 3)) {
                    products[(i - 1) % 2][currentTable][currentNutrient] = parseNutrientText($(td).text());
                  } else if (i === 1 || i === 2) {
                    products[i % 2][currentTable][currentNutrient] = parseNutrientText($(td).text());
                  }
                }
              }
            });
          }
        });
      }
    });
    
  } catch (error) {
    console.error(error);
  }

  return products;
};

main().then(data => writeFile('carna4', data));

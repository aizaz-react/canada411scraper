const rp = require('request-promise');
// const potusParse = require('./potusParse');
const { canadianStates, names } = require('./data');
const cheerio = require('cheerio');
const { Client } = require('pg');
const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'aizaz',
  host: 'localhost',
  database: 'canadaData',
  password: '1234',
  port: 8383
});

const arraypusher = (array, $) => {
  let newArray = [];
  array.each(function (idx, el) {
    newArray.push($(el).text());
  });
  return newArray;
};

const scrap = async () => {
  for (const name of names) {
    const url = `https://www.canada411.ca/search/si/1/${name}/Canada/?pgLen=100`;
    try {
      const html = await rp(url);
      console.log('start with ' + name);
      const $ = cheerio.load(html);
      const fetchRecords = $('.resultPerPageDown li span');
      const records = fetchRecords.text().split(' ');
      if (records.length > 1) {
        const totalRecords = parseInt(
          records[records.length - 2].replace(',', '')
        );
        const pages = Math.ceil(totalRecords / 100);
        console.log('total records for ' + pages);
        for (let i = 1; i < pages; i++) {
          const newUrl = `https://www.canada411.ca/search/si/${i}/${name}/Canada/?pgLen=100`;
          console.log('scrap for' + newUrl);
          const newHtml = await rp(newUrl);
          const $ = cheerio.load(newHtml);
          const numbers = $('.c411Phone');
          const names = $('.c411Listing .listing__row .c411ListedName a');
          const address = $('.c411Listing .listing__row span span');
          const array = arraypusher(numbers, $);
          const arrayNames = arraypusher(names, $);
          const arrayAddress = arraypusher(address, $);

          console.log(`${arrayNames[i]}, ${arrayAddress[i]}, ${array[i]})`);

          for (let i = 0; i < arrayAddress.length; i++) {
            console.log('db process');
            pool.query(
              `INSERT INTO public.peoples(
                name, address, "phoneNumber")
                VALUES ('${arrayNames[i]}', '${arrayAddress[i]}', '${array[i]}');`,
              (error, results) => {
                if (error) {
                  console.log(error);
                  return;
                }
                console.log('added to db');
              }
            );
            console.log('next');
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};

scrap();

const rp = require('request-promise');
const $ = require('cheerio');

const potusParse = async (url) => {
  return rp(url)
    .then(function (html) {
      return {
        name: $('.firstHeading', html).text(),
        birthday: $('.bday', html).text()
      };
    })
    .catch(function (err) {
      //handle error
    });
};

module.exports = potusParse;

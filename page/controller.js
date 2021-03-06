var _ = require('lodash');
var debug = require('debug')('krgotrex:controller');
var pug = require('pug');
var nconf = require('nconf').env();
var moment = require('moment');
var Promise = require('bluebird');

var mongo = require('../../../lib/mongo');
var various = require('../../../lib/various');
var getGooglesOnly = require('../../../routes/getGooglesOnly');

function rootpage(req) {

    debug("welcome to the rootpage");

    return getGooglesOnly(_.set({}, 'params.campaign', 'kzbrg'))
        .then(function(j) {

            /* this is the format required in the .pug: 
            results: [{
                'href':
                'description':
                'googles': [{
                    'productName': 'Google Analytics',
                    'amount': 3
                }]
                'nothing':
            }]
            we are getting a collection you can see from
            https://invi.sible.link/api/v1/google/kzbrg
             ** ** ** ** ** ** ** ** ** ** ** ** ** ** */

            debugger;
            var products = _.compact(_.uniq(_.map(j.json, 'product')));
            var tested = _.uniq(_.map(j.json, 'href'));
            var ret = _.reduce(j.json, function(memo, entry) {
                _.set(memo, entry.description, entry.href);
                return memo;
            }, {});

            ret = _.map(ret, function(href, description) {
                return {
                    href: href,
                    description: description,
                    googles: [],
                    nothing: false
                };
            });

            debug("%d tested site, %d unique Google services", _.size(tested), _.size(products));
            _.each(tested, function(s) {
                var isClean = true;
                _.each(products, function(p) {
                    var evidences = _.filter(j.json, { product: p, href: s });

                    if(_.size(evidences)) {
                        _.find(ret, { href: s }).googles.push({
                            productName: p,
                            amount: _.size(evidences)
                        });
                        isClean = false;
                    }
                });

                if(isClean)
                    _.find(ret, {href: s}).nothing = true;

            }); 

            return { 'text': 
                pug.compileFile(
                    __dirname + '/content.pug', {
                        pretty: true,
                        debug: false
                    }
                )({ results: _.shuffle(ret) })
            };
        });

};

module.exports = rootpage;

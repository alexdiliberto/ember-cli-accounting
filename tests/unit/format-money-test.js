import { test, module } from 'qunit';
import formatMoney from "accounting/format-money";
import {currency} from "accounting/settings";

module("formatMoney");

test("formatMoney()", function(assert) {
  assert.equal(formatMoney(12345678), "$12,345,678.00", "Default usage with default parameters is ok");
  assert.equal(formatMoney(4999.99, "$ ", 2, ".", ","), "$ 4.999,99", 'custom formatting via straight params works ok');
  assert.equal(formatMoney(-500000, "£ ", 0), "£ -500,000", 'negative values, custom params, works ok');
  assert.equal(formatMoney(5318008, { symbol: "GBP",  format: "%v %s" }), "5,318,008.00 GBP", "`format` parameter is observed in string output");
  assert.equal(formatMoney(1000, { format: "test %v 123 %s test" }), "test 1,000.00 123 $ test", "`format` parameter is observed in string output, despite being rather strange");

  // Format param is an object:
  var format = {
    pos: "%s %v",
    neg: "%s (%v)",
    zero:"%s  --"
  };
  assert.equal(formatMoney(0, { symbol: "GBP",  format:format}), "GBP  --", "`format` parameter provided given as an object with `zero` format, correctly observed in string output");
  assert.equal(formatMoney(-1000, { symbol: "GBP",  format:format}), "GBP (1,000.00)", "`format` parameter provided given as an object with `neg` format, correctly observed in string output");
  assert.equal(formatMoney(1000, { symbol: "GBP",  format:{neg:"--%v %s"}}), "GBP1,000.00", "`format` parameter provided, but only `neg` value provided - positive value should be formatted by default format (%s%v)");

  currency.format = "%s%v";
  formatMoney(0, {format:""});
  assert.equal(typeof currency.format, "object", "`currency.format` default string value should be reformatted to an object, the first time it is used");
});

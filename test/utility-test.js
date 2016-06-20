var expect = require('chai').expect;
var util = require('../utility.js');

describe('utility', function() {
  describe('#zeroPadding()', function() {
    it('第二引数に指定した文字数となるように左側から0埋めする。', function() {
      expect(util.zeroPadding('5', 2)).to.equal('05');
      expect(util.zeroPadding('5', 3)).to.equal('005');
    });

    it('第二引数に指定した文字数と入力された文字数が同じであれば、変更しない。', function() {
      expect(util.zeroPadding('5', 1)).to.equal('5');
      expect(util.zeroPadding('0', 1)).to.equal('0');
      expect(util.zeroPadding('05', 2)).to.equal('05');
    });
  });
  
  describe('#getYesterday()', function() {
    it('昨日の時刻情報を取得する。', function() {
      var now = new Date();
      expect(util.getYesterday().getDate()).to.equal(now.getDate() - 1);
    });
  });
});
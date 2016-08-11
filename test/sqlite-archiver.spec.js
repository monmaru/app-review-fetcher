import fs from 'fs';
import { expect } from 'chai';
import sqlite3 from 'sqlite3';
import PlatformType from '../src/platform';
import Review from '../src/review';
import AppReviewInfo from '../src/app-review-info';
import SqliteArchiver from '../src/sqlite-archiver';
import DummyLogger from './dummy-logger';

describe('SqliteArchiver', () => {

  const testDbPath = `${__dirname}/test.sqlite`;
  let sqliteArchiver;
  const db = new sqlite3.Database(testDbPath);

  before(() => {
    sqliteArchiver = new SqliteArchiver(testDbPath, new DummyLogger);
  });

  after(() => {
    sqliteArchiver.close();
    db.close();
    fs.unlinkSync(testDbPath);
  });

  describe('#initTableIfNotExists()', () => {
    it('should create the table', () => {
      sqliteArchiver.initTableIfNotExists('test');
    });
  });

  describe('#archiveAsync()', () => {

    const tests = [
      {platformType: PlatformType.APPSTORE, tableName: 'appstore'},
      {platformType: PlatformType.GOOGLEPLAY, tableName: 'googleplay'}
    ];

    tests.forEach((test) => {
      it(`should inserted the review ${test.tableName}`, async function(done) {
        this.timeout(5000);
        // Arrange
        const app1 = 'hoge';
        const app2 = 'moge';
        const id1 = test.tableName + 'id1';
        const id2 = test.tableName + 'id2';
        const updated = '2016/01/01';
        const title = 'title';
        const content = 'content';
        const rating = 5;
        const version = 1.0;
        const author = 'author';
        const review1 = new Review(id1, updated, title, content, rating, version, author);
        const review2 = new Review(id2, updated, title, content, rating, version, author);
        const appReviewInfoList = [new AppReviewInfo(app1, [review1]), new AppReviewInfo(app2, [review2])];
        // Act
        await sqliteArchiver.archiveAsync(appReviewInfoList, test.platformType);
        const idList1 = await sqliteArchiver.selectIdListAsync(app1, test.tableName);
        const idList2 = await sqliteArchiver.selectIdListAsync(app2, test.tableName);
        // Assert
        expect(idList1[0].id).to.equal(id1);
        expect(idList2[0].id).to.equal(id2);

        done();
      });
    });
  });
});
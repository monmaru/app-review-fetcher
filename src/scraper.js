import client from 'cheerio-httpcli';
import util from './utility';
import Review from './review';

export default class Scraper {

  constructor() {
    this.logger = util.getLogger();
  }

  fetchReviewFromAppStore(id) {
    return new Promise((resolve, reject) => {
      const RSS = `https://itunes.apple.com/jp/rss/customerreviews/id=${id}/xml`;
      const reviews = [];
      let isFinished = false;

      const fetchRecursive = (url) => {
        return client.fetch(url).then((result) => {
          const $ = result.$;
          const firstPage = $('link[rel=first]').attr('href');
          const nextPage = $('link[rel=next]').attr('href');
          const lastPage = $('link[rel=last]').attr('href');
          
          $('feed > entry').each((i, element) => {
            const entry = $(element);
            const date = entry.find('updated').text().replace(/(.*?)-(.*?)-(.*?)T(.*?)-.*/, '$1/$2/$3 $4');
            const title = entry.find('title').text();
            const content = entry.find('content[type=text]').text();
            const rating = entry.find('im\\:rating').text(); // :はエスケープしないとエラーになるので注意。
            const version = entry.find('im\\:version').text();
            const author = entry.find('author > name').text();

            if (i == 0) { 
              // 最初のentryタグは関係ないのでスキップする。
              return; 
            }
            reviews.push(new Review(date, title, content, rating, version, author));
          });

          if (isFinished || !nextPage || (firstPage == lastPage)) {
            return reviews;
          }
          
          // 次のページが最終ページであればフラグを立てておき、クロールを止めるようにする。
          isFinished = nextPage == lastPage;
          // linkタグをクロールすることで過去のレビューを再帰的に取得する。
          return fetchRecursive(nextPage);
        }).catch((error) => {
          this.logger.error(error);
          reject(error);
        });
      };

      fetchRecursive(RSS).then((result) => {
        resolve(result);
      });
    });
  }

  fetchReviewFromGooglePlay(id) {
    return new Promise((resolve, reject) => {
      const URL = `https://play.google.com/store/apps/details?id=${id}`;
      const reviews = [];

      return client.fetch(URL).then((result) => {
        const $ = result.$;

        $('div.review-link').remove();
        $('.single-review').each((i, element) => {
          const reviewInfo = $(element).find('.review-info'); 
          const tmpDate = $(reviewInfo).find('.review-date').text().match(/(.*)年(.*)月(.*)日/);
          const updated = tmpDate[1] + '/' + util.zeroPadding(tmpDate[2]) + '/' + util.zeroPadding(tmpDate[3]);
          const rating = $(reviewInfo).find('.review-info-star-rating .tiny-star').attr('aria-label').match(/5つ星のうち(.*)つ星で評価しました/)[1];
          const reviewBody = $(element).find('.review-body.with-review-wrapper');
          const title = $(reviewBody).find('.review-title').text();
          const content = $(reviewBody).text().replace(title, '').trim();
          const author = $(element).find('.author-name > a').text();
          
          reviews.push(new Review(updated, title, content, rating, '-', author));
        });
        
        resolve(reviews);
      }).catch((error) => {
        this.logger.error(error);
        reject(error);
      });
    });
  }
  
}
import 'babel-polyfill';// for async/await
import nodemailer from 'nodemailer';
import config from '../config';
import util from './utility';
import Scraper from './scraper';

const logger = util.getLogger();

async function sendMailAsync(subject, mailBody) {
  const transporter = nodemailer.createTransport('SMTP', {
    host: config.host,
    port: config.port
  });
  
  const mailOptions = {
    from: config.mail.fromAddress,
    to: config.mail.toAddress,
    subject: subject,
    text: mailBody
  };

  logger.info(`Start sending mail ${subject}`);
  await transporter.sendMail(mailOptions);
  logger.info(`Finished sending mail ${subject}`);
}

async function reportAsync(appInfoList, asyncFunc, mailSubject) {
  try {
    let mailBody = '';
    let hasNewReviews = false;
    const LF = '\n';
    const yesterday = util.getYesterday();
  
    for (const appInfo of appInfoList) {
      const reviews = await asyncFunc(appInfo.id);
      // 昨日以降のレビューを新着レビューとして判定する。
      const reviewsOfToday = reviews.filter((review) => {
        return new Date(review.date) > yesterday; 
      });

      if (reviewsOfToday.length > 0) {
        mailBody += `${LF}■${appInfo.name}${LF}`;
        reviewsOfToday.forEach((review) => {
          hasNewReviews = true;
          mailBody += `date: ${review.date}${LF}title: ${review.title}${LF}`
                   + `content: ${review.content}${LF}`
                   + `version: ${review.version}${LF}`
                   + `author: '${review.author}${LF}`
                   + `------------------------------${LF}`;
        });
      }
    }

    if (hasNewReviews) {
      await sendMailAsync(mailSubject, mailBody);
    } else {
      logger.info(`${mailSubject} is nothing`);
    }

  } catch (error) {
    logger.error(error);
  }
}

async function main() {
  const scraper = new Scraper();
  await Promise.all([
    reportAsync(config.appStore, scraper.fetchReviewFromAppStore, 'AppStore新着レビュー'),
    reportAsync(config.googlePlay, scraper.fetchReviewFromGooglePlay, 'GooglePlay新着レビュー')
  ]);
}

main();
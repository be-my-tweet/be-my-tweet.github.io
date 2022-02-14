const max = 280;
const zwsp = '\xa0';
const link = /(?<=[A-Za-z])\.(?=[A-Za-z]{2,})/g;
const mention = /(?<![A-Za-z0-9_\%\#\$\&\*\!])\@(?=[A-Za-z0-9_]+(?![@A-Za-z0-9_]))/g;

const parsing = {
    links: tweet => tweet.replace(link, '.' + zwsp),
    mentions: tweet => tweet.replace(mention, '@' + zwsp)
}

const safe = input => Object.values(parsing).reduce((acc, cur) => cur(acc), input);
export { max, safe };

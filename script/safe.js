const max = 280;
const link = /[A-Za-z]\.(?=[A-Za-z]{2,})/g;
const mention = /[^A-Za-z0-9_\%\#\$\&\*\!]\@(?=[A-Za-z0-9_]+(?![@A-Za-z0-9_]))/g;

const parsing = {
    pad: tweet => ' ' + tweet + ' ',
    links: tweet => tweet.replace(link, ' . '),
    mentions: tweet => tweet.replace(mention, ' @ '),
    trim: tweet => tweet.slice(1, -1)
}

const safe = input => Object.values(parsing).reduce((acc, cur) => cur(acc), input);
export { max, safe };

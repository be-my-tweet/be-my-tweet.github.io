const locale = navigator.languages?.[0] || navigator.language;
const hour12 = Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12;

const now = () => new Date().toJSON();

const datetime = s => {
    let times = ['s', 'm', 'h', 'd', ''];
    let [now, then, passed] = [new Date(), new Date(s), 0];
    let diff = Math.round((now.getTime() - then.getTime()) / 1000);
    [[60, 1], 60, 24].reduce((a, c) => [a[0] * c, ...a]).some(n => (
        passed = (times.pop(), [Math.floor(diff / n), diff %= n][0])
    ))
    const f = (options, digits) => {
        let s = new Intl.DateTimeFormat('en-US', options).format(then);
        if (digits !== undefined) s = s.padStart(digits, '0');
        return s.slice(0, digits);
    }

    if (!passed) (passed = 'Now', times.push(''));
    let current = now.getFullYear() === then.getFullYear();
    let [hour, minute] = [f({ hour: 'numeric', hour12 }, 2).trim(), f({ minute: '2-digit' }, 2)];
    let [day, month, year] = [f({ day: '2-digit' }, 2), f({ month: 'short' }), f({ year: '2-digit' }, 2)];
    let dates = [`${day}/${f({ month: '2-digit' }, 2)}/${f({ year: 'numeric' })}`, `${day} ${month} ${year}`];
    let date = document.documentElement.classList.contains('ios') ? dates[0] : dates[1];
    if (times.length < 4 || passed < 7) passed += times[times.length - 1];
    else passed = `${day} ${month}${current ? '' : ' ' + year}`;
    let ap = f({ hour: '2-digit', hour12 }).slice(2);
    let time = `${hour}:${minute}${ap}`;
    return [date, time, passed];
}

const number = n => {
    if (Math.abs(n) < 1) return '';
    if (n < 0) return '-' + number(-n);
    let mults = ['', 'K', 'M', 'B', 'T', 'Q', 'q'];
    const div = (i = 1, l = 0, u = l, s = '', e = '') => {
        let end = `${n % i}`.padStart(Math.ceil(Math.log10(i)), '0');
        end = end.slice(0, l) + end.slice(l, u).replace(/0*$/, '');
        return `${Math.floor(n / i)}${end && s}${end}${e}`;
    }
    const k = 1000;
    if (n < k) return div();
    if (n < 10 * k) return div(k, 3, 3, ',');
    for (let i = 1, m = k; i < mults.length; ++i, m = k ** i) {
        if (n < 100 * m) return div(m, 0, 1, '.', mults[i]);
        if (n < k * m) return div(m, 0, 0, '', mults[i]);
    }
    let o = 2;
    let r = Math.floor(Math.log10(n));
    n = Math.floor(n / (10 ** (r - o))) / (10 ** o);
    return `${n}e+${r}`;
}

const tag = (r, u) => {
    r = Array.isArray(r) ? [...r] : (r && [r]) || [];
    if (r.length > 1) r[Math.min(r.length, 3) - 2] += ' and';
    if (r.length > 3) r = [r[0], r[1] + ` ${r.length - 2} others`];
    return r.reduce((a, c) => `${a}${a && ' '}@${c || u.user}`, '');
}

const systems = [
    'android',
    'ios'
]

const system = () => {
    let agent = navigator.userAgent.toLowerCase();
    if (agent.includes('android')) return 'android';
    return 'ios';
}

export { now, datetime, number, tag, system, systems };

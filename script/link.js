import { system, systems } from './util.js'

const settings = {
    systems: systems,

    themes: [
        'dark',
        'dim',
        'light'
    ],

    accents: [
        'blue',
        'yellow',
        'pink',
        'purple',
        'orange',
        'green'
    ]
}

const params = {
    ...settings,

    query: () => args(/[^a-z\/]/g),
    id: () => args(/[^0-9\/]/g)[0] || '',

    set: (s, q) => {
        let i = s.indexOf(q);
        if (i <= 0) return;
        html.remove(s[0]);
        html.add(s[i]);
        s.push(...s.splice(0, i));
    },

    cycle: s => {
        params.set(s, s[1]);
        replace(params.query());
    }
}

const html = document.documentElement.classList;
let defaults = [...html].filter(s => !settings.systems.includes(s));
defaults.push((s => (params.set(params.systems, s), s))(system()));

const args = r => {
    let query = window.location.search.slice(1).toLowerCase();
    return query.replace(r, '').split('/').filter(q => q);
}

const link = q => {
    if (!Array.isArray(q)) q = (q && [q]) || [];
    let options = Object.values(settings).flat();
    let s = Object.values(settings).map(s => s[0]).filter(s => !defaults.includes(s));
    let l = [...q.filter(q => !options.includes(q)), ...s].filter(s => s).join('/');
    return '/' + (l && '?' + l);
}

const pop = () => !history.state ? history.back() : replace('', false);
const push = q => (history.pushState(false, '', link([q, ...params.query()])), window.reload(true));
const replace = (q, r) => (history.replaceState(history.state, '', link(q)), r !== undefined && window.reload(r));
if (history.state !== false) history.replaceState(true, '', '/' + window.location.search);
params.query().forEach(q => Object.values(settings).forEach(s => params.set(s, q)));
window.onpopstate = () => window.reload(false);

export { params, pop, push, replace };

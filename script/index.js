import { params, replace } from './link.js';
import { now } from './util.js'
import http from './http.js';
import fill from './fill.js';

const get = r => {
    Promise.all([
        (resolve, reject) => {
            fetch('./tweets.json').then(res => {
                res.json().then(resolve, reject);
            }, reject);
        },
        (resolve, reject) => {
            http.get().then(res => {
                if (!res) return reject();
                let keys = ['user', 'display', 'avatar', 'time', 'tweets'];
                if (keys.some(key => !res[key])) return reject();
                resolve(res);
            }, reject);
        }
    ].map(f => new Promise(resolve => f(resolve, () => resolve())))
    ).then(([{ tweets, unknown, ...msg }, user = unknown]) => {
        tweets = [...user.tweets, ...tweets];
        if (!user.time) user.time = now();
        r(user, tweets, msg);
    })
}

const identify = (tweet, id) => {
    tweet?.replies?.reduceRight((_, reply) => {
        if (!reply) return;
        reply.id ||= `${++id}`;
        id = identify(reply, id);
    }, undefined);
    return id;
}

const find = (tweet, id) => {
    return id && tweet?.replies?.reduce((a, c) => {
        if (!a && c?.id === id) return [[c], c.replies || []];
        return a || (f => f && f[0].unshift(c) && f)(find(c, id));
    }, undefined);
}

window.addEventListener('load', () => {
    let [screens, ...templates] = ['#screen', '#screens', '#tweets'].map(q => document.querySelector(q));
    let [screen, tweet] = templates.map(el => name => (id => {
        let e = el.querySelector(id).cloneNode(true);
        return (e.removeAttribute('id'), e);
    })('#' + name));

    const content = screen => {
        if (!window.data) return screen;
        let [user, tweets, msg, base] = window.data;
        let [query, id] = [params.query(), params.id()];
        let [thread, replies] = find(base, id) || [[], tweets];
        if (id && !thread.length) return replace(query, false);
        if (!thread.length) replies = query.map(q => msg[q]).filter(m => m).concat(replies);
        fill.tweets(screen, tweet, user, thread, replies);
        screen.ontransitionend?.();
        return screen;
    }

    window.refresh = push => {
        window.outdated = undefined;
        window.data = undefined;
        window.reload(push);
        get((user, tweets, msg) => {
            let all = Object.values(msg).concat(tweets);
            let base = (b => (identify(b, 0), b))({ replies: all });
            window.data = [user, tweets, msg, base];
            let screen = screens.firstElementChild;
            content(screen);
            screen.added();
        })
    }

    window.reload = push => {
        if (window.outdated) return window.refresh(push);
        let [compose, id] = [params.query().find(q => q === 'compose'), params.id()];
        let add = content(fill.screen(screen, compose || (id ? 'thread' : 'home')));
        while (screens.childElementCount > 1) screens.lastElementChild.remove();
        let remove = screens.firstElementChild;
        if (!remove) return screens.prepend(add);

        let up = push ? compose : remove.classList.contains('compose');
        let removing = push ? up ? 'top' : 'left' : up ? 'bottom' : 'right';
        let adding = push ? up ? 'bottom' : 'right' : up ? 'top' : 'left';
        (push ? remove : add).classList.remove('show');
        (push ? add : remove).classList.add('show');

        const frame = cb => requestAnimationFrame(cb);
        frame(() => frame(() => add.classList.remove(adding)));
        remove.ontransitionend = () => remove.remove();
        remove.classList.add(removing);
        add.classList.add(adding);
        screens.prepend(add);
        add.added?.();
    }

    window.refresh();
    templates.forEach(el => el.remove());
})

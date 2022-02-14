import { params, pop, push, replace } from './link.js';
import { datetime, number, tag, now } from './util.js';
import { max, safe } from './safe.js';
import http from './http.js';

const insert = (template, user, tweet) => {
    const val = q => tweet[q] || user[q] || '';
    const find = q => template.querySelector(q);
    const set = (q, v) => (el => (el && (el.innerHTML = v), el))(find(q));
    let [date, time, passed] = datetime(val('time') || now());
    set('.date', date);
    set('.time', time);
    set('.passed', passed);
    set('.text', val('text'));
    set('.display', val('display'));
    set('.user', '@' + val('user'));
    set('.replying .tag', tag(val('replying'), user));
    set('.value.requotes', number(val('retweets') + val('quotes')));
    set('.value.replies', number(val('replied') || val('replies').length));
    const sibling = ([s, v]) => [set('.value.' + s, number(v))?.nextElementSibling, v];
    ['likes', 'quotes', 'retweets'].map(s => [s, val(s)]).map(sibling).forEach(([el, v]) => {
        let [name, multiple] = [el?.innerHTML || '', el?.innerHTML?.endsWith('s')];
        if (el && multiple && v === 1) el.innerHTML = name.slice(0, -1);
        if (el && !multiple && v !== 1) el.innerHTML = name + 's';
    })
    find('.avatar')?.setAttribute('src', val('avatar'));
    find('.click')?.addEventListener('click', () => {
        if (!window.scrolling) push(tweet.id);
    })
    return template;
}

const tweets = (screen, tweet, user, thread, replies) => {
    screen.querySelector('img.avatar, .avatar img')?.setAttribute('src', user.avatar);
    screen.querySelector('.load')?.remove();
    let text = screen.querySelector('textarea');
    let tweets = screen.querySelector('.tweets');
    screen.ontransitionend = () => text?.focus();
    if (thread.length) thread[thread.length - 1].type = 'thread';
    tweets?.prepend(...[thread].concat(replies.filter(t => t).map(reply => {
        let [i, items, replies] = [0, [reply], reply.replies];
        while (i++ < reply.chain && replies?.[0]) {
            items.push(replies[0]);
            replies = replies[0].replies;
        }
        return items;
    })).filter(list => list.length).map((list, i) => {
        let chain = (c => (c.prepend(...list.map(item => {
            let type = [item.type, item.type = undefined][0];
            return insert(tweet(type || 'reply'), user, item);
        })), c))(tweet('chain'));
        let home = !thread.length;
        if (!list[0].more || (!home && !i)) return chain;
        let type = home ? 'more-thread' : 'more-replies';
        let second = (el, node) => el.insertBefore(node, el.children[1]);
        let avi = second(chain.lastElementChild, tweet(type)).querySelector('.avatar');
        avi?.setAttribute('src', list[0].avatar || user.avatar);
        return chain;
    }))

    screen.added = () => {
        if (thread.length <= 1) return;
        let focus = tweets.querySelector('.chain > .tweet.thread');
        let [content, end] = [tweets.parentElement, tweets.nextElementSibling];
        let ignore = content.querySelector('.offset').clientHeight;
        let overflow = content.clientHeight - tweets.scrollHeight;
        let offset = focus.offsetTop - ignore;
        let pad = overflow + offset - ignore;
        let height = Math.max(end.clientHeight, pad);
        end.style.minHeight = `${height}px`;
        content.scrollTop = offset;
    }
}

const screen = (templates, template) => {
    let screen = templates(template);
    const using = (q, cb) => (el => el && cb(el))(find(q));
    const find = (el, q) => q ? el.querySelector(q) : screen.querySelector(el);
    const click = (q, cb) => (typeof q === 'string' ? find(q) : q)?.addEventListener('click', cb);
    click('.screen.home .twitter', () => params.cycle(params.accents));
    click('.screen.home .avatar', () => params.cycle(params.systems));
    click('.screen.home .latest', () => params.cycle(params.themes));
    click('.screen.home .float', () => (replace(), push('compose')));
    click('button.home', () => replace(params.query(), false));
    ['.back', '.close', '.cancel'].map(el => click(el, pop));

    let classes = ['static'];
    classes.forEach(c => {
        let m = screen.classList.contains(c) ? 'add' : 'remove';
        document.documentElement.classList[m](c);
    })

    using('.load', load => {
        load.append(templates('spinner'));
    })

    using('.content', content => {
        let [pos, scroll, scrolled] = [null, null, 0];
        document.addEventListener('mouseup', () => pos = scroll = null);
        content.addEventListener('mousedown', e => {
            scrolled = 0;
            pos = e.clientY;
            scroll = content.scrollTop;
            window.scrolling = false;
        })
        document.addEventListener('mousemove', e => {
            if (pos == null) return;
            scrolled = e.clientY - pos;
            content.scrollTop = scroll - scrolled;
            window.scrolling = Math.abs(scrolled) > 10;
        })
    })

    using('.compose .content', compose => {
        let text = find(compose, 'textarea');
        let start = compose.style.height;
        let body = compose.parentElement;
        let header = find('.header');
        let send = find(header, '.send');
        let overflow = find('.overflow');
        let input = find('.input').firstChild;
        text.addEventListener('input', () => {
            let scroll = body.scrollTop;
            text.style.height = 'auto';
            text.parentElement.style.height = start;
            text.style.height = text.scrollHeight + 'px';
            text.parentElement.style.height = 'auto';
            body.scrollTop = scroll;
            let [m, s] = [max, text.value];
            while (safe(s.slice(0, m)).length > max) --m;
            if (s.length > m || overflow.textContent) {
                input.textContent = s.slice(0, m);
                overflow.textContent = s.slice(m);
            }
            let valid = s.trim() && s.length <= m;
            if (valid) send.removeAttribute('disabled');
            else send.setAttribute('disabled', '');
        })

        const border = b =>  header.classList[b ? 'remove' : 'add']('noborder');
        body.addEventListener('scroll', () => border(body.scrollTop));
        click(body, () => text.focus());
        border(body.scrollTop);
        click(send, () => {
            text.setAttribute('disabled', '');
            send.setAttribute('disabled', '');
            http.put(text.value.trim()).finally(() => {
                window.outdated = true;
            }).then(res => {
                if (res) pop();
                else replace('limit', false);
            }).catch(() => replace('error', false));
        })
    })

    return screen;
}

export default { screen, tweets };

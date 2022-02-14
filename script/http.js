const request = (method, body) => new Promise((resolve, reject) => {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = () => {
        if (timedout || (xmlhttp.readyState !== XMLHttpRequest.DONE)) return;
        if (xmlhttp.status !== 200) return reject();
        try {
            let text = xmlhttp.responseText;
            resolve(JSON.parse(text));
            timedout = true;
        } catch (err) {
            reject(err);
        }
    }
    let [timeout, timedout] = [5000, false];
    xmlhttp.open(method, 'https://178.116.73.195:443/twt', true);
    xmlhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
    setTimeout(() => timedout || (timedout = true, reject()), timeout);
    if (!body) xmlhttp.send();
    else xmlhttp.send(body);
})

const put = tweet => request('PUT', tweet);
const get = () => request('GET');
export default { get, put };

// ВК-бот книги рецептов: Cloudflare Worker.
// Принимает события Callback API сообщества ВКонтакте, сразу отвечает «Получила»
// и передаёт сообщение в GitHub Actions (.github/workflows/vk-bot.yml), где оно и обрабатывается.
//
// Переменные (Settings → Variables and Secrets):
//   VK_CONFIRMATION - строка подтверждения из настроек Callback API
//   VK_SECRET       - секретный ключ из настроек Callback API
//   VK_TOKEN        - ключ доступа сообщества (права: сообщения сообщества)
//   VK_ALLOWED      - id страниц ВК, кому можно управлять ботом, через запятую
//   GITHUB_TOKEN    - токен GitHub с доступом Contents: Read and write к репозиторию
//   GITHUB_REPO     - репозиторий, например Fedik2005/1

const VK_VERSION = '5.199';

export default {
    async fetch(request, env, ctx) {
        if (request.method !== 'POST') {
            const url = new URL(request.url);
            if (url.searchParams.has('check')) return selfCheck(env);
            return text('Бот книги рецептов работает.\nПроверка настроек: откройте этот адрес с ?check на конце.');
        }
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.log('Не JSON от ВК');
            return new Response('bad request', { status: 400 });
        }
        console.log('Событие ВК:', body.type, 'группа', body.group_id);
        if (body.type === 'confirmation') {
            if (!env.VK_CONFIRMATION) console.log('Нет переменной VK_CONFIRMATION');
            return new Response((env.VK_CONFIRMATION || '').trim());
        }
        if (env.VK_SECRET && (body.secret || '').trim() !== env.VK_SECRET.trim()) {
            console.log('Секретный ключ из ВК не совпадает с VK_SECRET');
            return new Response('forbidden', { status: 403 });
        }
        if (body.type === 'message_new' && body.object) {
            // в старых версиях API сообщение лежит прямо в object
            const msg = body.object.message || body.object;
            // ВК ждёт «ok» быстро, поэтому работа идёт уже после ответа
            ctx.waitUntil(handleMessage(msg, env).catch(e => console.log('Ошибка:', e && e.stack || e)));
        }
        return new Response('ok');
    }
};

function text(s, status) {
    return new Response(s, { status: status || 200, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

// Страница самопроверки: что задано и работает ли. Значения ключей не показывает.
async function selfCheck(env) {
    const lines = ['Проверка бота книги рецептов', ''];
    const need = ['VK_CONFIRMATION', 'VK_SECRET', 'VK_TOKEN', 'VK_ALLOWED', 'GITHUB_TOKEN', 'GITHUB_REPO'];
    for (const k of need) {
        const v = env[k];
        lines.push((v && String(v).trim() ? 'есть    ' : 'НЕТ     ') + k + (v && v !== v.trim() ? '  (лишние пробелы по краям)' : ''));
    }
    lines.push('');

    if (env.VK_TOKEN) {
        const g = await vkCall(env, 'groups.getById', {});
        if (g.error) {
            lines.push('ВК: ключ VK_TOKEN не работает - ' + g.error.error_msg);
        } else {
            const group = (g.response.groups || g.response)[0];
            lines.push('ВК: ключ работает, сообщество «' + group.name + '» (номер ' + group.id + ')');
            const p = await vkCall(env, 'groups.getTokenPermissions', {});
            if (!p.error) {
                const names = (p.response.permissions || []).map(x => x.name);
                lines.push(names.includes('messages')
                    ? 'ВК: у ключа есть право на сообщения'
                    : 'ВК: у ключа НЕТ права на сообщения - создайте ключ заново с галочкой «сообщения сообщества»');
            }
        }
    }
    const allowed = String(env.VK_ALLOWED || '').split(/[\s,]+/).filter(Boolean);
    lines.push('ВК: управлять ботом могут id: ' + (allowed.length ? allowed.join(', ') : 'пока никто (напишите боту - он пришлёт ваш id)'));
    if (allowed.some(a => !/^\d+$/.test(a))) lines.push('ВК: в VK_ALLOWED должны быть только цифры id, без «id» и ссылок');

    if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
        const r = await fetch('https://api.github.com/repos/' + env.GITHUB_REPO.trim(), {
            headers: { 'Authorization': 'Bearer ' + env.GITHUB_TOKEN.trim(), 'User-Agent': 'vk-recipe-bot', 'Accept': 'application/vnd.github+json' }
        });
        lines.push(r.status === 200 ? 'GitHub: ключ работает, репозиторий ' + env.GITHUB_REPO.trim() + ' найден'
            : 'GitHub: ошибка ' + r.status + (r.status === 401 ? ' - неверный GITHUB_TOKEN' : r.status === 404 ? ' - не найден репозиторий или у ключа нет к нему доступа' : ''));
    }
    lines.push('', 'Если всё «есть» и «работает», а бот молчит - проверьте в ВК: Работа с API → Callback API,',
        'зелёная галочка у адреса, версия API 5.199, во вкладке «Типы событий» отмечены «Входящие сообщения»,',
        'и секретный ключ там такой же, как VK_SECRET.');
    return text(lines.join('\n'));
}

async function vkCall(env, method, params) {
    const body = new URLSearchParams(Object.assign({ access_token: (env.VK_TOKEN || '').trim(), v: VK_VERSION }, params));
    const res = await fetch('https://api.vk.com/method/' + method, { method: 'POST', body });
    return res.json();
}

async function handleMessage(msg, env) {
    const allowed = String(env.VK_ALLOWED || '').split(/[\s,]+/).filter(Boolean);
    console.log('Сообщение от', msg.from_id, 'разрешённые:', allowed.join(','));
    if (!allowed.includes(String(msg.from_id))) {
        await vkSend(env, msg.peer_id,
            'Это бот книги рецептов Polkovniki Lubvi, им управляет автор. Ваш id: ' + msg.from_id +
            (allowed.length ? '' : '\nЧтобы управлять ботом, впишите этот id в переменную VK_ALLOWED.'));
        return;
    }

    const files = [];
    collectFiles(msg, files);
    const text = (msg.text || '').trim();

    const first = text.split('\n')[0].trim().toLowerCase();
    const quiet = /^(помощь|help|старт|start|начать|привет|шаблон|список|рецепты|все рецепты|\/start)[!.?]*$/.test(first);
    if (!quiet && (text || files.length)) {
        const what = /^(изменить|исправить|редактировать|поменять)/.test(first) ? 'Вношу правку'
            : /^(удалить|убрать)/.test(first) ? 'Удаляю'
            : 'Добавляю рецепт';
        await vkSend(env, msg.peer_id, 'Получила! ' + what + ', это займёт около минуты.');
    }

    const res = await fetch('https://api.github.com/repos/' + String(env.GITHUB_REPO || '').trim() + '/dispatches', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + String(env.GITHUB_TOKEN || '').trim(),
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'vk-recipe-bot'
        },
        body: JSON.stringify({
            event_type: 'vk-message',
            client_payload: { peer_id: msg.peer_id, from_id: msg.from_id, text: text, files: files }
        })
    });
    console.log('GitHub принял сообщение:', res.status);
    if (res.status !== 204) {
        await vkSend(env, msg.peer_id,
            'Не получилось передать сообщение на GitHub (код ' + res.status + '). Проверьте GITHUB_TOKEN и GITHUB_REPO в Cloudflare.');
    }
}

// фото и файлы из сообщения, из ответа на сообщение и из пересланных
function collectFiles(msg, out) {
    for (const a of msg.attachments || []) {
        if (a.type === 'photo' && a.photo && a.photo.sizes) {
            const best = a.photo.sizes.reduce((b, s) => (!b || s.width * s.height > b.width * b.height ? s : b), null);
            if (best) out.push({ kind: 'photo', url: best.url });
        } else if (a.type === 'doc' && a.doc) {
            out.push({ kind: 'doc', url: a.doc.url, ext: a.doc.ext, title: a.doc.title });
        }
    }
    if (msg.reply_message) collectFiles(msg.reply_message, out);
    for (const f of msg.fwd_messages || []) collectFiles(f, out);
}

async function vkSend(env, peerId, message) {
    const answer = await vkCall(env, 'messages.send', {
        peer_id: String(peerId),
        random_id: String(Math.floor(Math.random() * 2147483647)),
        message: message
    });
    if (answer.error) console.log('ВК не отправил ответ:', answer.error.error_code, answer.error.error_msg);
}

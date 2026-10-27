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
            return new Response('Бот книги рецептов работает.', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
        }
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response('bad request', { status: 400 });
        }
        if (body.type === 'confirmation') {
            return new Response(env.VK_CONFIRMATION || '');
        }
        if (env.VK_SECRET && body.secret !== env.VK_SECRET) {
            return new Response('forbidden', { status: 403 });
        }
        if (body.type === 'message_new' && body.object && body.object.message) {
            // ВК ждёт «ok» быстро, поэтому работа идёт уже после ответа
            ctx.waitUntil(handleMessage(body.object.message, env));
        }
        return new Response('ok');
    }
};

async function handleMessage(msg, env) {
    const allowed = String(env.VK_ALLOWED || '').split(/[\s,]+/).filter(Boolean);
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

    const res = await fetch('https://api.github.com/repos/' + env.GITHUB_REPO + '/dispatches', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'vk-recipe-bot'
        },
        body: JSON.stringify({
            event_type: 'vk-message',
            client_payload: { peer_id: msg.peer_id, from_id: msg.from_id, text: text, files: files }
        })
    });
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

async function vkSend(env, peerId, text) {
    const params = new URLSearchParams({
        access_token: env.VK_TOKEN,
        v: VK_VERSION,
        peer_id: String(peerId),
        random_id: String(Math.floor(Math.random() * 2147483647)),
        message: text
    });
    await fetch('https://api.vk.com/method/messages.send', { method: 'POST', body: params });
}

# Integrate ticket raise and live updates

Give this file to the developer who adds support inside their own app.

Their page raises a ticket, lists that customer's tickets, opens one ticket, and shows the reply thread. When staff reply or change the ticket, the page updates by itself. They design the screen. These calls stay the same.

This works for a **Next.js** frontend and a **Laravel** frontend (Blade, Livewire, Inertia, or Vue). The URLs, headers, payloads, and responses are the same. The only difference is where the browser code lives, and that a Laravel page must not attach its own CSRF cookie to these calls. That difference is in [Next.js and Laravel](#nextjs-and-laravel).

They do **not** call staff login. They do **not** call `/sanctum/csrf-cookie`. They do **not** send `X-XSRF-TOKEN`. They do **not** send `credentials: "include"`.

| | |
| --- | --- |
| API host | `http://116.193.129.229:8093` |
| Every URL below starts with | `http://116.193.129.229:8093/api` |

Ask the support team for two values:

| Value | Example | Where it goes |
| --- | --- | --- |
| Public API key | `pk_your_project_key` | Header `X-Api-Key` on every call |
| Project domain | `project.e.com` | Query `domain` on load, and body field `domain` when raising a ticket |

The domain string must match the host stored on the project, including a port when one was saved. Take it from the address bar of the running app (`window.location.host`), not from an organization website field.

| App address | Value to store and send |
| --- | --- |
| `http://localhost:3000` | `localhost:3000` |
| `http://localhost:3001` | `localhost:3001` |
| `http://127.0.0.1:3001` | `127.0.0.1:3001` |
| `http://project.e.com` | `project.e.com` |

`localhost` and `localhost:3000` are different. `localhost:3001` and `127.0.0.1:3001` are different. Ask the support team to add the host on the project before testing. A live site stays a hostname only, such as `project.e.com`.

The API secret stays on the server. Never put it in the browser, in `NEXT_PUBLIC_`, or in a Blade script.

`customerPhone` is the signed-in user's mobile number, sent exactly as stored (`userPhone`, or `userMob` when phone is empty). `9876543210` and `+919876543210` are different tokens. Do not use the organization phone.

---

## What to build

Do these steps in this order.

1. Load the project name.
2. Raise a ticket. Save `accessToken` with the phone number and the domain.
3. List that phone number's tickets.
4. Open one ticket and its messages.
5. Connect the websocket for the whole visit, once a token is saved, on every page. A staff reply plays a sound, updates that ticket's row, raises a system notification when the tab is hidden, shows an in-app toast when the tab is visible, and shows a count on both the support icon and the notification bell.

A ticket stays `OPEN` after it is assigned. It becomes `IN_PROGRESS` only when the assigned staff member opens it. `CLOSED` tickets can be read. A new reply on a closed ticket is rejected.

List order, on their page and on the staff page:

1. Open, then in progress, then closed.
2. Inside each group: urgent, high, medium, low.
3. Inside the same status and priority, the older ticket is first.

---

## Headers on every call

```http
Accept: application/json
X-Api-Key: pk_your_project_key
```

After a ticket is created, also send the saved token on list, detail, messages, and realtime:

```http
X-Client-Token: the-accessToken-from-create
```

POST calls also send:

```http
Content-Type: application/json
```

Leave these out:

| Do not send | Why |
| --- | --- |
| `X-XSRF-TOKEN` | These routes do not use the staff session. |
| `X-Api-Secret` | That header is for a server. A browser must not have it. |
| `credentials: "include"` | Do not send the other app's session cookie to this API. |
| Cookie `XSRF-TOKEN` | Same reason. A Laravel Axios default often adds it. See [Laravel frontend](#laravel-frontend). |

---

## Read every response

Check `success` before using `data`. A failed call still returns JSON.

```js
const API = "http://116.193.129.229:8093/api";

async function supportFetch(path, options = {}) {
  const response = await fetch(API + path, {
    ...options,
    credentials: "omit",
    headers: {
      Accept: "application/json",
      "X-Api-Key": "pk_your_project_key",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { "X-Client-Token": options.token } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || body.success === false) {
    const message = body && body.message ? body.message : "The request could not be completed.";
    const error = new Error(message);
    error.status = response.status;
    error.errors = body && body.errors ? body.errors : null;
    throw error;
  }
  return body;
}
```

`options.token` above is only a local flag for this helper. It is not an HTTP option. Pass the saved `accessToken` as `token`.

Success:

```json
{
  "success": true,
  "message": "Ticket created.",
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "Sign in is required.",
  "data": null
}
```

A validation error also has `errors`:

```json
{
  "success": false,
  "message": "The customer phone field is required.",
  "data": null,
  "errors": {
    "customerPhone": ["The customer phone field is required."]
  }
}
```

Show `message` to the user. When `errors` is present, show the text under the matching field.

The websocket auth call is the one exception. Its success body is `{ "auth": "..." }` and has no `success` field. That call is inside the Echo authorizer in step 7.

---

## 1. Load the project

`GET /api/integrations/redirect/project?domain=localhost:3000`

No body. No client token.

| Query | Required | Rule |
| --- | --- | --- |
| `domain` | Yes | The host stored for this API key, including the port when one was saved. Use `window.location.host`. |

```js
const domain = window.location.host;
const project = await supportFetch(
  "/integrations/redirect/project?domain=" + encodeURIComponent(domain),
);
```

**200**

```json
{
  "success": true,
  "message": "Project loaded.",
  "data": {
    "name": "project1",
    "domain": "localhost:3000"
  }
}
```

Show `data.name` on the page. If this call fails, stop. The key or the domain is wrong, so later calls will fail too.

---

## 2. Raise a ticket

`POST /api/integrations/redirect/tickets`

No client token on this call. The response creates the token.

### Payload

```json
{
  "domain": "localhost:3000",
  "customerName": "Alex",
  "customerPhone": "9876543210",
  "customerEmail": "alex@example.com",
  "subject": "Login page is blank",
  "description": "The page stays white after sign in.",
  "priority": "MEDIUM",
  "screenshots": [
    {
      "name": "screen.png",
      "data": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ]
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `domain` | Yes | Same domain as call 1. Max 255 characters. |
| `customerName` | Yes | Max 150 characters. The signed-in user's display name is enough. |
| `customerPhone` | Yes | The signed-in user's mobile. Max 30 characters. Later calls must send this exact string. |
| `customerEmail` | No | A normal email, or omit the field. Max 255 characters. |
| `subject` | Yes | Max 255 characters. |
| `description` | Yes | Max 4000 characters. |
| `priority` | No | `LOW`, `MEDIUM`, `HIGH`, or `URGENT`. If omitted, the API uses `MEDIUM`. |
| `screenshots` | No | Up to 10 images. Omit the field when there is no image. |
| `screenshots[].name` | No | File name, for example `screen.png`. |
| `screenshots[].data` | Yes, if that image is sent | Base64 file bytes, or a full `data:image/png;base64,...` string. |

Image rules: PNG, JPG, WEBP, or GIF. Each file is 20 MB or smaller. The API stores the original immediately and returns that image URL. Compression runs after the response, then the stored path changes to the smaller file. A later ticket GET, or the websocket refresh, returns the lasting URL.

Do not send `assigneeId`. The server assigns a staff member.

**201** — save `data.accessToken`, the phone string, and the domain in the browser. The token lasts 30 days. It can read only that phone number on that project.

`data.number` is the ticket number. Use it in the URLs below. It looks like `TKT-000009`.

Suggested keys:

| Key | Value |
| --- | --- |
| `supportToken` | `data.accessToken` |
| `supportPhone` | The exact `customerPhone` that was sent |
| `supportDomain` | `window.location.host` |

---

## 3. List this customer's tickets

`GET /api/integrations/redirect/tickets?phone=9876543210&page=1&pageSize=20`

No body. Send `X-Client-Token`.

| Query | Required | Rule |
| --- | --- | --- |
| `phone` | Yes | The same phone string used in call 2. |
| `search` | No | Ticket number or subject. Example: `TKT-000009` or `login`. |
| `priority` | No | `LOW`, `MEDIUM`, `HIGH`, or `URGENT`. |
| `status` | No | `OPEN`, `IN_PROGRESS`, or `CLOSED`. |
| `fromDate` | No | Raised-on start, `YYYY-MM-DD`. |
| `toDate` | No | Raised-on end, `YYYY-MM-DD`. |
| `page` | No | Starts at `1`. |
| `pageSize` | No | Default `20`. Maximum `100`. |

Leave a filter out to include every value. When the user searches or clears filters, call this again with `page=1`.

**200** `data` has `items`, `total`, `page`, `pageSize`, `from`, and `to`. Page text: `Showing ${from} to ${to} of ${total}`. Previous is off when `page` is `1`. Next is off when `to` equals `total`. An empty page is `"items": []`, and `from` and `to` are `0`.

| Field | Meaning |
| --- | --- |
| `createdAt` | Raised-on time. |
| `remark` | Latest staff note, or `null`. |
| `status` | `OPEN`, `IN_PROGRESS`, or `CLOSED`. |

Opening the list does **not** clear the support-icon count. Only opening that ticket does.

---

## 4. Open one ticket

`GET /api/integrations/redirect/tickets/TKT-000009?phone=9876543210`

No body. `TKT-000009` is `data.number` from call 2 or from a list row. Send `X-Client-Token`.

`screenshots[].url` is a normal image address. Show it in an image tag. It is not base64.

When this ticket opens, clear its unread count and remove its row from the notification bell. Do this in the click handler, before the GET returns, so the badge drops without a refresh. See [Clear a ticket when the user opens it](#clear-a-ticket-when-the-user-opens-it).

---

## 5. Read messages

`GET /api/integrations/redirect/tickets/TKT-000009/messages?phone=9876543210`

No body. Send `X-Client-Token`.

Show the array from top to bottom. `id` `"0"` is the original problem. `side` is `client` or `staff`. Screenshot fields are `{ name, url }`.

---

## 6. Send a reply

`POST /api/integrations/redirect/tickets/TKT-000009/messages?phone=9876543210`

`phone` is a query parameter, not a body field. Send `X-Client-Token`.

Send `message`, `screenshots`, or both. An empty message with no image is rejected. Image rules match call 2: up to 10 files, each 20 MB or smaller, PNG, JPG, WEBP, or GIF.

A message that asks for a password, one-time code, card number, bank account, or other secret is rejected and is not stored. “I forgot my password” is allowed when it does not ask for the secret or send it.

**201** returns the new message, including image URLs. A closed ticket rejects the reply. Show the thread as read-only when `status` is `CLOSED`.

The customer's own reply must not add a support-icon count and must not play the notice sound. The live event for that reply has `"sound": false`.

---

## 7. Connect live updates

Install `laravel-echo` and `pusher-js` in the frontend app.

Keep the customer socket connected on **every page** after `accessToken` is saved, including pages that are not the ticket list. The support icon and the notification bell cannot change if the socket starts only when the list opens.

Call realtime when the app shell mounts. Add `number` only while one ticket is open.

`GET /api/integrations/redirect/realtime?phone=9876543210`

`GET /api/integrations/redirect/realtime?phone=9876543210&number=TKT-000009`

No body. Send `X-Client-Token`.

**200** `data` includes `broadcaster`, `key`, `host`, `port`, `scheme`, `authEndpoint`, `soundUrl`, `customerChannel`, and `ticketChannel`.

Use `host`, `port`, and `scheme` from this response. The browser opens `ws://116.193.129.229:8093/app/{key}`. Do not open port `8094`.

`ticketChannel` is `null` when `number` was not sent.

`soundUrl` is `http://116.193.129.229:8093/sounds/notice.wav` in this environment. Play that file only when a live event has `"sound": true`. That is a staff reply, a staff note, or a status change. The customer's own reply and the later image-compression refresh send `"sound": false`. Do not play the sound for those.

Connect from the browser only, after this GET succeeds. `echo.private` adds the `private-` prefix. Pass `customerChannel` and `ticketChannel` as returned. Do not add `private-` yourself.

Leave `ticketChannel` when the user closes that ticket. Keep `customerChannel` for the whole signed-in visit. Call `echo.disconnect()` when the app shell unmounts.

### Auth payload

`POST /api/integrations/redirect/realtime/auth`

Echo sends this. Do not call it by hand except to debug.

```json
{
  "socket_id": "12345.67890",
  "channel_name": "private-customer.2.ab12cd34ef56ab78cd90",
  "phone": "9876543210"
}
```

| Field | Required | Rule |
| --- | --- | --- |
| `socket_id` | Yes | Given by Echo. Shape is digits, a dot, digits. |
| `channel_name` | Yes | The channel Echo is joining. It starts with `private-`. |
| `phone` | Yes | Same phone string as the token. |

This response is **not** wrapped in `success`. Echo needs `{ "auth": "public-app-key:signature" }`. If the authorizer passes `{ success, data }` into Echo, the join fails. Pass the raw `{ auth }` object.

Headers on this POST: `Accept`, `Content-Type: application/json`, `X-Api-Key`, `X-Client-Token`. `credentials: "omit"`.

### What a live event looks like

The event name is `signal`. Listen with `.signal` (the leading dot is required).

The event does not contain the new message text and does not contain images. It only says which request to call again. `title` and `body` are often empty. Do not invent message text from the socket. Drop any image URL or file bytes if they appear.

A staff reply uses this shape. `sound` is `true`. The customer's own reply uses the same shape with `sound` set to `false`.

```json
{
  "type": "ticket.message",
  "sound": true,
  "notificationId": null,
  "ticketId": "15",
  "number": "TKT-000009",
  "title": "",
  "body": "",
  "hasImages": false,
  "refresh": ["messages", "tickets"]
}
```

| `refresh` contains | Call again |
| --- | --- |
| `tickets` | Call 3, the ticket list, with the same filters and page |
| `messages` | Call 5, the messages of `number`, only when that ticket is open |
| `ticket` | Call 4, the open ticket of `number`, only when that ticket is open |

`hasImages: true` means the next messages GET or ticket GET includes new image URLs.

| `sound` | What the page does |
| --- | --- |
| `true` | Play `soundUrl` once, after the user has clicked the page at least once. Add `number` to the unread set, unless that ticket is already open. Show a system notification or an in-app toast, as in the next section. Reload the list and replace the row whose `number` matches. |
| `false` | Do not play a sound, do not add a count, and do not raise a system notification or a toast. Still reload whatever `refresh` names, so the row and the thread stay current. |

If two events arrive together, debounce the GETs by about 300ms so they run once. Play the sound once per event that has `"sound": true`.

What the customer sees live:

| What happened | Sound | Ticket row | Support icon and bell |
| --- | --- | --- | --- |
| Staff sends a reply | Play `soundUrl` | Reload the list. Replace the row for `number`. | Add one row for `number`, unless that ticket is open |
| Staff sends an image on a reply | Same, when `sound` is true | Same | Same. The image URL is in the messages GET, not in the event |
| Staff writes a note | Play `soundUrl` | Reload the list. Show the new `remark` on that row | Add `number` unless that ticket is open |
| Status changes | Play `soundUrl` | Reload the list. Show the new `status` on that row | Add `number` unless that ticket is open |
| Customer sends their own reply | No sound | Reload the list | No new count |
| Image compression finishes | No sound | No new count. The next GET has the lasting image URL | No new count |

### Show which ticket row received the update

A staff reply often leaves `status` and `remark` unchanged. Replacing the row from call 3 then looks the same as before, so the customer cannot see which ticket changed. When `sound` is `true` and that ticket is not already open, do all of the following:

1. Reload the ticket list when the event has a `number`, including when `refresh` does not contain `tickets`. `status` and `remark` still update when the server changed them.
2. Highlight that list row. Use the row class `support-row-updated`.
3. Show a **New reply** label beside `number` in that row.

The label and the highlight use the same unread set as the support icon and the bell. One ticket stays one highlighted row even when several staff replies arrive for it. Opening that ticket removes the highlight and the **New reply** label at the same time as the unread count. A customer reply (`"sound": false`) does not highlight a row and does not show **New reply**.

---

## System notification, toast, support icon, and bell

The header has two controls next to each other. Both use the same unread list.

| Control | What it does |
| --- | --- |
| Support icon | Goes to the ticket list. Shows a red count of unread ticket numbers. |
| Notification bell | Sits beside the support icon. Shows the same red count. Opens a panel of the latest notices. |

Put `data-support-icon` on the support button. The count is the number of ticket numbers in the unread set, not the number of socket events. One ticket stays one badge even when several staff replies arrive for it.

### Ask once, on the first click

Browsers block sound and system notifications until the user has clicked or tapped the page. On the first `pointerdown`:

1. Unlock `soundUrl` (create the `Audio`, call `play()`, then pause and reset it so the later `play()` is allowed).
2. If `Notification.permission` is `"default"`, call `Notification.requestPermission()`. Do not ask again after the user allows or blocks it.

### When `sound` is true

Keep one notice per ticket number. A newer event for the same `number` replaces that row, moves it to the top, and marks it unread again. Keep at most 20 rows.

Title: `event.title` when it is non-empty plain text, otherwise `Support update`. Body: `event.body` when it is non-empty plain text. Strip control characters. Ignore text that contains `data:image` or `/storage/`. Cap the title at 120 characters and the body at 240. Never put screenshot bytes in the notice.

Then branch on whether the tab is visible:

| Tab | What to show |
| --- | --- |
| Hidden (`document.visibilityState === "hidden"`) and permission is `"granted"` | One operating-system notification. Do not also show the in-app toast. |
| Visible, or permission is not granted, or `Notification` is missing | No system notification. Play `soundUrl` (or a short two-tone chime if that file cannot play) and show an in-app toast. |

System notification options:

| Option | Value |
| --- | --- |
| `title` | The notice title |
| `body` | The notice body, omitted when empty |
| `tag` | The ticket `number`, so a second update replaces the popup |
| `renotify` | `true` |
| `icon` | The app favicon, and only when that icon is on the same origin as the page |
| `silent` | `false` |

When the user clicks the system notification: `window.focus()`, close the popup, open that ticket, and clear its unread row.

The in-app toast shows the same title, the body under it when present, and an **Open ticket** action that opens that ticket and clears its unread row.

If that ticket is already open, skip the sound, the system notification, the toast, and the badge. Still refresh the open thread.

### Bell panel

The panel lists stored notices, newest first.

Each row shows:

- Title, or `Support update`
- Ticket number, such as `TKT-000009`
- Body, when the event sent one
- Local time
- A red dot while that row is unread

An empty list says there are no notifications yet. **Mark all read** clears the red dots and both badge counts. It does not delete the rows.

Clicking a row marks that ticket read, closes the panel, and opens the ticket.

### Clear a ticket when the user opens it

Opening the ticket from the list, from the bell, from the toast, or from the system notification all do the same thing:

1. Remove that `number` from the unread set.
2. Remove that ticket's row from the bell list.
3. Write both stores back to `localStorage`.
4. Paint both badges.

Do this as soon as the user opens the ticket. Do not wait for the detail GET, and do not wait for a page refresh.

Opening the ticket list without opening a ticket does not clear the count.

### Persist across refresh

A refresh must **not** clear unread notices. Store them in `localStorage` and paint the badges on load.

| Key | Contents |
| --- | --- |
| `supportUnread` | JSON array of ticket numbers, for example `["TKT-000009"]` |
| `supportNotices` | JSON array of bell rows: `{ id, number, title, body, at, unread }` |

`at` is the time the notice was received, as milliseconds. On startup, read both keys and paint the icons before the socket connects. A new event updates both keys.

Signing out of the host app clears `supportToken`, `supportPhone`, `supportDomain`, `supportUnread`, and `supportNotices`, and disconnects Echo.

### Sample

```js
const audio = new Audio(ready.data.soundUrl);
let audioUnlocked = false;
const UNREAD_KEY = "supportUnread";
const NOTICES_KEY = "supportNotices";

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const unread = new Set(readJson(UNREAD_KEY, []));
let notices = readJson(NOTICES_KEY, []);
let openNumber = "";

document.addEventListener("pointerdown", () => {
  audioUnlocked = true;
  audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {});
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}, { once: true });

function remember() {
  localStorage.setItem(UNREAD_KEY, JSON.stringify([...unread]));
  localStorage.setItem(NOTICES_KEY, JSON.stringify(notices.slice(0, 20)));
  paintSupportIcon();
  paintBell();
}

function paintSupportIcon() {
  const count = unread.size;
  for (const icon of document.querySelectorAll("[data-support-icon], [data-support-bell]")) {
    icon.dataset.count = String(count);
    icon.classList.toggle("has-news", count > 0);
  }
  const icon = document.querySelector("[data-support-icon]");
  if (icon) {
    icon.setAttribute("aria-label", count > 0 ? `Support, ${count} new` : "Support");
  }
}

function noticeText(value, max) {
  if (typeof value !== "string") return "";
  const text = value.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text || /data:image|\/storage\//i.test(text)) return "";
  return text.slice(0, max);
}

function pushNotice(event) {
  const number = event.number || "";
  const title = noticeText(event.title, 120);
  const body = noticeText(event.body, 240);
  const row = {
    id: number || String(event.ticketId || Date.now()),
    number,
    title,
    body,
    at: Date.now(),
    unread: true,
  };
  notices = [row, ...notices.filter((item) => item.id !== row.id)].slice(0, 20);
}

function clearTicket(number) {
  if (!number) return;
  unread.delete(number);
  notices = notices.filter((item) => item.number !== number);
  remember();
}

function presentNotice(event) {
  const title = noticeText(event.title, 120) || "Support update";
  const body = noticeText(event.body, 240);
  const hidden = document.visibilityState === "hidden";
  const canNotify = hidden && typeof Notification !== "undefined" && Notification.permission === "granted";
  if (canNotify) {
    const popup = new Notification(title, {
      body: body || undefined,
      tag: event.number || "support",
      renotify: true,
      silent: false,
    });
    popup.onclick = () => {
      window.focus();
      popup.close();
      openTicket(event.number);
    };
    return;
  }
  if (audioUnlocked) audio.play().catch(() => {});
  showInAppToast(title, body, () => openTicket(event.number));
}

function openTicket(number) {
  openNumber = number;
  clearTicket(number);
  loadTicket(number);
  loadMessages(number);
}

const waiting = new Set();
let timer = 0;
let pendingNumber = "";

function onSignal(event) {
  for (const section of event.refresh || []) waiting.add(section);
  if (event.number) pendingNumber = event.number;

  const lookingAtIt = Boolean(event.number) && event.number === openNumber;
  if (event.sound && event.number && !lookingAtIt) {
    unread.add(event.number);
    pushNotice(event);
    remember();
    presentNotice(event);
  }
  if (lookingAtIt) clearTicket(event.number);

  clearTimeout(timer);
  timer = setTimeout(() => {
    const sections = [...waiting];
    const number = pendingNumber;
    waiting.clear();
    if (sections.includes("tickets")) loadTicketList();
    if (number && number === openNumber) {
      if (sections.includes("messages")) loadMessages(number);
      if (sections.includes("ticket")) loadTicket(number);
    }
  }, 300);
}

paintSupportIcon();
```

`loadTicketList` is call 3. After it returns, render `data.items` again so the row for `pendingNumber` shows the new status, remark, and time. `loadMessages` and `loadTicket` are calls 5 and 4. Call them only when that ticket is open.

Style `.has-news` as a red badge using `dataset.count`. Show `9+` when the count is greater than 9.

---

## Next.js and Laravel

The seven calls above are the integration. Next.js and Laravel both use them from the **browser**. Do not raise the ticket from a Next.js server action, a Laravel controller, or a queued job. Those server calls are a different API and need the secret, which this page must not have.

### Next.js

Put the widget in a client component (`"use client"`). `localStorage`, `window`, `Notification`, and the websocket do not exist while the server is rendering.

Mount the socket once in the app shell, not only on the ticket page. Import `pusher-js` and `laravel-echo` inside `useEffect`. React Strict Mode runs the effect twice in development. The cleanup must call `echo.disconnect()`, or two sockets stay open.

| Next.js detail | What to do |
| --- | --- |
| Public key | `NEXT_PUBLIC_SUPPORT_API_KEY`. This key is public. The secret is not. |
| Domain | `window.location.host`. A fixed `NEXT_PUBLIC_SUPPORT_DOMAIN` is only a fallback when the host cannot be read. `localhost:3000` and `localhost:3001` are different. |
| Import Echo at the top of a server file | `window is not defined`. Import both libraries inside `useEffect`. |
| `https://` production site | The socket in this response is `ws://` on port 8093. A page served over `https` cannot open `ws://`. Local `http://localhost:3000` can. For an https site, ask the support team for an `https` scheme before going live. |

Ticket list, create, and reply use the same `supportFetch` helper. Call them from event handlers in the client component, not from `getServerSideProps` or a route handler.

### Laravel frontend

Use a **separate** `fetch` (the `supportFetch` helper). Do not reuse the Axios instance that talks to the Laravel app itself.

A normal Laravel frontend Axios setup does this on every request:

- `withCredentials: true`
- header `X-XSRF-TOKEN` copied from that app's `XSRF-TOKEN` cookie
- sometimes `baseURL` pointed at the Laravel app, so `/api/...` hits the wrong host

That cookie belongs to the other project. Ticket routes under `/api/integrations/` ignore it, so a raised ticket is not rejected as a CSRF mismatch. Point `supportFetch` at `http://116.193.129.229:8093/api` and set `credentials: "omit"` so the other app's session cookie is not sent.

| Laravel page | Where the support code goes |
| --- | --- |
| Blade | A `<script type="module">` on the layout, so the socket lives on every page, plus the ticket screen. |
| Livewire | A browser `fetch` from Alpine or a small JS module. Do not send the ticket as a Livewire action to the other app. |
| Inertia + Vue or React | The same client code as Next.js, inside the layout. Still use `supportFetch`, not the Inertia Axios client. |

Do not add a Laravel route that proxies these calls unless that proxy is server-side and you have been given the API secret. The browser integration in this file does not use a proxy.

`localhost:8000` is a common Laravel dev port. Store and send the domain as `localhost:8000` after the support team adds that host. Sending `localhost` without the port fails the domain check.

---

## Errors

Read `message` and the HTTP status. On 401, 403, and 404 the text is short on purpose. The cause is in the table below.

### Browser console, before any JSON

| What you see | Why | How to fix |
| --- | --- | --- |
| `blocked by CORS policy` / no `Access-Control-Allow-Origin` | The browser sent a preflight and the response was not this API's JSON. Common causes: the URL is missing `/api`, the host is down, or the call went to the other Laravel app. | Call `http://116.193.129.229:8093/api/integrations/redirect/...` from the browser. Open that URL's OPTIONS in the network tab and confirm status 204. |
| `net::ERR_FAILED` on the POST | Same CORS failure. The console line above it is the real reason. | Fix the URL and remove `credentials: "include"`. |
| `CSRF token mismatch` in a red console line, status **419** | The POST did not go to `/api/integrations/redirect/tickets`. A staff route still requires the support portal session. | Call `http://116.193.129.229:8093/api/integrations/redirect/tickets` with `X-Api-Key`. Do not call `/sanctum/csrf-cookie`. |
| `window is not defined` | Next.js imported Echo during server render. | Move Echo into `useEffect` in a `"use client"` file. |
| Websocket stays on `connecting`, or `ws://116.193.129.229:8094` times out | Port 8094 is not the public socket. | Use `host`, `port`, and `scheme` from step 7. The working URL is `ws://116.193.129.229:8093/app/{key}`. |
| Mixed content / websocket blocked | The page is `https` and the socket is `ws://`. | Test on `http://localhost:3000`. For a live https site, ask the support team to switch the realtime scheme to `https`. |
| Channel joins, then nothing updates | The listener is `signal` without the dot, or the code subscribed to `private-` plus a name that already contains `private-`. | Listen with `.signal`. Pass `data.customerChannel` to `echo.private` unchanged. |
| No sound and no system popup | The page has not been clicked yet, the tab is visible (system popups are only for a hidden tab), or `sound` is `false`. | Click the page once. Hide the tab to see the operating-system notification. Confirm the event has `"sound": true`. |
| Badge disappears on refresh | Unread numbers were kept in memory only. | Write `supportUnread` and `supportNotices` to `localStorage`, and read them when the header mounts. |

### Status 401 — `Sign in is required.`

This text does **not** mean the customer should open the staff login. On these integration routes it means the key or the client token was rejected.

| Why | How to fix |
| --- | --- |
| `X-Api-Key` header is missing | Send the public key on every call, including the websocket auth POST. |
| The key is wrong | Copy the key for this project again. A key from another project will not load this domain. |
| The key was revoked | Ask the support team for a new public key. |
| `X-Client-Token` is missing on list, ticket, messages, or realtime | Save `accessToken` from the create response and send it as `X-Client-Token`. Call 1 and call 2 do not use this header. |
| The token was edited, or it came from another environment | Raise a ticket again and replace the saved token. |
| The token is older than 30 days | The message is still `Sign in is required.` Raise a ticket again with the same phone and save the new `accessToken`. |

### Status 403 — `You do not have access to this action.`

| Why | How to fix |
| --- | --- |
| `domain` does not match the host stored on the project | Send `window.location.host` exactly. `localhost:3000` is not `localhost`. Ask the support team to add the host if load-project fails with this status. |
| The project is inactive | Ask the support team to set the project to Active. |
| `phone` is not the phone inside the token | Send the same string used when the ticket was raised. Do not reformat it. Use the signed-in user's mobile, not the organization phone. |
| The token belongs to another project | The key and the token must be from the same project. Raise the ticket with this key, then reuse that token. |
| The ticket number belongs to another phone | List tickets with this token and open a `number` from that list. |
| Websocket auth: `phone` missing, or `channel_name` is not this customer's channel | Send `phone` in the auth JSON. Subscribe only to `customerChannel` and `ticketChannel` from step 7. |

### Status 404 — `The requested record was not found.`

| Why | How to fix |
| --- | --- |
| The ticket number is not `TKT-` plus 6 digits | Use `data.number` from create or from the list. `9` and `TKT-9` are not valid. |
| That number is not on this project | Load the list again. Do not type a number from another project. |
| Realtime was called with a bad `number` | Omit `number` until a ticket is open, or pass a number from the list. |

### Status 422 — field errors

`message` is the first problem. `errors` lists every field. Fix the payload and send it again. Nothing was stored.

| `message` | Why | How to fix |
| --- | --- | --- |
| `The domain field is required.` | Create body has no `domain`. | Send `window.location.host`, for example `localhost:3000`. |
| `The customer name field is required.` | `customerName` is missing. | Send the name, max 150 characters. |
| `The customer phone field is required.` | `customerPhone` is missing. | Send the signed-in user's mobile, max 30 characters. |
| `The subject field is required.` | `subject` is missing. | Send a subject, max 255 characters. |
| `The description field is required.` | `description` is missing. | Send the problem text, max 4000 characters. |
| `The selected priority is invalid.` | `priority` is not one of the four values. | Send `LOW`, `MEDIUM`, `HIGH`, or `URGENT`, or omit it. |
| `Enter a valid customer email.` | `customerEmail` is not an email. | Send a real email or omit the field. |
| `Enter a valid customer phone.` | The phone contains letters or is longer than 30 characters. | Digits, spaces, `+`, `(`, `)`, and `-` only. |
| `Select a status.` | List query `status` is not `OPEN`, `IN_PROGRESS`, or `CLOSED`. | Omit `status`, or send one of those three. |
| `Select a priority.` | List query `priority` is not `LOW`, `MEDIUM`, `HIGH`, or `URGENT`. | Omit `priority`, or send one of those four. |
| `Enter a valid date.` | `fromDate` or `toDate` is not `YYYY-MM-DD`. | Use `2026-10-06`, or omit the date. |
| `Enter a message or attach an image.` | Reply body has no text and no image. | Send `message` or at least one screenshot. |
| `This ticket is closed.` | A reply was posted on a `CLOSED` ticket. | Show the thread as read-only when `status` is `CLOSED`. |
| `Each screenshot must be an image.` | The base64 is not PNG, JPG, WEBP, or GIF. | Encode the file bytes, not a webpage or a PDF. A `data:image/png;base64,` prefix is allowed. |
| `Each screenshot must be 20 MB or smaller.` | One file is over 20 MB. | Send a smaller file. The other fields can be sent again. |
| `Attach up to 10 screenshots.` | `screenshots` has more than 10 items. | Send at most 10. |
| `This message was blocked. Do not ask for or send a password, one-time code, card number, or other confidential detail.` | The text asks for a secret, or it contains one. | Remove the password, OTP, card, bank, or key. “I forgot my password” is allowed when it does not ask the staff to send the password. |

### Status 429 — `Too many attempts. Wait a moment and try again.`

More than 30 integration calls in one minute from this client. Wait about a minute. Do not retry in a loop. The websocket debounce in step 7 avoids this when many events arrive together.

### Status 500 — `The server could not complete this request.`

The payload was accepted and the API still failed. Retry once. If it stays, tell the support team the URL, the time, and the `message`. Do not send the client token in that report.

import test from "node:test";
import assert from "node:assert/strict";
// kb.js — браузерный скрипт: он кладёт API в globalThis.AssistantKB
await import("../site/works/assistant/assets/kb.js");
const KB = globalThis.AssistantKB;

const say = (state, text) => KB.step(state, text);

test("помощник: отвечает по базе знаний и предлагает следующий шаг", () => {
  const r = say(KB.newState(), "Сколько стоит поход?");
  assert.match(r.messages[0].text, /6 900/);
  assert.ok(r.messages.at(-1).chips.includes("Записаться"));
  assert.deepEqual(r.state.lead.topics, ["price"]);
});

test("помощник: два совпадения дают два ответа, а непонятное не выдумывается", () => {
  const two = say(KB.newState(), "Какая цена и что взять с собой?");
  assert.ok(two.messages.filter((m) => !m.chips).length >= 2);
  const none = say(KB.newState(), "Расскажи анекдот про космос");
  assert.match(none.messages[0].text, /не хочу выдумывать/);
  assert.match(none.messages[0].text, /менеджеру/);
});

test("помощник: «ремонт»/«работа» не ловится как «бот» или «дат»", () => {
  const r = say(KB.newState(), "Нужна работа по ремонту");
  assert.match(r.messages[0].text, /Не уверен/);
});

test("помощник: полный сценарий заявки с проверкой контакта", () => {
  let s = KB.newState();
  let r = say(s, "Хочу записаться");
  assert.equal(r.state.step, "name");
  r = say(r.state, "А");
  assert.match(r.messages[0].text, /Как к вам обращаться/);
  r = say(r.state, "Алексей");
  assert.equal(r.state.step, "contact");
  r = say(r.state, "не знаю");
  assert.match(r.messages[0].text, /не получилось распознать/i);
  assert.equal(r.state.step, "contact");
  r = say(r.state, "@alex_demo");
  assert.equal(r.state.step, "format");
  assert.deepEqual(r.messages[0].chips, KB.FORMATS);
  r = say(r.state, "Классика (3 дня)");
  assert.equal(r.state.step, "done");
  assert.deepEqual({ name: r.lead.name, contact: r.lead.contact, format: r.lead.format }, { name: "Алексей", contact: "@alex_demo", format: "Классика (3 дня)" });
  assert.match(r.messages[0].text, /ничего не отправлено/);
  // после заявки можно продолжать спрашивать
  const after = say(r.state, "Что взять?");
  assert.match(after.messages[0].text, /спальник/);
});

test("помощник: контакты проверяются, пустой ввод не ломает диалог", () => {
  for (const ok of ["@alex_demo", "name@example.com", "+7 900 123-45-67", "89001234567"]) assert.equal(KB.validContact(ok), true, ok);
  for (const bad of ["", "12", "alex", "@a", "a@b"]) assert.equal(KB.validContact(bad), false, bad);
  const r = say(KB.newState(), "   ");
  assert.equal(r.messages.length, 1);
});

test("помощник: состояние не мутируется между шагами", () => {
  const s0 = KB.newState();
  const snapshot = JSON.stringify(s0);
  say(s0, "Записаться");
  assert.equal(JSON.stringify(s0), snapshot);
});

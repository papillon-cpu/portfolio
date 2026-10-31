// Интерфейс чата: рисует сообщения, чипы-подсказки и карточку заявки справа.
(function () {
  var KB = window.AssistantKB;
  var log = document.getElementById("log");
  var form = document.getElementById("form");
  var input = document.getElementById("msg");
  var chips = document.getElementById("chips");
  var card = document.getElementById("lead");
  var state = KB.newState();
  var busy = false;
  var TOPIC = { price: "цены", dates: "даты", bring: "что взять", route: "как добраться", level: "подготовка", weather: "погода", safety: "безопасность", hello: "приветствие" };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function add(who, text) {
    var m = el("div", "bubble bubble--" + who, text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  function setChips(list) {
    chips.textContent = "";
    (list || []).forEach(function (c) {
      var b = el("button", "chip", c);
      b.type = "button";
      b.addEventListener("click", function () { send(c); });
      chips.appendChild(b);
    });
  }

  function renderLead() {
    var l = state.lead;
    var rows = [["Имя", l.name], ["Контакт", l.contact], ["Формат", l.format]];
    card.textContent = "";
    card.appendChild(el("h3", "lead__title", "Заявка для менеджера"));
    rows.forEach(function (r) {
      var row = el("div", "lead__row");
      row.appendChild(el("span", "lead__k", r[0]));
      row.appendChild(el("b", "lead__v" + (r[1] ? "" : " is-empty"), r[1] || "ещё не указано"));
      card.appendChild(row);
    });
    var topics = l.topics.length ? l.topics.map(function (t) { return TOPIC[t] || t; }).join(", ") : "—";
    var t = el("div", "lead__row");
    t.appendChild(el("span", "lead__k", "Вопросы клиента"));
    t.appendChild(el("b", "lead__v", topics));
    card.appendChild(t);
    card.appendChild(el("p", "lead__note", state.step === "done" ? "Заявка собрана. В боевой версии она уходит в Telegram менеджеру." : "Карточка заполняется по ходу разговора."));
    card.classList.toggle("is-done", state.step === "done");
  }

  function send(text) {
    if (busy) return;
    var t = String(text || "").trim();
    if (!t) return;
    busy = true;
    add("user", t);
    input.value = "";
    setChips([]);
    var res = KB.step(state, t);
    state = res.state;
    var typing = add("bot", "…");
    typing.classList.add("is-typing");
    var i = 0;
    (function next() {
      var m = res.messages[i];
      setTimeout(function () {
        if (i === 0) typing.remove();
        else typing.remove();
        add("bot", m.text);
        if (m.chips) setChips(m.chips);
        i++;
        if (i < res.messages.length) {
          typing = add("bot", "…");
          typing.classList.add("is-typing");
          next();
        } else {
          busy = false;
          renderLead();
        }
      }, 450);
    })();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    send(input.value);
  });

  add("bot", "Здравствуйте! Я демо-помощник заявок для турклуба «Тропа Таганая». Спросите про цены, даты или снаряжение, или я запишу вас на выход.");
  setChips(["Сколько стоит?", "Что взять с собой?", "Как добраться?", "Записаться"]);
  renderLead();
})();

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Tema claro / escuro ---------- */
  var themeBtn = document.getElementById('themeToggle');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isDark() {
    var chosen = root.getAttribute('data-theme');
    return chosen ? chosen === 'dark' : systemDark.matches;
  }

  function syncTheme() {
    var dark = isDark();
    root.classList.toggle('is-dark', dark);
    themeBtn.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
  }

  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('nexguard-tema', next); } catch (e) {}
    syncTheme();
  });
  systemDark.addEventListener('change', syncTheme);
  syncTheme();

  /* ---------- Menu no celular ---------- */
  var menuBtn = document.getElementById('menuToggle');
  var nav = document.getElementById('mainNav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }

  menuBtn.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  /* ---------- Cabeçalho ao rolar ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Link ativo no menu ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (section) { spy.observe(section); });
  }

  /* ---------- Entrada suave ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Herói: destaca um pilar por vez ---------- */
  var stage = document.getElementById('heroStage');
  var cards = stage.querySelectorAll('[data-card]');
  var traces = stage.querySelectorAll('[data-trace]');
  var heroTimer = null;
  var activeIndex = 0;

  function highlight(index) {
    activeIndex = index;
    cards.forEach(function (card, i) { card.classList.toggle('is-active', i === index); });
    traces.forEach(function (trace, i) { trace.classList.toggle('is-active', i === index); });
  }
  function startCycle() {
    stopCycle();
    if (reduceMotion.matches) return;
    heroTimer = window.setInterval(function () { highlight((activeIndex + 1) % cards.length); }, 3200);
  }
  function stopCycle() {
    if (heroTimer) window.clearInterval(heroTimer);
    heroTimer = null;
  }
  highlight(0);
  startCycle();
  cards.forEach(function (card, i) {
    card.addEventListener('mouseenter', function () { stopCycle(); highlight(i); });
    card.addEventListener('mouseleave', startCycle);
  });

  /* Reação suave ao mouse: o símbolo e os cartões se movem em sentidos opostos. */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches && !reduceMotion.matches) {
    var heroSection = document.getElementById('topo');
    heroSection.addEventListener('pointermove', function (event) {
      var box = stage.getBoundingClientRect();
      var x = (event.clientX - (box.left + box.width / 2)) / box.width;
      var y = (event.clientY - (box.top + box.height / 2)) / box.height;
      stage.style.setProperty('--mx', Math.max(-1, Math.min(1, x)).toFixed(3));
      stage.style.setProperty('--my', Math.max(-1, Math.min(1, y)).toFixed(3));
    });
    heroSection.addEventListener('pointerleave', function () {
      stage.style.setProperty('--mx', '0');
      stage.style.setProperty('--my', '0');
    });
  }

  /* Pausa as animações contínuas quando o bloco sai da tela. */
  if ('IntersectionObserver' in window) {
    var fxObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('fx-paused', !entry.isIntersecting);
      });
    });
    fxObserver.observe(stage);
    fxObserver.observe(document.querySelector('.process'));
  }

  /* ---------- Soluções: filtro por necessidade ---------- */
  var chips = document.querySelectorAll('.chip');
  var solutionCards = document.querySelectorAll('.card[data-tags]');
  var filterStatus = document.getElementById('filterStatus');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.getAttribute('data-filter');
      var shown = 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      solutionCards.forEach(function (card) {
        var match = filter === 'todas' || card.getAttribute('data-tags').split(' ').indexOf(filter) !== -1;
        card.classList.toggle('is-dim', !match);
        if (match) shown += 1;
      });
      filterStatus.textContent = shown + ' soluções em destaque';
    });
  });


  /* ---------- Solicitações: orçamento e suporte ---------- */
  var business = window.NEXGUARD;
  var subject = document.getElementById('qService');
  var message = document.getElementById('qMessage');
  var nameInput = document.getElementById('qName');
  var forms = document.querySelectorAll('.request-form');
  var widgets = new Map();
  var requestConfig = null;
  var configError = false;
  function chooseFlow(flow, focus) {
    forms.forEach(function(f) { f.hidden = f.dataset.flow !== flow; });
    document.querySelectorAll('[data-switch]').forEach(function(b) { b.setAttribute('aria-pressed', String(b.dataset.switch === flow)); });
    if (focus) document.querySelector('.request-form:not([hidden]) input').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-switch]').forEach(function(b) { b.addEventListener('click', function() { chooseFlow(b.dataset.switch, true); }); });
  document.querySelectorAll('a[href="#contato"]').forEach(function(link) {
    link.addEventListener('click', function() {
      chooseFlow(link.dataset.flow || 'quote', false);
      if(link.dataset.subject) subject.value=link.dataset.subject;
      window.setTimeout(function(){ document.querySelector('.request-form:not([hidden]) input').focus({preventScroll:true}); }, 100);
    });
  });
  document.querySelectorAll('a[href*="wa.me/"]').forEach(function(a) {
    var service=a.dataset.waService;
    a.href='https://wa.me/'+business.whatsapp+'?text='+encodeURIComponent('Olá! Encontrei a NexGuard pelo site e gostaria de '+(service?'solicitar um orçamento para '+service+'.':'conversar sobre um atendimento.'));
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(a) {
    a.href='mailto:'+business.email;
    if(a.textContent.indexOf('@')!==-1)a.textContent=business.email;
  });
  var floatWa=document.querySelector('.wa-float');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries){floatWa.hidden=entries[0].isIntersecting;}).observe(document.getElementById('contato'));
  }
  window.nexguardTurnstileReady=function(){
    forms.forEach(function(f){
      widgets.set(f,window.turnstile.render(f.querySelector('.turnstile-slot'),{
        sitekey:requestConfig.siteKey,action:'request',theme:'auto'
      }));
    });
  };
  fetch('/api/config').then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(c){
    requestConfig=c;
    if(c.ready && c.siteKey){
      var script=document.createElement('script');
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=nexguardTurnstileReady&render=explicit';
      script.async=true;script.defer=true;
      script.onerror=function(){configError=true;};
      document.head.appendChild(script);
    } else {
      forms.forEach(function(f){var s=f.querySelector('.form-status');s.hidden=false;s.textContent='O envio pelo formulário ainda está em configuração. Utilize o WhatsApp como alternativa.';});
    }
  }).catch(function(){configError=true;});
  forms.forEach(function(f){
    f.querySelector('[type="submit"]').disabled=false;
    var p=f.dataset.flow==='quote'?'q':'s';
    var pending=false, requestId=null, lastPayload='';
    var person=document.getElementById(p+'Person');
    var company=document.getElementById(p+'Company');
    var mode=document.getElementById(p+'Mode');
    var city=document.getElementById(p+'City');
    var state=document.getElementById(p+'State');
    var status=f.querySelector('.form-status');
    var phoneInput=document.getElementById(p+'Phone');
    phoneInput.addEventListener('input',function(){var digits=phoneInput.value.replace(/\D/g,'');phoneInput.setCustomValidity(phoneInput.value && (digits.length<10||digits.length>13)?'Informe um WhatsApp válido com DDD.':'');});
    function conditional(){
      company.parentElement.parentElement.hidden=person.value!=='pj';
      company.required=person.value==='pj';
      city.required=p==='q'||mode.value==='presencial';
      state.required=city.required;
    }
    person.addEventListener('change',conditional); mode.addEventListener('change',conditional); conditional();
    f.addEventListener('submit',async function(event){
      event.preventDefault();
      if(pending)return;
      conditional();
      if(!f.reportValidity())return;
      status.hidden=false;
      if(configError||!requestConfig||!requestConfig.ready||!window.turnstile||!widgets.has(f)){
        status.textContent='O envio pelo formulário está indisponível no momento. Seus dados foram mantidos; tente novamente ou utilize o WhatsApp.';return;
      }
      var token=window.turnstile.getResponse(widgets.get(f));
      if(!token){status.textContent='Conclua a verificação de segurança antes de enviar.';return;}
      var payload={
        flow:f.dataset.flow,name:document.getElementById(p+'Name').value.trim(),
        email:document.getElementById(p+'Email').value.trim(),phone:document.getElementById(p+'Phone').value.trim(),
        person:person.value,company:person.value==='pj'?company.value.trim():'',
        mode:mode.value,city:city.value.trim(),state:state.value,
        service:p==='q'?subject.value:document.getElementById('sEquipment').value.trim(),
        message:document.getElementById(p+'Message').value.trim(),
        period:p==='q'?document.getElementById('qPeriod').value.trim():'',
        website:f.querySelector('[name="website"]').value
      };
      var signature=JSON.stringify(payload);
      if(signature!==lastPayload){requestId=window.crypto.randomUUID();lastPayload=signature;}
      payload.requestId=requestId;payload.token=token;
      pending=true;
      var button=f.querySelector('[type="submit"]');var originalLabel=button.textContent;
      button.disabled=true;button.textContent='Enviando…';f.setAttribute('aria-busy','true');
      status.textContent='Enviando sua solicitação…';
      var controller=new AbortController();var timeout=setTimeout(function(){controller.abort();},25000);
      try {
        var response=await fetch('/api/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        var result=await response.json();
        if(!response.ok||!result.sent)throw Error(result.error||'Não foi possível confirmar o envio. Tente novamente ou utilize o WhatsApp.');
        status.textContent='Sua solicitação foi enviada. A NexGuard entrará em contato para entender os próximos passos. Obrigado!';
        f.reset();conditional();requestId=null;lastPayload='';
      }catch(error){status.textContent=error.name==='AbortError'?'Não foi possível confirmar o envio. Seus dados foram mantidos. Tente novamente com os mesmos dados ou utilize o WhatsApp.':error.message;}
      finally {clearTimeout(timeout);pending=false;button.disabled=false;button.textContent=originalLabel;f.removeAttribute('aria-busy');window.turnstile.reset(widgets.get(f));}
    });
  });
  fetch('assets/prices.json').then(function(r){if(!r.ok)throw Error();return r.json();}).then(function(prices){
    if(!prices.approved)return;
    document.getElementById('priceIntro').hidden=true;
    var list=document.getElementById('priceList');
    prices.items.forEach(function(item){var row=document.createElement('div');row.className='price-row';var name=document.createElement('span');name.textContent=item.name;var value=document.createElement('strong');value.textContent='A partir de '+new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(item.value);row.append(name,value);list.appendChild(row);});
  }).catch(function(){});
  function setFieldError(input,hasError){if(hasError)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');}
  /* ---------- Checkup de TI ---------- */
  var QUESTIONS = [
    { area: 'Computadores', service: 'Computadores e notebooks', text: 'Seus computadores funcionam bem, sem lentidão ou travamentos frequentes?' },
    { area: 'Internet e rede', service: 'Redes e infraestrutura', text: 'A internet e a rede permanecem estáveis durante o uso?' },
    { area: 'Contas e acessos', service: 'Microsoft 365 e Google Workspace', text: 'Suas contas e permissões estão organizadas e com acessos conhecidos?' },
    { area: 'Serviços de nuvem', service: 'Microsoft 365 e Google Workspace', text: 'Os arquivos e serviços de nuvem que você utiliza estão organizados?' },
    { area: 'Atualizações e manutenção', service: 'Computadores e notebooks', text: 'Os equipamentos recebem atualizações e manutenção periódica?' },
    { area: 'Rotina de suporte', service: 'Suporte de TI para empresas', text: 'Você consegue trabalhar sem problemas técnicos recorrentes?' }
  ];
  var OPTIONS = [
    { value: 'ok', label: 'Sim' },
    { value: 'part', label: 'Em parte' },
    { value: 'no', label: 'Não sei / Não' }
  ];
  var TAGS = { ok: 'Sim', part: 'Em parte', no: 'Não sei / Não' };

  var ckCard = document.getElementById('ckCard');
  var bands = document.querySelectorAll('#ckShield .ck-band');
  var answers = [];
  var current = 0;

  function paintShield() {
    bands.forEach(function (band, i) {
      band.setAttribute('class', 'ck-band' +
        (answers[i] ? ' is-' + answers[i] : '') +
        (i === current && !answers[i] ? ' is-current' : ''));
    });
  }

  function renderQuestion(moveFocus) {
    var q = QUESTIONS[current];
    var html = '<div class="ck-top"><span class="ck-count">Pergunta ' + (current + 1) + ' de ' + QUESTIONS.length + '</span>' +
      '<span class="ck-area">' + q.area.replace('&', '&amp;') + '</span></div>' +
      '<div class="ck-progress" role="progressbar" aria-label="Progresso do checkup" aria-valuemin="0" aria-valuemax="6" aria-valuenow="' + current + '"><span style="width:' + (current / QUESTIONS.length * 100) + '%"></span></div>' +
      '<h3 class="ck-q" tabindex="-1">' + q.text + '</h3>' +
      '<div class="ck-options">';
    OPTIONS.forEach(function (option) {
      html += '<button type="button" class="ck-option' + (answers[current] === option.value ? ' is-chosen' : '') + '" data-value="' + option.value + '">' +
        option.label + '<svg class="icon" aria-hidden="true"><use href="#i-right"/></svg></button>';
    });
    html += '</div><button type="button" class="ck-back"' + (current === 0 ? ' hidden' : '') + '>Voltar à pergunta anterior</button>';
    ckCard.innerHTML = html;
    paintShield();
    if (moveFocus) ckCard.querySelector('.ck-q').focus({ preventScroll: true });
  }

  function summarize() {
    var points=answers.reduce(function(total,a){return total+({ok:2,part:1,no:0}[a]);},0);
    return {title:points>=10?'Uma boa base para sua rotina.':points>=6?'Alguns ajustes podem ajudar.':'Há pontos que vale avaliar.',
      text:'Pontuação: '+points+' de 12. Sim = 2 pontos; Em parte = 1; Não sei / Não = 0. O resultado reflete apenas suas respostas e indica assuntos para uma conversa inicial.'};
  }

  function orderedResults() {
    var weight = { no: 0, part: 1, ok: 2 };
    return QUESTIONS.map(function (q, i) { return { area: q.area, service:q.service, state: answers[i] }; })
      .sort(function (a, b) { return weight[a.state] - weight[b.state]; });
  }

  function renderResult() {
    current = QUESTIONS.length;
    paintShield();
    var summary = summarize();
    var items = orderedResults();
    var html = '<div class="ck-result"><span class="ck-count">Seu resultado</span>' +
      '<h3 class="ck-q" tabindex="-1">' + summary.title + '</h3><p>' + summary.text + '</p><ul class="ck-list">';
    items.forEach(function (item) {
      html += '<li><span>' + item.area.replace('&', '&amp;') + (item.state !== 'ok' ? '<br><a href="#contato" data-subject="' + item.service + '">' + item.service + '</a>' : '') + '</span><span class="tag tag-' + item.state + '">' + TAGS[item.state] + '</span></li>';
    });
    html += '</ul><div class="ck-actions">' +
      '<button type="button" class="btn btn-primary" id="ckSend">Solicitar atendimento com este resumo<svg class="icon" aria-hidden="true"><use href="#i-ne"/></svg></button>' +
      '<button type="button" class="btn btn-outline" id="ckRestart">Refazer checkup</button></div>' +
      '<p class="ck-fine">Esta é uma orientação inicial e não substitui uma avaliação técnica. Suas respostas só saem desta página se você decidir enviá-las.</p></div>';
    ckCard.innerHTML = html;
    ckCard.querySelector('.ck-q').focus({ preventScroll: true });
  }

  ckCard.addEventListener('click', function (event) {
    var recommendation=event.target.closest('[data-subject]');
    if(recommendation){chooseFlow('quote',false);subject.value=recommendation.dataset.subject;}
    var option = event.target.closest('.ck-option');
    if (option) {
      answers[current] = option.getAttribute('data-value');
      current += 1;
      if (current < QUESTIONS.length) renderQuestion(true);
      else renderResult();
      return;
    }
    if (event.target.closest('.ck-back')) {
      current -= 1;
      renderQuestion(true);
      return;
    }
    if (event.target.closest('#ckRestart')) {
      answers = [];
      current = 0;
      renderQuestion(true);
      return;
    }
    if (event.target.closest('#ckSend')) {
      var lines = QUESTIONS.map(function(q,i){return '- '+q.text+' '+TAGS[answers[i]];});
      chooseFlow('quote',false);
      subject.value = 'Resultado do checkup de TI';
      message.value = 'Fiz o checkup de TI no site e gostaria de conversar sobre o resultado:\n\n' + lines.join('\n');
      setFieldError(message, false);
      document.getElementById('contato').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      nameInput.focus({ preventScroll: true });
    }
  });

  renderQuestion(false);
})();

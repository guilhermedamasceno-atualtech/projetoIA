/**
 * Extrai as conversas de um lote para 01-entrada/<setor>/<lote>/<id>.json,
 * ja limpas, pseudonimizadas e mascaradas. A skill do Claude le esses JSON.
 *
 * Roda na conta que tem a caixa do setor (GmailApp le a caixa de quem executa).
 * Uso: preencher o lote na aba Lotes (status planejado) e rodar extrairLote('LOTE-ID').
 * Lotes grandes: a funcao para antes do limite de 6 min e agenda a continuacao.
 */

var ROTULO_EXTRAIDO = 'IA/Extraido';
var LIMITE_MS = 5 * 60 * 1000;
var POR_PAGINA = 50;

function extrairLote(loteId) {
  var inicio = Date.now();
  var lote = lerLote_(loteId);
  var pasta = pastaLote_(lote.setor, loteId);
  var rotulo = GmailApp.getUserLabelByName(ROTULO_EXTRAIDO) || GmailApp.createLabel(ROTULO_EXTRAIDO);
  var q = 'after:' + lote.inicio.replace(/-/g, '/') + ' before:' + lote.fim.replace(/-/g, '/') +
          ' -label:' + ROTULO_EXTRAIDO.replace('/', '-') + ' -in:spam -in:trash';
  var props = PropertiesService.getScriptProperties();
  var total = Number(props.getProperty('EXTRAIDOS_' + loteId) || 0);
  atualizarLote_(loteId, { status: 'em_execucao' });

  while (Date.now() - inicio < LIMITE_MS) {
    var threads = GmailApp.search(q, 0, POR_PAGINA); // sempre 0: os ja extraidos saem da busca pelo rotulo
    if (!threads.length) {
      props.deleteProperty('EXTRAIDOS_' + loteId);
      apagarContinuacao_();
      atualizarLote_(loteId, { status: 'extraido', nConversas: total, obs: 'extracao concluida em ' + agoraIso_() });
      return total;
    }
    threads.forEach(function (th) {
      var doc = montarConversa_(th, lote);
      if (doc && !existe_(pasta, doc.id + '.json')) {
        pasta.createFile(doc.id + '.json', JSON.stringify(doc, null, 1), 'application/json');
        total++;
      }
      th.addLabel(rotulo);
    });
    props.setProperty('EXTRAIDOS_' + loteId, String(total));
  }
  agendarContinuacao_(loteId);
  atualizarLote_(loteId, { nConversas: total, obs: 'extracao em andamento (' + total + ')' });
  return total;
}

function montarConversa_(th, lote) {
  var msgs = th.getMessages();
  if (!msgs.length) return null;
  var mid0 = msgs[0].getHeader('Message-ID') || msgs[0].getHeader('Message-Id') || ('gmail-' + msgs[0].getId());
  var pessoas = {};

  function reg(end) {
    if (!end || !end.email) return null;
    if (!pessoas[end.email]) {
      var dom = end.email.split('@')[1] || '';
      var id = pseudonimo(end.email, end.nome, lote.setor);
      var org = dom && dom !== cfg_('DOMINIO') ? pseudonimoOrg(dom, lote.setor) : null;
      pessoas[end.email] = { id: id, email: end.email, nome: end.nome, origem: dom === cfg_('DOMINIO') ? 'interno' : 'externo', org: org, papelSugerido: '' };
    }
    return pessoas[end.email].id;
  }

  var mensagens = msgs.map(function (m) {
    var de = reg(parseEndereco_(m.getFrom()));
    var para = listaEnderecos_(m.getTo()).map(reg);
    var cc = listaEnderecos_(m.getCc()).map(reg);
    return {
      message_id: m.getHeader('Message-ID') || ('gmail-' + m.getId()),
      data: Utilities.formatDate(m.getDate(), 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ssXXX"),
      de: de, para: para, cc: cc,
      assunto: m.getSubject(),
      anexos: m.getAttachments().map(function (a) { return a.getContentType(); }),
      corpoBruto: limparCorpo_(m.getPlainBody())
    };
  });

  var lista = Object.keys(pessoas).map(function (k) { return pessoas[k]; });
  var alertas = [];
  mensagens.forEach(function (m) {
    var r = mascarar_(trocarParticipantes_(m.corpoBruto, lista));
    m.corpo = r.texto;
    m.assunto = mascarar_(trocarParticipantes_(m.assunto, lista)).texto;
    delete m.corpoBruto;
    r.alertas.forEach(function (a) { if (alertas.indexOf(a) < 0) alertas.push(a); });
  });

  return {
    id: idConversa_(mid0),
    versao_extrator: 1,
    codigo_setor: lote.setor,
    lote_id: lote.id,
    thread_id: th.getId(),
    message_ids: mensagens.map(function (m) { return m.message_id; }),
    caixas_origem: [pseudonimo(Session.getEffectiveUser().getEmail(), '', lote.setor)],
    data_inicio: mensagens[0].data.slice(0, 10),
    data_fim: mensagens[mensagens.length - 1].data.slice(0, 10),
    n_mensagens: mensagens.length,
    alertas_extracao: alertas,
    participantes: lista.map(function (p) { return { id: p.id, origem: p.origem, org: p.org }; }),
    mensagens: mensagens,
    extraido_em: agoraIso_()
  };
}

/* ---------- planilha de controle ---------- */

function lerLote_(loteId) {
  var sh = SpreadsheetApp.openById(cfg_('CONTROLE_ID')).getSheetByName('Lotes');
  var dados = sh.getDataRange().getDisplayValues();
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0] === loteId) {
      return { id: loteId, linha: i + 1, setor: dados[i][1], caixa: dados[i][2], inicio: dados[i][3], fim: dados[i][4], modo: dados[i][5], status: dados[i][6] };
    }
  }
  throw new Error('Lote ' + loteId + ' nao encontrado na aba Lotes.');
}

function atualizarLote_(loteId, campos) {
  var lote = lerLote_(loteId);
  var sh = SpreadsheetApp.openById(cfg_('CONTROLE_ID')).getSheetByName('Lotes');
  if (campos.status) sh.getRange(lote.linha, 7).setValue(campos.status);
  if (campos.status === 'em_execucao' && !sh.getRange(lote.linha, 9).getValue()) {
    sh.getRange(lote.linha, 9, 1, 2).setValues([[Session.getEffectiveUser().getEmail() + ' (extrator)', agoraIso_()]]);
  }
  if (campos.nConversas !== undefined) sh.getRange(lote.linha, 12).setValue(campos.nConversas);
  if (campos.obs) sh.getRange(lote.linha, 21).setValue(campos.obs);
}

/* ---------- Drive ---------- */

function pastaLote_(setor, loteId) {
  var raiz = DriveApp.getFolderById(cfg_('ENTRADA_ID'));
  return subpasta_(subpasta_(raiz, setor), loteId);
}

function subpasta_(pai, nome) {
  var it = pai.getFoldersByName(nome);
  return it.hasNext() ? it.next() : pai.createFolder(nome);
}

function existe_(pasta, nome) {
  return pasta.getFilesByName(nome).hasNext();
}

/* ---------- continuacao automatica ---------- */

function agendarContinuacao_(loteId) {
  apagarContinuacao_();
  PropertiesService.getScriptProperties().setProperty('LOTE_EM_ANDAMENTO', loteId);
  ScriptApp.newTrigger('continuarExtracao').timeBased().after(60 * 1000).create();
}

function apagarContinuacao_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'continuarExtracao') ScriptApp.deleteTrigger(t);
  });
  PropertiesService.getScriptProperties().deleteProperty('LOTE_EM_ANDAMENTO');
}

function continuarExtracao() {
  var loteId = PropertiesService.getScriptProperties().getProperty('LOTE_EM_ANDAMENTO');
  if (loteId) extrairLote(loteId);
}

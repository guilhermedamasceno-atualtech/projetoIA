/**
 * Auditoria da planilha "Controle - Triagem de e-mails".
 *
 * Instalar: Extensoes > Apps Script (na propria planilha), colar este arquivo,
 * salvar e rodar instalarGatilhos() uma vez. Depois usar o menu "IA Interna".
 *
 * O que faz:
 * - Registra toda edicao na aba Log (quem, quando, celula, antes, depois).
 * - Preenche as colunas *_por / *_em com o e-mail de quem mudou o status.
 * - Bloqueia aprovacao do lote por quem executou o lote (dupla checagem).
 * - Bloqueia aprovacao de lote com revisoes pendentes.
 */

var ABA = {
  TAXONOMIA: 'Taxonomia',
  LOTES: 'Lotes',
  REVISOES: 'Revisoes',
  DECISOES: 'Decisoes',
  LOG: 'Log'
};

// colunas 1-based
var COL = {
  TAX: { status: 5, propostoPor: 6, propostoEm: 7, aprovadoPor: 8, aprovadoEm: 9, assunto: 2 },
  LOT: { loteId: 1, status: 7, executadoPor: 9, revisadoPor: 15, revisadoEm: 16, aprovadoPor: 17, aprovadoEm: 18 },
  REV: { loteId: 2, decisao: 5, revisor: 8, revisadoEm: 9 },
  DEC: { status: 5, aprovadoPor: 6, aprovadoEm: 7 }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IA Interna')
    .addItem('Instalar gatilhos de auditoria', 'instalarGatilhos')
    .addToUi();
}

function instalarGatilhos() {
  var ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'registrarEdicao') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('registrarEdicao').forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getUi().alert('Gatilho de auditoria instalado.');
}

function agora_() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function usuario_(e) {
  var email = '';
  try { email = e.user ? e.user.getEmail() : ''; } catch (err) {}
  if (!email) { try { email = Session.getActiveUser().getEmail(); } catch (err2) {} }
  return email || 'desconhecido';
}

function registrarEdicao(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  var nome = sh.getName();
  if (nome === ABA.LOG) return;

  var quem = usuario_(e);
  var quando = agora_();
  var linha = e.range.getRow();
  var coluna = e.range.getColumn();
  var multi = e.range.getNumRows() > 1 || e.range.getNumColumns() > 1;

  var log = SpreadsheetApp.getActive().getSheetByName(ABA.LOG);
  log.appendRow([quando, quem, nome, e.range.getA1Notation(),
    multi ? '(varias celulas)' : (e.oldValue === undefined ? '' : String(e.oldValue)),
    multi ? '(varias celulas)' : (e.value === undefined ? '' : String(e.value))]);

  if (linha < 2 || multi) return;
  var valor = e.value === undefined ? '' : String(e.value);

  if (nome === ABA.TAXONOMIA) {
    if (coluna === COL.TAX.assunto && valor && !sh.getRange(linha, COL.TAX.propostoPor).getValue()) {
      sh.getRange(linha, COL.TAX.propostoPor, 1, 2).setValues([[quem, quando]]);
      if (!sh.getRange(linha, COL.TAX.status).getValue()) sh.getRange(linha, COL.TAX.status).setValue('proposto');
    }
    if (coluna === COL.TAX.status && (valor === 'aprovado' || valor === 'rejeitado' || valor === 'obsoleto')) {
      sh.getRange(linha, COL.TAX.aprovadoPor, 1, 2).setValues([[quem, quando]]);
    }
  }

  if (nome === ABA.DECISOES && coluna === COL.DEC.status && (valor === 'aprovado' || valor === 'rejeitado')) {
    sh.getRange(linha, COL.DEC.aprovadoPor, 1, 2).setValues([[quem, quando]]);
  }

  if (nome === ABA.REVISOES && coluna === COL.REV.decisao && valor) {
    sh.getRange(linha, COL.REV.revisor, 1, 2).setValues([[quem, quando]]);
  }

  if (nome === ABA.LOTES && coluna === COL.LOT.status) {
    if (valor === 'em_revisao') {
      sh.getRange(linha, COL.LOT.revisadoPor, 1, 2).setValues([[quem, quando]]);
    }
    if (valor === 'aprovado_aplicar') {
      var executor = String(sh.getRange(linha, COL.LOT.executadoPor).getValue()).toLowerCase();
      var loteId = String(sh.getRange(linha, COL.LOT.loteId).getValue());
      var motivo = '';
      if (executor && executor.indexOf(quem.toLowerCase()) === 0) {
        motivo = 'quem executou o lote nao pode aprova-lo';
      } else if (revisoesPendentes_(loteId) > 0) {
        motivo = 'ha ' + revisoesPendentes_(loteId) + ' revisoes sem decisao neste lote';
      }
      if (motivo) {
        e.range.setValue(e.oldValue || 'em_revisao');
        log.appendRow([agora_(), quem, nome, e.range.getA1Notation(), valor, 'BLOQUEADO: ' + motivo]);
        SpreadsheetApp.getActive().toast('Aprovacao bloqueada: ' + motivo, 'IA Interna', 10);
        return;
      }
      sh.getRange(linha, COL.LOT.aprovadoPor, 1, 2).setValues([[quem, quando]]);
    }
  }
}

function revisoesPendentes_(loteId) {
  var sh = SpreadsheetApp.getActive().getSheetByName(ABA.REVISOES);
  var n = sh.getLastRow();
  if (n < 2) return 0;
  var dados = sh.getRange(2, 1, n - 1, COL.REV.decisao).getValues();
  return dados.filter(function (r) { return String(r[COL.REV.loteId - 1]) === loteId && !r[COL.REV.decisao - 1]; }).length;
}

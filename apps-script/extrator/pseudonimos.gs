/**
 * Pseudonimos estaveis. Mesmo e-mail -> mesmo codigo, sempre, para toda a equipe.
 * O SAL so existe nas propriedades deste projeto.
 */

function hex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function sha256Hex_(texto) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8));
}

/** ID estavel da conversa: 8 primeiros hex do SHA-256 do Message-ID da 1a mensagem (sem sal). */
function idConversa_(messageId) {
  return sha256Hex_(String(messageId).trim().toLowerCase()).slice(0, 8);
}

function ehCaixaFuncional_(email) {
  var local = email.split('@')[0];
  var dom = email.split('@')[1] || '';
  if (dom !== cfg_('DOMINIO')) return false;
  if (CAIXAS_FUNCIONAIS.indexOf(local) >= 0) return true;
  // Padrao da empresa: pessoa = nome.sobrenome@. Sem ponto = caixa de setor, agencia ou unidade.
  return local.indexOf('.') < 0;
}

/**
 * Retorna o pseudonimo de um e-mail (PES-xxxxxx), dominio externo (ORG-xxxxxx)
 * ou caixa funcional interna (caixa:nome). Registra no mapa se for novo.
 */
function pseudonimo(email, nomeExibido, setor) {
  email = String(email || '').trim().toLowerCase();
  if (!email) return '[pessoa]';
  if (ehCaixaFuncional_(email)) return 'caixa:' + email.split('@')[0];
  var cod = 'PES-' + sha256Hex_(cfg_('SAL') + email).slice(0, 6);
  registrarNoMapa_(cod, 'pessoa', email, nomeExibido, setor);
  return cod;
}

function pseudonimoOrg(dominio, setor) {
  dominio = String(dominio || '').trim().toLowerCase();
  var cod = 'ORG-' + sha256Hex_(cfg_('SAL') + dominio).slice(0, 6);
  registrarNoMapa_(cod, 'organizacao', dominio, '', setor);
  return cod;
}

var cacheMapa_ = null;

function registrarNoMapa_(cod, tipo, valor, nome, setor) {
  var sh = SpreadsheetApp.openById(cfg_('MAPA_ID')).getSheetByName('Mapa');
  if (!cacheMapa_) {
    cacheMapa_ = {};
    var n = sh.getLastRow();
    if (n > 1) sh.getRange(2, 1, n - 1, 7).getValues().forEach(function (r, i) { cacheMapa_[r[0]] = { linha: i + 2, setores: String(r[6]) }; });
  }
  var item = cacheMapa_[cod];
  if (!item) {
    var origem = tipo === 'pessoa' ? (valor.split('@')[1] === cfg_('DOMINIO') ? 'interno' : 'externo') : 'externo';
    sh.appendRow([cod, tipo, valor, nome || '', origem, agoraIso_(), setor || '']);
    cacheMapa_[cod] = { linha: sh.getLastRow(), setores: setor || '' };
  } else if (setor && item.setores.split(',').indexOf(setor) < 0) {
    item.setores = item.setores ? item.setores + ',' + setor : setor;
    sh.getRange(item.linha, 7).setValue(item.setores);
  }
}

function agoraIso_() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ssXXX");
}

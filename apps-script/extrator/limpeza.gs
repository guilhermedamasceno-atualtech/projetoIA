/**
 * Limpeza e mascaramento do corpo dos e-mails. Tudo deterministico (regex).
 * O que sobrar de nome proprio no texto a skill troca por [pessoa].
 */

var RE_AVISO_LGPD = /Este e-mail cont[eé]m informa[cç][oõ]es confidenciais[\s\S]*$/i;
var RE_CITACAO_INICIO = /^(Em .{5,120}escreveu:|On .{5,120}wrote:|De: .+|From: .+|-----Original Message-----|_{10,})\s*$/i;

function limparCorpo_(texto) {
  if (!texto) return '';
  // cabecalho de citacao que quebra em 2 linhas: "Em qua., 18 de nov. ... <x@y>\nescreveu:"
  var bruto = String(texto).replace(/\r/g, '')
    .replace(/\n(Em|On) [^\n]{5,200}\n[^\n]{0,80}(escreveu|wrote):[\s\S]*$/i, '');
  var linhas = bruto.split('\n');
  var out = [];
  for (var i = 0; i < linhas.length; i++) {
    var l = linhas[i];
    if (/^\s*>/.test(l)) continue;                       // texto citado
    if (RE_CITACAO_INICIO.test(l.trim())) break;        // inicio do historico citado
    if (/^--\s*$/.test(l)) break;                        // assinatura padrao
    out.push(l);
  }
  var t = out.join('\n').replace(RE_AVISO_LGPD, '');
  t = t.replace(/\[image:[^\]]*\]/gi, '').replace(/\[cid:[^\]]*\]/gi, '');
  t = t.replace(/<https?:\/\/[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/** Mascara dados sensiveis. Retorna {texto, alertas[]}. */
function mascarar_(texto) {
  var alertas = [];
  var t = String(texto || '');
  var antes = t;
  // credenciais: "senha: xxx", "Senha xxx", "password: xxx"
  t = t.replace(/((?:senha|password|pass|pwd)\s*[:=]?\s*)(\S+)/gi, function (m, a) { return a + '[credencial]'; });
  t = t.replace(/((?:usu[aá]rio|login|user)\s*[:=]\s*)(\S+)/gi, function (m, a) { return a + '[usuario]'; });
  t = t.replace(/((?:^|\n)\s*nome(?: completo)?\s*[:=]\s*)([^\n]+)/gi, function (m, a) { return a + '[pessoa]'; });
  if (t !== antes) alertas.push('dado_sensivel');
  var a2 = t;
  t = t.replace(/\b\d{3}\.?\d{3}\.?\d{3}[-.]?\d{2}\b/g, '[cpf]');
  t = t.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[cnpj]');
  t = t.replace(/(\+?55\s?)?\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g, '[telefone]');
  t = t.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[email]');
  if (t !== a2 && alertas.indexOf('dado_sensivel') < 0 && /\[cpf\]|\[cnpj\]/.test(t)) alertas.push('dado_sensivel');
  return { texto: t, alertas: alertas };
}

/** Troca nomes e e-mails conhecidos dos participantes pelos pseudonimos. */
function trocarParticipantes_(texto, participantes) {
  var t = String(texto || '');
  participantes.forEach(function (p) {
    if (p.email) t = t.split(p.email).join(p.id);
    if (p.nome && p.nome.length >= 4) {
      var partes = p.nome.split(/\s+/).filter(function (x) { return x.length >= 3; });
      var completo = new RegExp(escapeRe_(p.nome), 'gi');
      t = t.replace(completo, p.id);
      if (partes.length) t = t.replace(new RegExp('\\b' + escapeRe_(partes[0]) + '\\b', 'g'), p.id);
    }
  });
  return t;
}

function escapeRe_(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/** "Nome Sobrenome <a@b.com>" -> {nome, email} */
function parseEndereco_(s) {
  s = String(s || '').trim();
  var m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { nome: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { nome: '', email: s.toLowerCase() };
}

function listaEnderecos_(s) {
  if (!s) return [];
  return String(s).split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(parseEndereco_).filter(function (x) { return x.email; });
}

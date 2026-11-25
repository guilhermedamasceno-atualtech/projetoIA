/**
 * IA Interna - Extrator (projeto Apps Script standalone, fica em "IA Interna - Restrito").
 *
 * Configuracao em Propriedades do script (Configuracoes do projeto > Propriedades do script):
 *   SAL            segredo dos pseudonimos. Definido uma vez, NUNCA alterar depois.
 *   MAPA_ID        id da planilha "Mapa de pseudonimos (RESTRITO)"
 *   CONTROLE_ID    id da planilha "Controle - Triagem de e-mails"
 *   ENTRADA_ID     id da pasta "IA Interna/01-entrada"
 *   DOMINIO        dominio interno, ex.: atualcargas.com.br
 *
 * Rode configurarUmaVez() uma vez, preenchendo os valores abaixo, e depois
 * APAGUE o valor do SAL deste arquivo (ele fica so nas propriedades).
 */

function configurarUmaVez() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('SAL')) throw new Error('SAL ja configurado. Nao sobrescrever: mudaria todos os pseudonimos.');
  p.setProperties({
    SAL: 'COLE_AQUI_UM_SEGREDO_LONGO_E_ALEATORIO',
    MAPA_ID: '1hhBBi38GERQ8lUj3DYQwk_bHJidwBPuHO40UzZe6Agw',
    CONTROLE_ID: '1kmA1L_Bu_irRnTqN1KSvcdlTd-_s8Yure5YCjRuYqJg',
    ENTRADA_ID: '1tLAmqNhZGi0XPqbgTsWrT3DFf6i72dTh',
    DOMINIO: 'atualcargas.com.br'
  });
}

function cfg_(chave) {
  var v = PropertiesService.getScriptProperties().getProperty(chave);
  if (!v) throw new Error('Propriedade ' + chave + ' nao configurada.');
  return v;
}

/** Caixas funcionais: nao viram PES, viram caixa:<nome>. Ajustar a lista conforme necessario. */
var CAIXAS_FUNCIONAIS = [
  'suporte', 'edi', 'faturamento', 'fiscal', 'tracking', 'juridico', 'pagamentos', 'pagamentos.transferencias',
  'pagamentosagregados', 'gestaoparceirosagentes', 'gerenciamentorisco', 'adicionais', 'lia'
];

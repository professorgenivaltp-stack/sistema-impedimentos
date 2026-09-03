import { WorkOrderRaw } from '../types';

export function generateSampleOperationalData(): WorkOrderRaw[] {
  const cities = ['ASSU', 'PARAU', 'IPANGUACU', 'ALTO DO RODRIGUES', 'ITAJA', 'ANGICOS', 'LAJES', 'PEDRO AVELINO', 'CARNAUBAIS', 'MACAU'];
  const teams = ['ASS011', 'ASS010', 'ASS006', 'ASS003', 'ASS004', 'ASS008', 'ASS002', 'ASS009'];
  const tipos = ['Religação', 'Substituição', 'Ligação Nova', 'Desligamento', 'Acompanhamento', 'Reativação'];
  const servicos: Record<string, string[]> = {
    'Religação': ['Religacao Comercial', 'Religacao no Poste', 'Religacao MT', 'Religacao Solicitada'],
    'Substituição': ['Subst. Equipamento', 'Modificacao de Carga', 'Substituicao de Medidor', 'Alteracao Contratual'],
    'Ligação Nova': ['Ligacao Nova BT', 'Ligacao Nova com Poste', 'Ligacao Provisoria'],
    'Desligamento': ['Baixa de Medidor', 'Desligamento a Pedido', 'Corte por Inadimplencia'],
    'Acompanhamento': ['Recorte no Poste', 'Inspecao Tecnica', 'Acompanhamento de Obras'],
    'Reativação': ['Reativacao Comercial', 'Reativacao com Inspecao'],
  };

  const retornos = [
    'RELIGAÇÃO NO SOLC',
    'MICROGERAÇÃO MOT',
    'RELIGAÇÃO uc encont',
    'LIGAÇÃO NOVA COM',
    'REATIVAÇÃO COM IN',
    'BAIXA DE MEDIDOR',
    'SUBSTITUIÇÃO DE EQ',
    'RECORTE NO POSTE',
    'ALTERAÇÃO CONTRATUAL',
  ];

  const motivos = [
    '',
    '',
    '',
    '',
    '',
    'EM com defeito no ramal',
    'Cliente ausente',
    'Acesso impedido por cerca/cadeado',
    'Padrão fora das normas técnicas',
    'Impedimento por animal agressivo',
  ];

  const baseSerial = 46234.33; // ~01/08/2026
  const data: WorkOrderRaw[] = [];

  for (let i = 0; i < 185; i++) {
    const id = 5648700 + i;
    const notaVal = 4500000000 + (i * 3571) % 500000000;
    const tipo = tipos[i % tipos.length];
    const subServicos = servicos[tipo] || ['Servico Geral'];
    const servico = subServicos[i % subServicos.length];
    const cidade = cities[(i * 3 + 1) % cities.length];
    const equipe = teams[(i * 2) % teams.length];
    const prioridade = i % 15 === 0 ? 1 : 0;
    const tentativa = i % 9 === 0 ? '2ª' : i % 25 === 0 ? '3ª' : '1ª';
    const motivo = i % 8 === 0 ? motivos[i % motivos.length] : '';

    // Serial Excel dates
    const criacaoSerial = +(baseSerial - (i % 14) + (0.3 + (i % 40) * 0.015)).toFixed(5);
    const slaDays = tipo === 'Ligação Nova' ? 5 : tipo === 'Substituição' ? 3 : 1.5;
    const vencimentoSerial = +(criacaoSerial + slaDays).toFixed(5);

    // Exec dates
    const execHour = 8 + (i % 9);
    const execMin = (i * 7) % 60;
    const execSec = (i * 13) % 60;
    const durationMinutes = (i % 12 === 0) ? 140 : 15 + (i * 3) % 45; // outlier on i%12

    const endHour = execHour + Math.floor((execMin + durationMinutes) / 60);
    const endMin = (execMin + durationMinutes) % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const horaExecIni = `${pad(execHour)}:${pad(execMin)}:${pad(execSec)}`;
    const horaExecFim = `${pad(endHour)}:${pad(endMin)}:${pad((execSec + 22) % 60)}`;

    data.push({
      Supervisa: 'ASSU',
      Tipo: tipo,
      Serviço: servico,
      'Criação': criacaoSerial,
      Vencimento: vencimentoSerial,
      Cidade: cidade,
      ID: id,
      Nota: `${(notaVal / 1e9).toFixed(1)}E+09`,
      Prioridade: prioridade,
      Equipe: equipe,
      Retorno: retornos[i % retornos.length],
      'Observação': '',
      DataExecIni: '01/08/2026',
      HoraExecIni: horaExecIni,
      DataExecFim: '01/08/2026',
      HoraExecFim: horaExecFim,
      StatusRetorno: 'VREL',
      Motivo: motivo,
      Latitude: -5.73394 + ((i % 20) - 10) * 0.012,
      Longitude: -37.0592 + ((i % 15) - 7) * 0.015,
      Tentativa: tentativa,
    });
  }

  return data;
}

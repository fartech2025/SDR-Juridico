export type MacroRegiaoPerformance = {
  id: string
  nome: string
  mediaEnem: number
  municipios: Array<{ nome: string; media: number }>
}

export const MEDIA_GERAL = 680

const gerarMunicipios = (base: number, nomes: string[]) =>
  nomes.map((nome, idx, arr) => {
    const ajuste = (idx - (arr.length - 1) / 2) * 6
    const media = Math.max(620, Math.min(780, Math.round(base + ajuste)))
    return { nome, media }
  })

export const MACRO_REGIOES_PERFORMANCE: MacroRegiaoPerformance[] = [
  {
    id: '3105',
    nome: 'Triângulo Mineiro/Alto Paranaíba',
    mediaEnem: 712,
    municipios: gerarMunicipios(712, [
      'Abadia dos Dourados',
      'Água Comprida',
      'Araguari',
      'Araporã',
      'Arapuá',
    ]),
  },
  {
    id: '3106',
    nome: 'Central Mineira',
    mediaEnem: 665,
    municipios: gerarMunicipios(665, [
      'Abaeté',
      'Araújos',
      'Augusto de Lima',
      'Biquinhas',
      'Bom Despacho',
    ]),
  },
  {
    id: '3112',
    nome: 'Zona da Mata',
    mediaEnem: 688,
    municipios: gerarMunicipios(688, [
      'Abre Campo',
      'Acaiaca',
      'Além Paraíba',
      'Alto Caparaó',
      'Alto Rio Doce',
    ]),
  },
  {
    id: '3108',
    nome: 'Vale do Rio Doce',
    mediaEnem: 674,
    municipios: gerarMunicipios(674, [
      'Açucena',
      'Água Boa',
      'Aimorés',
      'Alpercata',
      'Alvarenga',
    ]),
  },
  {
    id: '3109',
    nome: 'Oeste de Minas',
    mediaEnem: 703,
    municipios: gerarMunicipios(703, [
      'Aguanil',
      'Arcos',
      'Bambuí',
      'Bom Sucesso',
      'Camacho',
    ]),
  },
  {
    id: '3104',
    nome: 'Vale do Mucuri',
    mediaEnem: 652,
    municipios: gerarMunicipios(652, [
      'Águas Formosas',
      'Ataléia',
      'Bertópolis',
      'Carlos Chagas',
      'Catuji',
    ]),
  },
  {
    id: '3102',
    nome: 'Norte de Minas',
    mediaEnem: 641,
    municipios: gerarMunicipios(641, [
      'Águas Vermelhas',
      'Berizal',
      'Bocaiúva',
      'Bonito de Minas',
      'Botumirim',
    ]),
  },
  {
    id: '3110',
    nome: 'Sul/Sudoeste de Minas',
    mediaEnem: 721,
    municipios: gerarMunicipios(721, [
      'Aiuruoca',
      'Alagoa',
      'Albertina',
      'Alfenas',
      'Alpinópolis',
    ]),
  },
  {
    id: '3111',
    nome: 'Campo das Vertentes',
    mediaEnem: 694,
    municipios: gerarMunicipios(694, [
      'Alfredo Vasconcelos',
      'Antônio Carlos',
      'Barbacena',
      'Barroso',
      'Capela Nova',
    ]),
  },
  {
    id: '3103',
    nome: 'Jequitinhonha',
    mediaEnem: 638,
    municipios: gerarMunicipios(638, [
      'Almenara',
      'Cachoeira de Pajeú',
      'Angelândia',
      'Araçuaí',
      'Aricanduva',
    ]),
  },
  {
    id: '3107',
    nome: 'Metropolitana de Belo Horizonte',
    mediaEnem: 706,
    municipios: gerarMunicipios(706, [
      'Alvinópolis',
      'Alvorada de Minas',
      'Araçaí',
      'Baldim',
      'Barão de Cocais',
    ]),
  },
  {
    id: '3101',
    nome: 'Noroeste de Minas',
    mediaEnem: 662,
    municipios: gerarMunicipios(662, [
      'Arinos',
      'Bonfinópolis de Minas',
      'Brasilândia de Minas',
      'Buritis',
      'Cabeceira Grande',
    ]),
  },
]

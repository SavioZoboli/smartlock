import { TipoEquipamento } from "../models/equipamento.model";

export const ICONE_TIPO_EQUIPAMENTO_PADRAO = 'devices';

export type CategoriaIconeEquipamento =
  | 'todos'
  | 'computacao'
  | 'audio_video'
  | 'eletronica'
  | 'ferramentas'
  | 'outros';

export interface CategoriaIconeOpcao {
  id: CategoriaIconeEquipamento;
  label: string;
}

export interface IconeSugerido {
  valor: string;
  label: string;
  categoria: Exclude<CategoriaIconeEquipamento, 'todos'>;
  tags: string[];
}

export const CATEGORIAS_ICONES_TIPO_EQUIPAMENTO: readonly CategoriaIconeOpcao[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'computacao', label: 'Computação' },
  { id: 'audio_video', label: 'Áudio & Vídeo' },
  { id: 'eletronica', label: 'Eletrônica & VR' },
  { id: 'ferramentas', label: 'Ferramentas' },
  { id: 'outros', label: 'Outros' },
];

/** Catálogo de ícones do Material Symbols Rounded (todos com <= 20 caracteres). */
export const ICONES_SUGERIDOS_TIPO_EQUIPAMENTO: readonly IconeSugerido[] = [
  // Computação & Periféricos
  { valor: 'laptop_chromebook', label: 'Notebook / Chromebook', categoria: 'computacao', tags: ['notebook', 'laptop', 'chromebook', 'computador'] },
  { valor: 'laptop_mac', label: 'Laptop / MacBook', categoria: 'computacao', tags: ['notebook', 'laptop', 'macbook'] },
  { valor: 'desktop_windows', label: 'Computador Desktop', categoria: 'computacao', tags: ['pc', 'desktop', 'computador', 'monitor'] },
  { valor: 'monitor', label: 'Monitor / Tela', categoria: 'computacao', tags: ['monitor', 'tela', 'display'] },
  { valor: 'tablet', label: 'Tablet', categoria: 'computacao', tags: ['tablet', 'ipad'] },
  { valor: 'smartphone', label: 'Smartphone / Celular', categoria: 'computacao', tags: ['celular', 'smartphone', 'telefone', 'mobile'] },
  { valor: 'devices', label: 'Dispositivo (padrão)', categoria: 'computacao', tags: ['dispositivo', 'equipamento', 'padrao', 'geral'] },
  { valor: 'draw', label: 'Mesa Digitalizadora', categoria: 'computacao', tags: ['mesa digitalizadora', 'wacom', 'desenho', 'caneta', 'tablet grafico'] },
  { valor: 'stylus', label: 'Caneta Stylus', categoria: 'computacao', tags: ['caneta', 'stylus', 'mesa digitalizadora', 'apple pencil'] },
  { valor: 'brush', label: 'Ilustração / Design', categoria: 'computacao', tags: ['desenho', 'ilustracao', 'mesa digitalizadora', 'arte'] },
  { valor: 'keyboard', label: 'Teclado', categoria: 'computacao', tags: ['teclado', 'periferico'] },
  { valor: 'mouse', label: 'Mouse', categoria: 'computacao', tags: ['mouse', 'periferico'] },
  { valor: 'usb', label: 'Pendrive / Adaptador USB', categoria: 'computacao', tags: ['usb', 'pendrive', 'dongle', 'adaptador'] },
  { valor: 'sd_card', label: 'Cartão de Memória / SD', categoria: 'computacao', tags: ['sd', 'cartao', 'memoria', 'armazenamento'] },
  { valor: 'hard_drive', label: 'HD Externo / SSD', categoria: 'computacao', tags: ['hd', 'ssd', 'disco', 'armazenamento'] },
  { valor: 'router', label: 'Roteador / Rede', categoria: 'computacao', tags: ['roteador', 'wifi', 'rede', 'switch'] },
  { valor: 'hub', label: 'Hub / Switch', categoria: 'computacao', tags: ['hub', 'switch', 'rede', 'adaptador'] },
  { valor: 'print', label: 'Impressora / 3D', categoria: 'computacao', tags: ['impressora', '3d', 'imprimir'] },
  { valor: 'scanner', label: 'Scanner / Leitor', categoria: 'computacao', tags: ['scanner', 'leitor', 'codigo de barras'] },
  { valor: 'watch', label: 'Smartwatch / Relógio', categoria: 'computacao', tags: ['relogio', 'smartwatch', 'wearable'] },
  { valor: 'tv', label: 'TV / Tela Interativa', categoria: 'computacao', tags: ['tv', 'televisao', 'tela'] },
  { valor: 'cast', label: 'Projetor / Espelhamento', categoria: 'computacao', tags: ['projetor', 'datashow', 'chromecast', 'apresentacao'] },

  // Áudio & Vídeo
  { valor: 'mic', label: 'Microfone', categoria: 'audio_video', tags: ['microfone', 'audio', 'voz', 'gravacao', 'lapela'] },
  { valor: 'podcasts', label: 'Microfone Condensador / Podcast', categoria: 'audio_video', tags: ['microfone', 'podcast', 'estudio', 'condensador', 'audio'] },
  { valor: 'headphones', label: 'Fone de Ouvido', categoria: 'audio_video', tags: ['fone', 'headphone', 'audio', 'som'] },
  { valor: 'headset_mic', label: 'Headset com Microfone', categoria: 'audio_video', tags: ['headset', 'fone', 'microfone', 'chamada'] },
  { valor: 'earbuds', label: 'Fone Intra-auricular', categoria: 'audio_video', tags: ['fone', 'earbuds', 'bluetooth', 'audio'] },
  { valor: 'speaker', label: 'Caixa de Som', categoria: 'audio_video', tags: ['caixa de som', 'alto falante', 'audio', 'musica'] },
  { valor: 'graphic_eq', label: 'Mesa de Som / Interface de Áudio', categoria: 'audio_video', tags: ['mesa de som', 'interface', 'equalizador', 'audio'] },
  { valor: 'photo_camera', label: 'Câmera Fotográfica', categoria: 'audio_video', tags: ['camera', 'foto', 'fotografia', 'dslr'] },
  { valor: 'videocam', label: 'Filmadora / Câmera de Vídeo', categoria: 'audio_video', tags: ['filmadora', 'video', 'camera', 'gravacao'] },
  { valor: 'video_camera_front', label: 'Webcam', categoria: 'audio_video', tags: ['webcam', 'camera', 'videochamada', 'streaming'] },
  { valor: 'flashlight_on', label: 'Iluminador / Lanterna', categoria: 'audio_video', tags: ['luz', 'iluminador', 'ring light', 'lanterna', 'led'] },
  { valor: 'lightbulb', label: 'Iluminação / LED', categoria: 'audio_video', tags: ['lampada', 'iluminacao', 'led', 'estudio'] },
  { valor: 'movie', label: 'Claquete / Produção de Vídeo', categoria: 'audio_video', tags: ['video', 'cinema', 'producao', 'claquete'] },
  { valor: 'music_note', label: 'Instrumento / Áudio', categoria: 'audio_video', tags: ['musica', 'instrumento', 'som'] },

  // Eletrônica, Robótica & VR
  { valor: 'memory', label: 'Microcontrolador / Chip', categoria: 'eletronica', tags: ['eletronica', 'chip', 'microcontrolador', 'arduino', 'esp32', 'circuito'] },
  { valor: 'developer_board', label: 'Placa Eletrônica / Arduino', categoria: 'eletronica', tags: ['eletronica', 'placa', 'arduino', 'raspberry', 'protoboard', 'maker'] },
  { valor: 'electrical_services', label: 'Material Elétrico / Eletrônica', categoria: 'eletronica', tags: ['eletrica', 'eletronica', 'cabo', 'fio', 'tomada'] },
  { valor: 'cable', label: 'Cabo / Conector', categoria: 'eletronica', tags: ['cabo', 'fio', 'carregador', 'conector', 'usb'] },
  { valor: 'settings_input_hdmi', label: 'Cabo / Adaptador HDMI', categoria: 'eletronica', tags: ['hdmi', 'cabo', 'adaptador', 'video'] },
  { valor: 'power', label: 'Fonte / Tomada', categoria: 'eletronica', tags: ['fonte', 'energia', 'tomada', 'carregador'] },
  { valor: 'bolt', label: 'Multímetro / Energia', categoria: 'eletronica', tags: ['energia', 'eletronica', 'multimetro', 'voltagem', 'teste'] },
  { valor: 'battery_full', label: 'Bateria / Powerbank', categoria: 'eletronica', tags: ['bateria', 'pilha', 'powerbank', 'carregador'] },
  { valor: 'sensors', label: 'Sensor / Módulo IoT', categoria: 'eletronica', tags: ['sensor', 'iot', 'eletronica', 'modulo', 'automacao'] },
  { valor: 'smart_toy', label: 'Kit Educacional / Robótica', categoria: 'eletronica', tags: ['kit', 'robotica', 'educacional', 'lego', 'robo'] },
  { valor: 'robot_2', label: 'Robô / Automação', categoria: 'eletronica', tags: ['robo', 'robotica', 'automacao', 'drone'] },
  { valor: 'head_mounted_device', label: 'Óculos de Realidade Virtual', categoria: 'eletronica', tags: ['vr', 'oculos', 'realidade virtual', 'quest', 'metaverso'] },
  { valor: 'view_in_ar', label: 'Realidade Aumentada / 3D', categoria: 'eletronica', tags: ['ar', '3d', 'realidade aumentada', 'scanner 3d'] },
  { valor: 'science', label: 'Laboratório / Ciências', categoria: 'eletronica', tags: ['ciencia', 'laboratorio', 'quimica', 'experimento'] },
  { valor: 'biotech', label: 'Microscópio / Biotecnologia', categoria: 'eletronica', tags: ['microscopio', 'biologia', 'laboratorio', 'ciencia'] },
  { valor: 'thermostat', label: 'Termômetro / Medição', categoria: 'eletronica', tags: ['termometro', 'temperatura', 'medicao', 'sensor'] },
  { valor: 'wifi', label: 'Adaptador Wi-Fi', categoria: 'eletronica', tags: ['wifi', 'wireless', 'antena', 'rede'] },
  { valor: 'bluetooth', label: 'Dispositivo Bluetooth', categoria: 'eletronica', tags: ['bluetooth', 'sem fio', 'adaptador'] },
  { valor: 'nfc', label: 'Leitor NFC / RFID', categoria: 'eletronica', tags: ['nfc', 'rfid', 'tag', 'leitor'] },

  // Ferramentas & Oficina
  { valor: 'build', label: 'Chave / Ferramenta', categoria: 'ferramentas', tags: ['ferramenta', 'chave', 'manutencao', 'oficina'] },
  { valor: 'construction', label: 'Kit de Ferramentas', categoria: 'ferramentas', tags: ['ferramenta', 'construcao', 'oficina', 'maker'] },
  { valor: 'handyman', label: 'Manutenção / Reparo', categoria: 'ferramentas', tags: ['ferramenta', 'reparo', 'manutencao', 'chave de fenda'] },
  { valor: 'carpenter', label: 'Marcenaria / Serra', categoria: 'ferramentas', tags: ['marcenaria', 'serra', 'madeira', 'oficina'] },
  { valor: 'hardware', label: 'Martelo / Ferragem', categoria: 'ferramentas', tags: ['martelo', 'ferragem', 'ferramenta'] },
  { valor: 'architecture', label: 'Compasso / Desenho Técnico', categoria: 'ferramentas', tags: ['compasso', 'desenho', 'arquitetura', 'engenharia'] },
  { valor: 'straighten', label: 'Régua / Trena / Paquímetro', categoria: 'ferramentas', tags: ['regua', 'trena', 'paquimetro', 'medicao'] },
  { valor: 'design_services', label: 'Design / Prototipagem', categoria: 'ferramentas', tags: ['design', 'prototipagem', 'maker', 'lapis'] },
  { valor: 'content_cut', label: 'Tesoura / Corte', categoria: 'ferramentas', tags: ['tesoura', 'estilete', 'corte', 'alicate'] },
  { valor: 'engineering', label: 'Engenharia / EPI', categoria: 'ferramentas', tags: ['engenharia', 'epi', 'capacete', 'seguranca'] },

  // Outros
  { valor: 'school', label: 'Material Educacional', categoria: 'outros', tags: ['escola', 'educacao', 'ensino', 'aula'] },
  { valor: 'menu_book', label: 'Livro / Manual', categoria: 'outros', tags: ['livro', 'apostila', 'manual', 'leitura'] },
  { valor: 'calculate', label: 'Calculadora', categoria: 'outros', tags: ['calculadora', 'matematica', 'cientifica'] },
  { valor: 'palette', label: 'Artes / Pintura', categoria: 'outros', tags: ['arte', 'pintura', 'cores', 'criativo'] },
  { valor: 'backpack', label: 'Mochila / Bolsa', categoria: 'outros', tags: ['mochila', 'bolsa', 'case', 'transporte'] },
  { valor: 'work', label: 'Maleta / Estojo', categoria: 'outros', tags: ['maleta', 'estojo', 'kit', 'case'] },
  { valor: 'inventory_2', label: 'Caixa / Kit Geral', categoria: 'outros', tags: ['caixa', 'kit', 'estoque', 'material'] },
  { valor: 'extension', label: 'Módulo / Peças', categoria: 'outros', tags: ['modulo', 'peca', 'encaixe', 'kit'] },
  { valor: 'sports_esports', label: 'Controle / Gamepad', categoria: 'outros', tags: ['controle', 'joystick', 'gamepad', 'jogo'] },
  { valor: 'key', label: 'Chave / Acesso', categoria: 'outros', tags: ['chave', 'acesso', 'sala', 'armario'] },
  { valor: 'lock', label: 'Cadeado / Trava', categoria: 'outros', tags: ['cadeado', 'trava', 'seguranca'] },
  { valor: 'badge', label: 'Crachá / Cartão', categoria: 'outros', tags: ['cracha', 'cartao', 'identificacao'] },
  { valor: 'category', label: 'Categoria / Diversos', categoria: 'outros', tags: ['categoria', 'outros', 'diversos'] },
];

export const TIPO_EQUIPAMENTOS: readonly TipoEquipamento[] = [
    {descricao:"Notebook",icone:'laptop_chromebook'},
    {descricao:"Óculos de Realidade Virtual",icone:'head_mounted_device'},
    {descricao:"Kit Educacional",icone:'smart_toy'},
    {descricao:"Tablet",icone:'tablet'}
]

export function obterIconeTipoEquipamento(
  tipo?: string | null,
  iconeBanco?: string | null,
): string {
  if (typeof iconeBanco === 'string' && iconeBanco.trim().length > 0) {
    return iconeBanco.trim();
  }
  return (
    TIPO_EQUIPAMENTOS.find((t) => t.descricao === tipo)?.icone ??
    ICONE_TIPO_EQUIPAMENTO_PADRAO
  );
}
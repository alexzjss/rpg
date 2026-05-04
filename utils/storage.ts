
const PREFIX = 'rpg_master_v1_';

export const DataManager = {
  save: (key: string, data: any) => {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(data));
      console.log(`[DataManager] Dados salvos com sucesso: ${key}`);
    } catch (e) {
      console.error(`[DataManager] Erro ao salvar ${key}:`, e);
    }
  },

  load: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(`${PREFIX}${key}`);
      if (stored === null) {
        console.log(`[DataManager] Armazenamento vazio para ${key}. Inicializando...`);
        // Salva o valor padrão apenas se for a primeira vez
        localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(defaultValue));
        return defaultValue;
      }
      console.log(`[DataManager] Dados carregados para ${key}`);
      return JSON.parse(stored);
    } catch (e) {
      console.error(`[DataManager] Erro ao carregar ${key}:`, e);
      return defaultValue;
    }
  },

  // Funções específicas conforme solicitado
  loadCharacters: () => DataManager.load<any[]>('characters', []),
  saveCharacters: (data: any[]) => DataManager.save('characters', data),
  
  loadCards: () => DataManager.load<any[]>('cards', []),
  saveCards: (data: any[]) => DataManager.save('cards', data),
  
  loadCombatState: () => DataManager.load<any>('combat', {
    isActive: false, 
    round: 1, 
    turnIndex: 0, 
    combatants: [], 
    history: [], 
    fieldConditions: [], 
    backgroundImage: '', 
    globalBonus: 0
  }),
  saveCombatState: (data: any) => DataManager.save('combat', data),

  loadJourneyState: () => DataManager.load<any>('journey', {
    locationName: 'Desconhecido',
    description: '',
    image: '',
    weather: 'sunny',
    notes: ''
  }),
  saveJourneyState: (data: any) => DataManager.save('journey', data)
};

export const saveToLocal = DataManager.save;
export const getFromLocal = DataManager.load;
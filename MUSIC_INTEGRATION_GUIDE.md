# 🎵 YouTube Music Integration Guide

## Visão Geral
Este app agora possui integração com YouTube Music, permitindo pausar, controlar volume e gerenciar uma playlist de músicas durante o uso da aplicação.

## Features Implementadas

### ✅ Controles de Reprodução
- ▶️ Play/Pause
- ⏭️ Próxima faixa
- ⏮️ Faixa anterior
- 🔊 Controle de volume
- ⏱️ Barra de progresso com busca

### ✅ Gerenciamento de Playlist
- Adicionar músicas do YouTube Music
- Visualizar lista de reprodução
- Remover faixas da playlist
- Limpar toda a playlist
- Visualizar informações da faixa (título, artista, duração)

### ✅ Interface
- Player compacto na parte inferior
- Modal para buscar e adicionar músicas
- Controles intuitivos com ícones
- Responsive design

## Setup e Configuração

### 1. Obter API Key do YouTube

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a **YouTube Data API v3**
4. Crie uma chave de API (credencial tipo "Chave de API")
5. Copie a chave

### 2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env e adicione sua chave
VITE_YOUTUBE_API_KEY=sua_chave_aqui
```

### 3. Instalar Dependências
As dependências já estão configuradas. Apenas execute:
```bash
npm install
```

### 4. Iniciar o App
```bash
npm run dev
```

## Como Usar

### Abrindo o Player
1. Clique no ícone 🎵 no canto inferior direito
2. O player será exibido com controles

### Adicionando Músicas
1. Clique no botão ➕ (Adicionar música)
2. Procure pelo nome da música ou artista
3. Clique em ➕ na música desejada
4. A música será adicionada à playlist

### Reproduzindo Músicas
1. Clique em ▶️ para iniciar a reprodução
2. Use ⏭️ e ⏮️ para navegar
3. Ajuste o volume com o controle deslizante
4. Use a barra de progresso para buscar em uma faixa

### Gerenciando Playlist
1. Clique no número da playlist para visualizar
2. Clique em 🗑️ para remover uma faixa individual
3. Clique em 🗑️ no player para limpar toda a playlist

## Arquitetura

### Componentes Criados

#### `contexts/MusicContext.tsx`
- Context API para gerenciamento de estado centralizado
- Hook `useMusic()` para acessar funcionalidades
- Controle de volume, reprodução, índice de faixa atual

#### `components/MusicPlayer.tsx`
- Interface visual do player
- Controles de play/pause, volume, navegação
- Visualização de playlist
- Gerenciamento de UI

#### `components/AddMusicModal.tsx`
- Modal para buscar músicas
- Interface de busca
- Exibição de resultados com thumbnails
- Adição à playlist

#### `components/YouTubeEmbed.tsx`
- Integração com YouTube IFrame API
- Sincronização de estado com controls
- Gerenciamento do player do YouTube

#### `utils/youtubeMusic.ts`
- Service para comunicação com YouTube Data API
- Busca de músicas
- Obtenção de detalhes de faixas
- Fallback com dados mock quando API não está configurada

### State Management
```
MusicContext (Root)
├── isPlaying: boolean
├── currentTrack: Track | null
├── playlist: Track[]
├── currentIndex: number
├── volume: number (0-100)
├── isPlayerVisible: boolean
├── currentTime: number
└── playerRef: YouTube Player instance
```

## API YouTube

### Endpoints Utilizados
- **search**: Busca vídeos de música
- **videos**: Obtém detalhes (duração, thumbnails)

### Quotas
- Limite padrão: 10.000 créditos/dia
- Cada busca: ~100 créditos
- Suficiente para ~100 buscas por dia

## Dados Mock

Se não configurar a API key, o app funcionará com dados mock:
- Rick Astley - Never Gonna Give You Up
- Me at the zoo
- Luis Fonsi - Despacito

Útil para desenvolvimento e testes!

## Estrutura de Arquivos
```
rpg/
├── contexts/
│   └── MusicContext.tsx          (State management)
├── components/
│   ├── MusicPlayer.tsx            (UI do player)
│   ├── AddMusicModal.tsx           (Modal de busca)
│   └── YouTubeEmbed.tsx            (YouTube integration)
├── utils/
│   ├── youtubeMusic.ts             (YouTube API service)
│   ├── database.ts
│   └── dice.ts
├── .env.example                    (Template de env)
└── index.tsx                       (Wrap com MusicProvider)
```

## Funcionalidades Futuras (Opcional)

- [ ] Persistência de playlist no localStorage
- [ ] Histórico de músicas reproduzidas
- [ ] Botão de like/favoritos
- [ ] Shuffle e repeat
- [ ] Sincronização com conta YouTube
- [ ] Playlists salvas do YouTube
- [ ] Equalizador visual
- [ ] Dark/Light mode para player

## Troubleshooting

### "YouTube API key not configured"
- ✅ Verifique se `.env` foi criado corretamente
- ✅ Confirme que a chave foi copiada corretamente
- ✅ Reinicie o servidor de desenvolvimento

### Nenhuma música encontrada
- ✅ Verifique ortografia da busca
- ✅ Tente buscar por artista ao invés de música específica
- ✅ A API retorna resultados em inglês por padrão

### Player não aparece
- ✅ Clique no ícone 🎵 no canto inferior direito
- ✅ Verifique se há músicas na playlist

### Volume não funciona
- ✅ O YouTube Player pode ter restrições dependendo do navegador
- ✅ Tente recarregar a página

## Notas de Desenvolvimento

- O YouTube Player é renderizado como um iframe oculto
- Controles sincronizam via YouTube IFrame API
- Context é inicializado quando a app carrega
- Mock data permite teste sem API key

## Licença
Veja LICENSE para detalhes.

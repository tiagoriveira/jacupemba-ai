# Fluxo do Usuário e Arquitetura de Frontend - Assistente Local Jacupemba

Este documento descreve o fluxo de interação do usuário e as decisões de arquitetura para o aplicativo "Assistente Local Jacupemba".

## 1. Tela Principal (Chat)

A tela principal é a interface de chat com o assistente de IA. A UX foi desenhada para ser dinâmica e informativa, guiando o usuário sobre as possibilidades do app.

### 1.1. Componentes da Tela Principal

- **Saudação e Campo de Input:** Mensagem de boas-vindas ("Olá! Como posso ajudar?") seguida pelo campo de texto para o usuário digitar sua pergunta e um botão para upload de imagem.
- **Assuntos do Momento:** Uma seção dinâmica que exibe os tópicos mais comentados no bairro nas últimas 48 horas. 
    - **UX:** Apresentado como "chips" ou "tags" com um ícone de "em alta" (🔥).
    - **Ação:** Ao clicar, o chat inicia automaticamente com um resumo sobre aquele tópico.
    - **Lógica:** Os tópicos são gerados por IA, agrupando relatos de no mínimo 5 usuários diferentes para garantir relevância e privacidade.
- **Categorias de Ajuda:** Uma lista visual e limpa que mostra as formas como o agente pode ajudar (ex: "Indicar Serviços", "Achar Comércio", "Ver Eventos"), usando ícones para facilitar a identificação.

### 1.2. Interação com o Assistente

- **Texto:** O usuário digita sua pergunta e recebe uma resposta gerada pelo modelo de linguagem.
- **Imagem:** O usuário envia uma foto, e o sistema a analisa para recomendar produtos ou serviços locais.

## 2. Vitrine Comercial (Rota `/vitrine`)

Esta é uma seção dedicada a posts comerciais efêmeros, acessada através de um gesto de "swipe" (deslizar para o lado) na tela principal, que redireciona o usuário para a página `/vitrine`.

### 2.1. Funcionalidades da Vitrine

- **Conteúdo Efêmero:** Todas as fotos e vídeos postados na vitrine expiram e são removidos automaticamente após 48 horas.
- **Grid com Scroll Infinito:** A tela exibe um mosaico de posts (estilo Instagram). O conteúdo carrega continuamente conforme o usuário rola a tela.
- **Autoplay de Vídeos:** Vídeos no grid iniciam automaticamente (no mudo) para aumentar o dinamismo.

### 2.2. Visualização de Post

- **Tela Cheia:** Ao clicar em um post, ele se expande para ocupar a tela inteira (estilo TikTok/Reels).
- **Informações Sobrepostas:** Detalhes como título, preço e nome do local aparecem sobrepostos na imagem/vídeo, em uma área com fundo escurecido para garantir a legibilidade.
- **Botão de Contato (WhatsApp):** Um botão minimalista fica visível sobre o post, permitindo que o usuário inicie uma conversa no WhatsApp com o anunciante. A mensagem inicial é pré-formatada: *"Olá, vi seu post no Assistente Local e tenho interesse!"*.

## 3. Fluxo de Conteúdo da Comunidade (Anônimo)

- **Botão "Conte algo do bairro":** Permite ao usuário enviar relatos anônimos sobre o bairro, classificados em categorias (Segurança, Trânsito, etc.).
- **Moderação:** O conteúdo passa por um pipeline de moderação com IA antes de ser usado para alimentar os "Assuntos do Momento".

## 4. Histórico e Privacidade

- O histórico de conversas é salvo localmente no dispositivo do usuário e pode ser acessado e limpo a qualquer momento, garantindo a privacidade.

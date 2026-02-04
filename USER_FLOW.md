# Fluxo do Usuário no Aplicativo Jacupemba AI

Este documento descreve o fluxo de interação do usuário com o aplicativo Jacupemba AI, um assistente de conversação local.

## 1. Tela Inicial e Boas-vindas

Ao abrir o aplicativo, o usuário é recebido com uma tela de boas-vindas que apresenta as seguintes opções:

- **Mensagem de saudação:** "Olá! Como posso ajudar?"
- **Sugestões de perguntas:** Uma lista de perguntas pré-definidas, organizadas por categorias como "Serviços", "Comércio", "Vagas" e "Eventos", cada uma com um ícone representativo. O usuário pode clicar em uma dessas sugestões para iniciar a conversa.
- **Caixa de entrada de texto:** Um campo para o usuário digitar sua própria pergunta.
- **Upload de imagem:** Um botão que permite ao usuário enviar uma foto de um produto ou serviço sobre o qual deseja obter informações.

## 2. Interação com o Assistente

O usuário pode interagir com o assistente de duas maneiras:

- **Enviando uma mensagem de texto:** O usuário digita sua pergunta na caixa de entrada e a envia. A mensagem é processada pelo backend, que utiliza um modelo de linguagem para gerar uma resposta relevante.
- **Enviando uma imagem:** O usuário pode fazer o upload de uma imagem. O sistema é instruído a analisar a imagem, inferir o produto ou serviço relacionado e fornecer recomendações de estabelecimentos ou profissionais locais.

O histórico da conversa é salvo localmente no navegador do usuário, permitindo que ele continue a conversa de onde parou.

## 3. Histórico de Conversas

O usuário pode acessar o histórico de suas conversas anteriores clicando no link "Histórico". Esta página exibe uma lista de todas as interações passadas com o assistente. O usuário também tem a opção de limpar todo o histórico de conversas, se desejar.

## 4. Backend e Lógica de Negócios

A API do backend, localizada em `/api/chat`, é responsável por receber as mensagens do usuário e interagir com o modelo de linguagem (`xai/grok-beta`). O modelo é instruído a atuar como um "Assistente Local", fornecendo informações sobre o bairro e formatando as respostas de maneira clara e amigável. O sistema também está preparado para analisar imagens e fornecer recomendações com base nelas.

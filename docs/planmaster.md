Master Plan de Lapidação e Lançamento: 
Jacupemba AI (Foco Windsurf + MCP)
Este documento serve como um guia mestre para o Windsurf, utilizando sua capacidade de 
agente autônomo e integração MCP com Supabase, para levar o Jacupemba AI ao 
lançamento em produção. Ele consolida todas as funcionalidades discutidas, focando na 
lapidação do frontend e na integração com o backend de forma fluida e eficiente.
1. Contexto e Objetivo
O Jacupemba AI é um assistente local inteligente para o bairro Jacupemba, com um agente 
de IA sarcástico, um feed de relatos e uma vitrine de comércios. O objetivo é refinar as 
funcionalidades existentes, implementar as novas features de avaliação, onboarding, lead 
generation e embaixadores, e preparar o projeto para o lançamento em produção, 
utilizando o Windsurf como principal ferramenta de desenvolvimento e integração.
2. Ferramentas e Ambiente
• 
IDE Principal: Windsurf (com modo Flow ativado)
• 
Controle de Versão: Git (repositório 
• 
Plataforma: Vercel
tiagoriveira/jacupemba-ai )
• 
Banco de Dados: Supabase (com MCP configurado no Windsurf)
• 
Agente de IA: Vercel AI SDK (implementado em 
app/api/chat/route.ts )
3. Tarefas de Lapidação e Implementação (Windsurf Flow)
O Windsurf deve executar as seguintes tarefas, utilizando o MCP para interagir diretamente 
com o Supabase e o contexto do projeto para refinar o frontend e o backend.
3.1. Implementação do Sistema de Avaliação
Objetivo: Permitir que usuários avaliem comércios e o agente de IA, alimentando a 
inteligência do agente e fornecendo feedback.
• 
Frontend (UI):
• 
Avaliação de Comércio: Integrar um pop-up ou card discreto que aparece após o 
usuário interagir com um comércio (ex: clicar no WhatsApp via agente). Este pop-up 
deve conter:
• 
Estrelas (1 a 5) para avaliação quantitativa.
• 
Campo de texto livre (opcional) para feedback qualitativo.
• 
Botão de envio.
• 
Avaliação do Agente: Adicionar um ícone de Thumbs Up/Down ou uma pequena 
barra de estrelas após cada resposta do agente no chat, perguntando: "Essa 
resposta foi útil?".
• 
Backend (Supabase + Agente):
• 
Tabela 
evaluations : Criar uma nova tabela no Supabase para armazenar as 
avaliações, incluindo 
( '
commerce' ou 
user_id , 
'agent' ), 
target_id (comércio ou agente), 
rating (1-5), 
target_type 
comment (texto livre), 
created_at .
• 
API de Avaliação: Criar endpoints para receber e armazenar as avaliações no 
Supabase.
• 
Integração com Agente: O agente deve ser instruído a:
• 
Processar o 
comment das avaliações de comércio para análise de sentimento e 
refinamento de recomendações.
• 
Utilizar a 
rating das avaliações do agente para auto-otimização (feedback loop).
3.2. Implementação do Onboarding para Novos Usuários
Objetivo: Guiar novos usuários sobre o valor e o uso do Jacupemba AI de forma 
minimalista.
• 
Frontend (UI):
• 
Tour Guiado de 3 Passos: Na primeira visita do usuário, exibir um tour discreto:
1. Bem-vindo ao Jacupemba AI: Mensagem de boas-vindas.
2. Pergunte ao Agente: Instruções sobre como interagir com o chat.
3. Explore o Feed/Vitrine: Orientação para as seções de conteúdo.
• 
Persistência: Utilizar 
localStorage ou uma coluna no perfil do usuário no Supabase 
para marcar que o onboarding já foi concluído.
3.3. Implementação da Monetização por Oportunidade (Lead Gen)
Objetivo: Conectar usuários com intenção de serviço a profissionais parceiros via 
WhatsApp.
• 
Agente (Lógica):
• 
Detecção de Intenção: O agente deve identificar frases-chave que indicam 
necessidade de serviço (ex: "preciso de encanador", "onde consertar celular", 
"orçamento para bolo").
• 
Proposta de Conexão: Após detectar a intenção, o agente pergunta: "Encontrei [X] 
profissionais no Jacupemba. Quer que eu envie seu pedido para eles agora?".
• 
Geração de Link WhatsApp: Se o usuário aceitar, o agente gera um link de 
WhatsApp para o profissional parceiro, com uma mensagem pré-preenchida 
informando sobre o lead.
• 
Backend (Supabase):
• 
Tabela 
leads : Criar uma tabela para registrar os leads gerados, incluindo 
professional_id , 
service_requested , 
• 
Tabela 
status (
'pending' , 
'sent' , 
professionals : Adicionar um campo 
user_id , 
'contacted' ), 
created_at .
is_partner (boolean) e 
whatsapp_number 
para identificar profissionais que pagam pela recomendação.
3.4. Implementação do Status de Embaixador
Objetivo: Incentivar a criação de conteúdo de alta qualidade e reconhecer usuários 
influentes.
• 
Frontend (UI):
• 
Selo Visual: Relatos de Embaixadores devem exibir um selo (ex: medalha 🏅) e ter 
uma estilização sutilmente diferente no feed.
• 
Prioridade no Feed: Relatos de Embaixadores devem ter prioridade no ranking do 
feed por 24h.
• 
Backend (Supabase):
• 
Tabela 
users : Adicionar um campo 
(timestamp).
• 
Painel Super Admin:
is_ambassador (boolean) e 
ambassador_since 
• 
Botão "Promover a Embaixador": Adicionar um botão no painel de 
gerenciamento de usuários para que o Super Admin possa atribuir/remover o status 
de Embaixador.
3.5. Refinamento do Frontend Existente
Objetivo: Lapidar a UI/UX para garantir uma experiência premium e sem aspecto de 
"gerado por IA".
• 
Windsurf Flow: O Windsurf deve analisar o código do frontend (especialmente 
components/FeedRelatos.tsx , 
components/VitrineGrid.tsx e 
de UI/UX, como:
app/page.tsx ) e aplicar melhorias 
• 
Tipografia: Ajustar fontes, tamanhos e pesos para consistência e legibilidade.
• 
Paleta de Cores: Refinar o uso das cores para uma estética mais coesa e elegante.
• 
Microinterações: Adicionar pequenas animações ou transições suaves para 
melhorar a fluidez.
• 
Remoção de Elementos: Remover campos como "Promoção ou Oferta Especial", 
"Tempo de Entrega", "Formas de Pagamento" da tela de admin de negócio, 
conforme discutido.
4. Próximos Passos para o Windsurf
1. Clonar Repositório: 
git clone tiagoriveira/jacupemba-ai (se ainda não estiver clonado).
2. Configurar MCP: Conectar o MCP do Supabase para acesso direto ao banco de dados.
3. Executar em Modo Flow: Iniciar o Windsurf no modo Flow e apresentar este 
Plan .
Master 
4. Implementar Iterativamente: O Windsurf deve implementar as funcionalidades item 
por item, solicitando confirmação para cada etapa e reportando o progresso.
Este plano é o seu contrato com o Windsurf. Ele tem todas as informações necessárias para 
transformar o Jacupemba AI em um produto de produção de alta qualidade
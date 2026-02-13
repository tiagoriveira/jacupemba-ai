Guia de Conversão Mobile: Jacupemba AI 
para Android e iOS (via Capacitor)
Este documento detalha o caminho mais simples e eficiente para transformar seu 
aplicativo web Next.js em um aplicativo instalável para Android e iOS, utilizando o 
Capacitor. O objetivo é manter a base de código web e minimizar a complexidade do 
desenvolvimento nativo, integrando o fluxo de trabalho com o Windsurf.
1. Por que Capacitor?
O Capacitor é uma ferramenta de código aberto que permite construir aplicativos web que 
rodam como aplicativos nativos em iOS, Android e Desktop. Ele atua como uma camada 
que "envelopa" seu aplicativo web (Next.js) em um contêiner nativo, dando acesso a 
funcionalidades do dispositivo (câmera, GPS, notificações) através de plugins. É a escolha 
ideal para seu projeto por:
• 
Reaproveitamento de Código: Você usa 100% do seu código Next.js existente.
• 
Simplicidade: Menos complexidade do que React Native ou Flutter, pois não exige 
reescrever a lógica de negócio.
• 
Acesso Nativo: Permite adicionar funcionalidades específicas de mobile quando 
necessário.
• 
Fluxo com Windsurf: O Windsurf gerencia o desenvolvimento web, e o Capacitor se 
encarrega da conversão para mobile.
2. Pré-requisitos
Antes de começar, certifique-se de ter:
• 
Node.js e npm/yarn: Já instalados e funcionando.
• 
Git: Para gerenciar seu repositório.
• 
Android Studio: Para compilar e testar o aplicativo Android. Inclui o SDK Android e 
emuladores.
• 
Xcode (apenas para iOS): Para compilar e testar o aplicativo iOS. Requer um Mac.
• 
Windsurf: Sua IDE principal para desenvolvimento web.
3. Passos para a Conversão
Passo 3.1: Instalar Capacitor no Projeto
Navegue até a raiz do seu projeto Jacupemba AI no terminal e adicione o Capacitor:
Bash
cd /home/ubuntu/jacupemba-repo # Certifique-se de estar na pasta correta
npm install @capacitor/core @capacitor/cli
npx cap init
Ao executar 
npx cap init , o Capacitor fará algumas perguntas:
• 
App name: 
Jacupemba AI (ou o nome que você deseja que apareça no celular)
• 
App ID: 
com.jacupemba.ai (um identificador único, geralmente no formato de domínio 
reverso)
• 
Web asset directory: 
estático) ou 
out (se você estiver usando 
next export para gerar um build 
public (se você estiver servindo o Next.js via Vercel e o Capacitor for 
apenas um wrapper para o site online). Para um app instalável que funciona offline, 
out é o mais comum após um 
next build .
Passo 3.2: Adicionar Plataformas
Adicione as plataformas mobile que você deseja suportar:
Bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
Passo 3.3: Construir o Aplicativo Web (Gerenciado pelo Windsurf)
Sempre que você fizer alterações no seu código Next.js (via Windsurf), você precisará 
construir a versão de produção do seu aplicativo web. Se você configurou o 
directory como 
web asset 
out , você precisará exportar seu Next.js como um site estático.
Bash
npm run build
npm run export # Se você usa next export para gerar a pasta 'out'
Se você configurou o 
web asset directory como 
public e seu app será servido online, este 
passo ainda é importante para garantir que o Capacitor use a versão mais recente do seu 
código.
Passo 3.4: Copiar os Assets Web para as Plataformas Nativas
Este comando copia os arquivos do seu aplicativo web (da pasta 
projetos nativos do Android e iOS:
Bash
npx cap sync
out ou 
public ) para os 
Passo 3.5: Abrir os Projetos Nativos
Para configurar e compilar os aplicativos, você precisará abrir os projetos nativos no 
Android Studio e Xcode:
Bash
npx cap open android
npx cap open ios # Apenas em um Mac
Dentro do Android Studio/Xcode, você pode:
• 
Definir o nome do aplicativo, ícone e tela de splash (splash screen).
• 
Configurar permissões (ex: acesso à câmera, localização).
• 
Compilar e rodar o aplicativo em um emulador ou dispositivo físico.
4. Considerações e Próximos Passos
• 
Ícones e Splash Screen: Estes são elementos nativos e devem ser configurados dentro 
do Android Studio e Xcode. Existem ferramentas online que geram todos os tamanhos 
necessários a partir de uma única imagem.
• 
Plugins Capacitor: Se você precisar de funcionalidades nativas (ex: câmera, GPS, 
notificações push), você pode instalar plugins do Capacitor (ex: 
@capacitor/camera ).
npm install 
• 
Testes: Teste exaustivamente em diferentes dispositivos e versões de OS para garantir 
que a experiência seja fluida.
• 
Publicação: Para publicar nas lojas (Google Play Store e Apple App Store), você 
precisará seguir os guias de cada loja, que envolvem criação de contas de 
desenvolvedor, assinatura de código e preenchimento de metadados.
Este guia oferece o caminho mais direto para ter seu app web rodando como um app 
mobile. Mantenha o foco na simplicidade e adicione complexidade nativa apenas quando 
estritamente necessário
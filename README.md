# **Projeto MyKondo**

## 📌 Descrição
O **MyKondo** é uma plataforma de gestão de condomínios desenvolvida para centralizar e simplificar a administração condominial.  
O sistema conta atualmente com **duas interfaces distintas**:

- **Administrador**: voltada para a gestão do sistema, administração de condomínios, usuários, configurações e controle geral da plataforma.
- **Morador**: destinada aos residentes dos condomínios, permitindo acesso a informações, comunicação e funcionalidades relacionadas ao seu dia a dia no condomínio.

O objetivo do MyKondo é oferecer uma solução prática, organizada e eficiente, facilitando a interação entre administração e moradores, além de otimizar os processos de gestão condominial.
## 🎯 Objetivos do Projeto

### Objetivo Geral
Desenvolver e implementar uma aplicação móvel que facilite a comunicação e a gestão dos processos entre os condóminos e a administração do condomínio, promovendo maior eficiência, transparência e comodidade no dia a dia condominial.

### Objetivos Específicos
- Permitir que os condóminos realizem o pagamento das suas faturas de forma simples e segura, bem como acedam rapidamente aos respetivos recibos;
- Possibilitar o registo de pedidos de manutenção e o reporte de problemas no condomínio, acompanhando o estado das solicitações;
- Disponibilizar acesso dinâmico e organizado a notícias, avisos, documentos e atas do condomínio;
- Criar um canal direto de comunicação entre os condóminos e a administração, facilitando o esclarecimento de dúvidas e o envio de informações relevantes.
## 📂 Estrutura de Pastas

O repositório está organizado da seguinte forma:

```bash
projeto_mobile_2025_2026/
├── back/
│   └── supabase_ha/   # Backend da aplicação
│
├── front/
│   ├── mobile/        # Aplicação móvel para condóminos
│   └── web-app/       # Aplicação web para administradores
│
├── documents/         # Documentação do projeto (relatórios, diagramas, etc.)
└── README.md
```

## 🎓 Contexto Académico

O **Projeto MyKondo** é fruto da junção de **três Unidades Curriculares**, nomeadamente:

- **Engenharia de Software**  
- **Sistemas Distribuídos**  
- **Segurança Informática**

Este projeto integra conceitos teóricos e práticos destas áreas, aplicando boas práticas de desenvolvimento de software, arquiteturas distribuídas e princípios de segurança, com o objetivo de criar uma solução robusta, escalável e segura para a gestão de condomínios.
## 🤖 Implementação em Inteligência Artificial (CSP)

No âmbito da Unidade Curricular de **Inteligência Artificial**, foi implementado um módulo baseado em **CSP (Constraint Satisfaction Problem)** para realizar o *matching* entre **Pedidos de Manutenção** e **Fornecedores** no sistema MyKondo.

Este módulo tem como principal objetivo identificar **combinações válidas e executáveis** entre pedidos e fornecedores, respeitando um conjunto de restrições, e devolver ao administrador uma lista ordenada das **melhores sugestões** para seleção.

### Modelação do Problema

O problema foi formalizado como um CSP, onde cada solução corresponde a uma tupla:

#### Variáveis
- **X1 — Fornecedor**: fornecedor que pode atender ao pedido;
- **X2 — Serviço**: serviço oferecido pelo fornecedor compatível com a categoria do pedido;
- **X3 — Slot**: intervalo de tempo disponível na agenda do fornecedor.

#### Domínios
Os domínios das variáveis são obtidos dinamicamente a partir da base de dados:
- Fornecedores com disponibilidade ativa;
- Serviços compatíveis com a categoria do pedido;
- Slots de agenda com estado `livre`.

#### Restrições
As principais restrições consideradas são:
- Compatibilidade entre a categoria do pedido e o tipo de serviço;
- Restrições orçamentais, quando aplicável;
- Compatibilidade temporal entre o pedido e o slot disponível;
- Garantia de disponibilidade real do slot no momento da atribuição.

### Estratégia de Resolução

A resolução do CSP é feita através de um algoritmo de **backtracking com poda**, permitindo explorar apenas combinações válidas e reduzir o espaço de pesquisa.  
O algoritmo percorre sequencialmente fornecedores, serviços e slots, validando as restrições a cada passo.

Para melhorar a eficiência, os dados são previamente **indexados em memória**, agrupando serviços e slots por fornecedor.

### Resultados

O módulo devolve ao administrador uma lista de sugestões contendo:
- Informação do fornecedor;
- Serviço selecionado;
- Slot de agenda atribuído;

Esta abordagem garante que as opções apresentadas são **válidas, viáveis e alinhadas com as restrições do pedido**, demonstrando a aplicação prática dos conceitos de CSP estudados na Unidade Curricular de Inteligência Artificial.
## 🔐 Segurança Informática

No desenvolvimento do projeto MyKondo foi utilizado o **Supabase** como plataforma de backend, desempenhando um papel central na gestão de dados, autenticação de utilizadores e aplicação de mecanismos de segurança informática.

A autenticação é assegurada através do **Supabase Auth**, que utiliza métodos seguros baseados em **tokens JWT**, garantindo que apenas utilizadores autenticados possam aceder à aplicação. Este mecanismo reforça a confidencialidade dos dados e a responsabilização das ações realizadas no sistema.

O controlo de acesso aos dados é implementado por meio de **Security Policies** baseadas em **Row Level Security (RLS)** do PostgreSQL. Estas políticas definem regras de acesso diretamente ao nível da base de dados, assegurando que cada utilizador apenas pode consultar ou modificar a informação que lhe é permitida.

Adicionalmente, o Supabase garante a **encriptação dos dados em trânsito e em repouso**, através de comunicações seguras (HTTPS/TLS) e proteção dos dados armazenados. A utilização de **chaves de acesso com diferentes níveis de privilégio** permite aplicar o princípio do menor privilégio, reduzindo o impacto de uma eventual exposição de credenciais.

Por fim, mecanismos de **monitorização, logs e backups automáticos** contribuem para a deteção de incidentes, auditoria de acessos e garantia da disponibilidade da informação, adotando uma abordagem de **defesa em profundidade** e assegurando a confidencialidade, integridade e disponibilidade dos dados do sistema.
## 🌐 Sistemas Distribuídos

A arquitetura do projeto MyKondo segue um modelo de **sistema distribuído**, concebido para garantir **escalabilidade, alta disponibilidade e tolerância a falhas**.

As aplicações **Mobile** e **Web** comunicam com o backend através de um **Load Balancer (API Gateway)**, responsável por distribuir as requisições entre múltiplas instâncias do **Supabase**, evitando pontos únicos de falha e permitindo o balanceamento de carga.

Cada instância do Supabase está ligada a um **Load Balancer de Base de Dados (BD Proxy)**, que gere o acesso às bases de dados **PostgreSQL**. O sistema utiliza **replicação de dados** entre duas bases de dados, assegurando redundância e consistência da informação.

Para garantir tolerância a falhas, é utilizado um **Failover Watcher**, responsável por monitorizar o estado das bases de dados e assegurar a continuidade do serviço em caso de falha de uma das instâncias.

A **imagem da arquitetura do sistema encontra-se disponível na pasta `documents`** do repositório, servindo como apoio visual à compreensão da solução distribuída implementada no projeto.







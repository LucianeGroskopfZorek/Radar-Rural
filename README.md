# 📡 Radar Rural

> Estradas, avisos e utilidades da sua comunidade rural em uma única tela.

MVP desenvolvido para a **UC6 – Prototipação Rápida de Aplicações com IA** (SENAC-SC, 2026), construído com o **Google AI Studio**.

---

## 🧭 Sobre o projeto

Nas comunidades rurais de **Canoinhas (SC)**, como **Marcílio Dias**, as chuvas deixam estradas e pontes bloqueadas e os moradores só descobrem quando chegam ao local, perdendo tempo e correndo o risco de atolar. Além disso, os avisos de coleta seletiva, descarte de agrotóxicos e vacinação chegam por canais dispersos, e o sinal de internet no campo é instável.

O **Radar Rural** reúne tudo isso em uma tela por comunidade: um mapa com o estado das estradas e as utilidades da semana.

### Meta do MVP

> Um morador consegue ver o estado das estradas da sua comunidade e o próximo dia de coleta em **menos de 1 minuto**, e registrar um aviso de problema em **até 3 toques**.

### Persona

**Seu Jorge, 52 anos**, produtor rural em Marcílio Dias. Vai à cidade toda semana vender a produção e usar o posto de saúde. Usa WhatsApp e só tem internet estável em casa, no Wi-Fi.

---

## ✨ Funcionalidades do MVP

1. **Escolha da comunidade** feita uma única vez, com cabeçalho de localidade e alerta de clima (fictício).
2. **Mapa das estradas** com pinos 🔴 bloqueada, 🟡 atenção e 🟢 liberada, com "atualizado há X min".
3. **Avisar problema na estrada**: foto, tipo (alagamento, queda de árvore ou buraco/barreira), nível e local.
4. **Utilidades da semana**: coleta seletiva, descarte de agrotóxicos/eletrônicos, vacinação e transporte de saúde.
5. **Rodapé fixo de emergência**: ligar 193 (Bombeiros) e Defesa Civil.

### Regras de funcionamento

- **R1.** Tudo na tela (mapa, avisos e utilidades) mostra só os dados da comunidade escolhida.
- **R2.** Cada aviso mostra há quanto tempo foi atualizado; avisos com mais de 24 horas aparecem esmaecidos.
- **R3.** Todo aviso precisa de tipo e nível (vermelho, amarelo ou verde) antes de ser enviado.

### Fora do escopo (por enquanto)

- Funcionamento offline com envio automático quando houver Wi-Fi
- Cartão de Saúde com QR Code
- Notificações automáticas (lembretes de coleta)
- Clima e estradas em tempo real (no MVP os dados são fictícios)
- Login, contas e confirmação de avisos por outros moradores

---

## 📱 Telas

| Tela | Para que serve |
| --- | --- |
| Escolha da comunidade | Primeira abertura: o morador escolhe sua comunidade e o app filtra tudo para ela |
| Tela inicial (Radar) | Cabeçalho com localidade e clima, mapa com pinos, cartões de utilidades e rodapé de emergência |
| Avisar problema | Registra foto, tipo, nível e local; o aviso vira um pino no mapa |
| Detalhe do aviso ou utilidade | Descrição, horário e foto, ao tocar em um pino ou cartão |

## 🗂️ Dados

| Entidade | Campos |
| --- | --- |
| Comunidade | nome, município, alerta de clima |
| Aviso de estrada | tipo, nível (cor), descrição, local, foto, horário |
| Utilidade da semana | categoria, título, dia e horário, local |

> Todos os dados do MVP são **fictícios**, para 3 comunidades de exemplo.

---

## 🌍 ODS

| ODS | Contribuição |
| --- | --- |
| **11 – Cidades e comunidades sustentáveis** (principal) | Melhora a mobilidade, a segurança e o acesso a serviços nas comunidades rurais |
| **12 – Consumo e produção responsáveis** | Lembra da coleta seletiva e do descarte correto de agrotóxicos e eletrônicos |
| **8 – Trabalho decente e crescimento econômico** | Ajuda o produtor a escoar a produção sem perder o dia por estrada bloqueada |

**Eixo:** Turismo, Hospitalidade e Lazer.

---

## 🛠️ Tecnologias

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- Servidor Node (`server.ts`)
- [Google Maps Platform](https://developers.google.com/maps) (mapa e marcadores)
- Gerado e iterado com o [Google AI Studio](https://aistudio.google.com/)

## 📁 Estrutura do repositório

```
Radar-Rural/
├── .gmp_cache/        # Documentação de referência do Google Maps Platform
├── public/            # Arquivos estáticos
├── src/               # Código-fonte do front-end
├── .env.example       # Modelo das variáveis de ambiente
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Como rodar localmente

**Pré-requisitos:** [Node.js](https://nodejs.org/) instalado e uma chave de API do Google Maps Platform.

```bash
# 1. Clone o repositório
git clone https://github.com/LucianeGroskopfZorek/Radar-Rural.git
cd Radar-Rural

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# abra o .env.local e preencha as chaves pedidas no .env.example

# 4. Inicie o projeto
npm run dev
```

Depois, acesse o endereço que aparecer no terminal (normalmente `http://localhost:3000` ou `http://localhost:5173`).

> ⚠️ Nunca suba o arquivo `.env.local` com suas chaves para o GitHub. Ele já deve estar no `.gitignore`.

---

## 🔒 Responsabilidade

- O app **não pede dados pessoais**; os testes usam apenas dados fictícios (LGPD).
- Pode ser usado por menores de 18 anos, por isso é protegido por padrão e **não usa dados para anúncios** (ECA Digital).

## 👥 Equipe

- **Luciane Grosskopf Zorek**
- **Nicolas Duma**

Projeto acadêmico – SENAC-SC · UC6 · 2026

# azure-maf-oncall

Azure SRE Agent Intelligence Interpreter & Notification System.

Interprets Azure SRE Agent investigations and remediation proposals with Azure AI, then delivers human-readable, multi-channel on-call notifications (Email, SMS, Voice) via Azure Communication Services.

See [docs/PRD.md](docs/PRD.md) for the full product requirements and architecture.

## Structure

```
├── .github/workflows/   # CI + Bicep deployment pipelines
├── infra/               # Bicep IaC (main.bicep, modules/, parameters/)
├── src/
│   ├── functions/        # Azure Functions: Interpreters, Notifiers, Shared
│   ├── agents/            # Custom sub-agents/tools
│   ├── services/          # Business logic
│   └── utils/             # Shared helpers
├── tests/                # Unit + integration tests
├── docs/                 # PRD, architecture, runbooks
└── scripts/              # Deployment/setup scripts
```

## Getting Started

```bash
npm install
cp .env.example .env   # fill in Azure OpenAI / ACS / Event Grid values
npm start               # runs Azure Functions locally (requires Azure Functions Core Tools)
```

## Infrastructure

Deploy with Bicep:

```bash
az deployment group create \
  --resource-group rg-sre-oncall-dev \
  --template-file infra/main.bicep \
  --parameters infra/parameters/dev.parameters.json
```

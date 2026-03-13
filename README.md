# AgentHub

AgentHub 是一个面向 AI 多角色协作场景的全栈原型项目。

用户输入一个项目目标后，系统会自动生成由项目经理、前端、后端、测试、产品等角色组成的 AI 团队，并在群聊中围绕任务进行拆解、分配、持续讨论和推进。当前版本已接入真实大模型推理链路，默认通过 vLLM 调用 `GLM-4.7`。

## Features

- AI 团队自动生成
  - 根据项目目标创建项目经理与多类专业 Agent
  - 自动创建项目主群，进入协作流程
- 真实模型驱动协作
  - 所有 Agent 默认绑定 vLLM 服务
  - 不再依赖前端模拟回复
- 任务驱动群聊
  - 用户在主群输入任务后，项目经理先理解需求并拆解任务
  - 其他角色从各自专业视角继续回应
- 持续自动讨论
  - 首轮分配后，系统会继续推进多轮讨论
  - 支持手动停止自动协作
- 项目视图与配置
  - 项目管理页
  - 总结页
  - Agent 模型配置
  - 总结设置

## Demo Flow

典型使用流程如下：

1. 用户输入项目目标
2. 系统生成 AI 团队
3. 进入项目主群
4. 用户输入任务，例如“帮我设计一个首页，并补充任务分配入口”
5. 项目经理调用模型理解任务并拆分工作
6. 前端、后端、测试、产品等角色继续自动讨论
7. 用户可在任意时刻停止自动协作

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS

### Backend

- FastAPI
- Pydantic
- Uvicorn

### Model Runtime

- vLLM
- GLM-4.7
- OpenAI-compatible API

## Project Structure

```text
AgentHub/
├── back/                  # FastAPI backend
│   ├── app/
│   │   ├── api/           # REST API
│   │   ├── services/      # domain services and model orchestration
│   │   ├── models.py      # shared data models
│   │   ├── store.py       # in-memory project store
│   │   └── main.py        # app entry
│   └── tests/
├── front/                 # React frontend
│   ├── src/app/
│   │   ├── api/           # frontend API client
│   │   ├── components/    # UI and business components
│   │   ├── context/       # project state container
│   │   ├── pages/         # page-level views
│   │   └── types/         # shared frontend types
│   └── package.json
└── README.md
```

## Architecture

当前版本采用“前后端分离 + 后端调模型”的结构：

- 前端负责页面、群聊交互、项目状态展示和停止/开启自动协作
- 后端负责：
  - 创建项目与团队
  - 管理群组和消息
  - 调用 vLLM 执行项目经理和员工回复
  - 推进持续讨论
- 数据目前保存在内存中，适合原型演示和本地开发

## Quick Start

### 1. Clone Repository

```bash
git clone git@github.com:zhchzh10000/AgentHub.git
cd AgentHub
```

### 2. Start Backend

```bash
cd back
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

后端健康检查：

```bash
curl http://127.0.0.1:8000/health
```

### 3. Start Frontend

```bash
cd front
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

浏览器访问：

```text
http://127.0.0.1:5173/
```

## Environment

### Frontend

`front/.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Model Service

后端默认使用以下 vLLM 地址：

```text
http://10.103.0.5:8002/v1
```

如果要覆盖默认地址，可设置环境变量：

```bash
export VLLM_BASE_URL=http://10.103.0.5:8002/v1
```

## API Overview

### Project

- `POST /projects`
- `POST /projects/{project_id}/generate-team`
- `GET /projects/{project_id}`
- `GET /projects/{project_id}/summaries`
- `GET /projects/{project_id}/summary-settings`
- `PUT /projects/{project_id}/summary-settings`

### Chat

- `GET /projects/{project_id}/chat/groups`
- `POST /projects/{project_id}/chat/groups`
- `POST /projects/{project_id}/chat/groups/{group_id}/messages`
- `POST /projects/{project_id}/chat/groups/{group_id}/pm-handle-task`
- `POST /projects/{project_id}/chat/groups/{group_id}/continue-discussion`
- `POST /projects/{project_id}/chat/groups/{group_id}/auto-collaboration`

## How It Works

### Team Generation

系统会根据项目目标自动生成：

- 项目经理
- 前端开发
- 后端开发
- 测试工程师
- 产品经理
- 在部分关键词场景下附加设计或 DevOps 角色

### Multi-Agent Discussion

在项目主群中：

1. 用户发送任务
2. 项目经理调用模型分析任务
3. 项目经理输出拆解和分工
4. 各员工调用模型给出执行计划
5. 系统继续推进下一轮讨论
6. 用户点击“停止自动协作”后终止自动推进

## Testing

### Backend

```bash
cd back
pytest
```

### Frontend

```bash
cd front
npm run build
npm test
```

## Current Limitations

- 当前数据存储为内存存储，服务重启后项目不会保留
- 自动讨论策略仍偏演示型，尚未加入更复杂的上下文裁剪与任务状态机
- 暂未接入数据库、鉴权和生产级日志体系

## Roadmap

- SQLite / PostgreSQL 持久化
- 更细粒度的任务状态流转
- 自动总结与里程碑联动
- WebSocket 实时消息更新
- 更丰富的 Agent 模型配置与角色提示词体系

## Why This Project

这个项目适合作为以下方向的实验基础：

- 多 Agent 协作产品原型
- AI 团队工作流演示
- 基于 vLLM 的企业内网模型应用
- 前后端一体化的大模型协作系统样板

## License

当前仓库未声明开源许可证。如需开源发布，建议补充 `MIT`、`Apache-2.0` 或团队内部许可证说明。

from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services import chat_service, project_service
from app.store import STORE


def setup_function() -> None:
    STORE.clear()


def test_summary_generated_after_message_interval() -> None:
    project = project_service.create_project("开发一个支持多人协作的任务系统")
    project = project_service.generate_team_for_project(project.id)
    project.summarySettings.messageInterval = 2
    project.summarySettings.timeInterval = 999
    STORE.update_project(project)

    group = project.chatGroups[0]
    pm_agent = next(agent for agent in project.agents if agent.isProjectManager)

    chat_service.send_message(
        project.id,
        group.id,
        "user",
        "我",
        "👤",
        "请先梳理首页、任务列表和接口分工。",
    )
    chat_service.send_message(
        project.id,
        group.id,
        pm_agent.id,
        pm_agent.name,
        pm_agent.avatar,
        "我来先拆分任务，并安排前后端分别推进页面和接口设计。",
    )

    updated = STORE.get_project(project.id)
    assert updated is not None
    assert len(updated.summaries) == 1

    summary = updated.summaries[0]
    assert summary.groupId == group.id
    assert summary.messageRange.start == 2
    assert summary.messageRange.end == 3
    assert "首页、任务列表和接口分工" in summary.content

    summary_messages = [message for message in updated.chatGroups[0].messages if message.type == "summary"]
    assert len(summary_messages) == 1
    assert "查看总结" in summary_messages[0].content


def test_summary_respects_disabled_setting() -> None:
    project = project_service.create_project("开发一个博客平台")
    project = project_service.generate_team_for_project(project.id)
    project.summarySettings.enabled = False
    project.summarySettings.messageInterval = 1
    project.summarySettings.timeInterval = 1
    STORE.update_project(project)

    group = project.chatGroups[0]
    chat_service.send_message(
        project.id,
        group.id,
        "user",
        "我",
        "👤",
        "请开始讨论评论系统的实现方案。",
    )

    updated = STORE.get_project(project.id)
    assert updated is not None
    assert updated.summaries == []


def test_agent_memory_is_persisted_and_windowed() -> None:
    project = project_service.create_project("开发一个支持讨论归档的协作平台")
    project = project_service.generate_team_for_project(project.id)
    group = project.chatGroups[0]

    for index in range(30):
        chat_service.send_message(
            project.id,
            group.id,
            "user",
            "我",
            "👤",
            f"第 {index + 1} 轮讨论，需要记录上下文并保留历史。",
        )

    updated = STORE.get_project(project.id)
    assert updated is not None

    first_agent = updated.agents[0]
    memory = updated.agentMemories[first_agent.id]
    assert memory.recentEvents
    assert memory.rollingSummary
    assert len(memory.recentEvents) <= 24


def test_summary_preserves_detailed_viewpoints() -> None:
    project = project_service.create_project("设计一个多角色协作工作台")
    project = project_service.generate_team_for_project(project.id)
    project.summarySettings.messageInterval = 3
    project.summarySettings.timeInterval = 999
    STORE.update_project(project)

    group = project.chatGroups[0]
    pm_agent = next(agent for agent in project.agents if agent.isProjectManager)
    frontend_agent = next(agent for agent in project.agents if agent.role == "前端开发")

    user_message = "请讨论首页工作台采用标签页布局还是卡片瀑布流，并评估状态同步和接口拆分。"
    pm_message = "我建议优先采用卡片式工作台，把任务概览、风险提醒和讨论摘要放在同一屏，同时让前后端提前约定状态枚举和聚合接口。"
    frontend_message = "从前端实现上看，卡片式工作台更适合后续拖拽扩展，但需要把筛选条件、分页参数和实时刷新策略先定义清楚，否则状态管理会比较复杂。"

    chat_service.send_message(project.id, group.id, "user", "我", "👤", user_message)
    chat_service.send_message(project.id, group.id, pm_agent.id, pm_agent.name, pm_agent.avatar, pm_message)
    chat_service.send_message(
        project.id,
        group.id,
        frontend_agent.id,
        frontend_agent.name,
        frontend_agent.avatar,
        frontend_message,
    )

    updated = STORE.get_project(project.id)
    assert updated is not None
    assert len(updated.summaries) == 1

    summary = updated.summaries[0]
    assert user_message in summary.content
    assert pm_message in summary.content
    assert frontend_message in summary.content
    assert "方案A：" in summary.content
    assert "方案B：" in summary.content
    assert any(pm_message in item for item in summary.keyPoints)
    assert any(frontend_message in item for item in summary.keyPoints)

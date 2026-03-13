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

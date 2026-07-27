import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import useLock from 'hooks/useLock'
import { useTc } from '@toolcase/web-components/react'
import UpgradeNudge from 'components/UpgradeNudge'
import { MODAL, useModalOpen } from 'modals'
import { CreateTaskResult } from 'modals/CreateTaskModal'
import { Project, Task, TaskStatus } from 'types'

const NO_TASKS: Task[] = []

const STATUS_ORDER: TaskStatus[] = ['planned', 'in-progress', 'shipped']

const ProjectRoadmap: React.FC<{ project: Project }> = ({ project }) => {
    const id = project.id
    const { t } = useStrings()
    const p = t.projects
    const tasksByProject = useStore((state) => state.tasksByProject)
    const fetchTasks = useStore((state) => state.fetchTasks)
    const addTask = useStore((state) => state.addTask)
    const moveTask = useStore((state) => state.moveTask)
    const deleteTask = useStore((state) => state.deleteTask)
    const exportProject = useStore((state) => state.exportProject)
    const canWrite = useCan('task.write')
    const exportLock = useLock('project.export')

    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        fetchTasks(id)
    }, [id, fetchTasks])

    const tasks = tasksByProject[id] ?? NO_TASKS
    const selectedTask = tasks.find((entry) => entry.id === selectedId) ?? null
    const selectedRank = selectedTask ? STATUS_ORDER.indexOf(selectedTask.status) : -1

    const openCreateTask = useModalOpen<CreateTaskResult, TaskStatus>(MODAL.CREATE_TASK, async (result) => {
        if (result) await addTask(id, result.title, result.status)
    })

    const openConfirmDeleteTask = useModalOpen<Task, Task>(MODAL.CONFIRM_DELETE_TASK, async (confirmed) => {
        if (confirmed) {
            await deleteTask(id, confirmed.id)
            setSelectedId(null)
        }
    })

    const shiftTask = async (delta: number) => {
        if (!selectedTask) return
        const next = STATUS_ORDER[selectedRank + delta]
        if (!next) return
        await moveTask(id, selectedTask, next)
    }

    const columns = useMemo(
        () =>
            (['planned', 'in-progress', 'shipped'] as TaskStatus[]).map((status) => ({
                status,
                items: tasks.flatMap((task) =>
                    task.status === status ? [{ title: task.title, taskId: task.id }] : []
                ),
            })),
        [tasks]
    )

    const roadmap = useTc<HTMLElement>(
        { columns },
        {
            'tc-select': (event: Event) => {
                const detail = (event as CustomEvent<{ item?: { taskId?: string } }>).detail
                const taskId = detail?.item?.taskId ?? null

                setSelectedId((current) => (taskId && current === taskId ? null : taskId))
            },
        }
    )

    const selectionLabel = selectedTask ? p.taskSelected(selectedTask.title) : p.noTaskSelected

    const actionHeader = useTc<HTMLElement>({
        actions: [
            ...(canWrite ? [{ key: 'add', label: p.addTask, icon: 'Plus', variant: 'primary' }] : []),
            ...(canWrite
                ? [
                    {
                        key: 'back',
                        label: p.moveBack,
                        icon: 'ArrowLeft',
                        variant: 'secondary',
                        disabled: selectedRank <= 0,
                    },
                    {
                        key: 'forward',
                        label: p.moveForward,
                        icon: 'ArrowRight',
                        variant: 'secondary',
                        disabled: selectedRank < 0 || selectedRank >= STATUS_ORDER.length - 1,
                    },
                ]
                : []),
            { key: 'export', label: p.export, icon: exportLock.locked ? 'Lock' : 'Download', variant: 'secondary' },
            ...(canWrite
                ? [{ key: 'delete', label: p.deleteTask, icon: 'Trash2', variant: 'danger', disabled: !selectedTask }]
                : []),
        ],
        onExec: (key: string) => {
            if (key === 'add') {
                openCreateTask()
            } else if (key === 'back') {
                void shiftTask(-1)
            } else if (key === 'forward') {
                void shiftTask(1)
            } else if (key === 'export') {
                if (exportLock.locked) exportLock.open()
                else exportProject(id)
            } else if (key === 'delete' && selectedTask) {
                openConfirmDeleteTask(selectedTask)
            }
        },
    })

    useEffect(() => {
        const content = actionHeader.current?.querySelector('.tc-action-header-content')
        if (content) content.textContent = selectionLabel
    })

    return (
        <>
            <tc-action-header ref={actionHeader} className="module-project-detail__action-header"></tc-action-header>
            <UpgradeNudge lock={exportLock} feature="export" />
            <tc-roadmap ref={roadmap} layout="kanban"></tc-roadmap>
        </>
    )
}

export default ProjectRoadmap

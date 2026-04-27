import { Archive, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedPageWrapper } from '@/components/layout/AnimatedPageWrapper';
import { useAnimationMode } from '@/context/AnimationModeContext';
import { useAuthInfo } from '@/hooks/useAuthInfo';
import { ArchiveDrawer } from './components/ArchiveDrawer/ArchiveDrawer';
import { ChallengeSection } from './components/ChallengeSection/ChallengeSection';
import { HabitBoard } from './components/HabitBoard/HabitBoard';
import { TaskSidebar } from './components/TaskSidebar/TaskSidebar';
import { TrashDrawer } from './components/TrashDrawer/TrashDrawer';
import { useArchiveCleanup } from './hooks/useArchiveCleanup';
import { useChallengeStorage } from './hooks/useChallengeStorage';
import { useDailyPlan } from './hooks/useDailyPlan';
import { useHabitStorage } from './hooks/useHabitStorage';
import { useRecurringReactivation } from './hooks/useRecurringReactivation';
import { useReminders } from './hooks/useReminders';
import { useTaskStorage } from './hooks/useTaskStorage';
import { useTrash } from './hooks/useTrash';
import type { HabitViewMode, TrashItem } from './types';
import './dashboard.css';

const LeafIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14" aria-hidden="true">
        <path
            d="M3 13C3 13 5.5 6 13 3C13 9.5 8 13 3 13Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.25"
        />
        <path d="M3 13L7.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
);

interface DashboardHeaderProps {
    email: string | undefined;
    trashCount: number;
    archiveCount: number;
    isSavingMode: boolean;
    onLogout: () => void;
    onGoToProfile: () => void;
    onOpenTrash: () => void;
    onOpenArchive: () => void;
    onToggleSavingMode: () => void;
}

function DashboardHeader({
    email,
    trashCount,
    archiveCount,
    isSavingMode,
    onLogout,
    onGoToProfile,
    onOpenTrash,
    onOpenArchive,
    onToggleSavingMode,
}: DashboardHeaderProps) {
    return (
        <header className="dashboard__header">
            <div className="dashboard__header-left">
                <p className="dashboard__email">{email}</p>
            </div>
            <div className="dashboard__header-actions">
                <button
                    type="button"
                    className={`dashboard__header-btn dashboard__header-btn--saving${isSavingMode ? ' dashboard__header-btn--saving-active' : ''}`}
                    onClick={onToggleSavingMode}
                    title={isSavingMode ? 'Полный газ' : 'Сберегающий режим'}
                    aria-pressed={isSavingMode}
                    aria-label={
                        isSavingMode ? 'Выключить сберегающий режим' : 'Включить сберегающий режим'
                    }
                >
                    <LeafIcon />
                    {isSavingMode ? 'Сберегающий' : 'Полный газ'}
                </button>
                <button
                    type="button"
                    className="dashboard__header-btn dashboard__header-btn--profile"
                    onClick={onGoToProfile}
                >
                    Профиль
                </button>
                <button
                    type="button"
                    className="dashboard__header-btn dashboard__header-btn--archive"
                    onClick={onOpenArchive}
                    title="Архив"
                >
                    <Archive size={13} />
                    {archiveCount > 0 && (
                        <span className="dashboard__trash-badge">{archiveCount}</span>
                    )}
                </button>
                <button
                    type="button"
                    className="dashboard__header-btn dashboard__header-btn--trash"
                    onClick={onOpenTrash}
                >
                    <Trash2 size={13} />
                    {trashCount > 0 && <span className="dashboard__trash-badge">{trashCount}</span>}
                </button>
                <button
                    type="button"
                    className="dashboard__header-btn dashboard__header-btn--logout"
                    onClick={onLogout}
                >
                    Выйти
                </button>
            </div>
        </header>
    );
}

export const DashboardPage = () => {
    const { user, logout } = useAuthInfo();
    const { isSavingMode, toggleSavingMode } = useAnimationMode();
    const navigate = useNavigate();

    const {
        tasks,
        sections,
        loading: tasksLoading,
        addTask,
        updateTask,
        deleteTask,
        toggleDone,
        togglePin,
        reorderTasks,
        addSection,
        updateSection,
        deleteSection,
        getTasksBySection,
        archivedTasks,
        restoreTask,
        doneAtBottom,
        setDoneAtBottom,
    } = useTaskStorage();

    const { habits, logs, addHabit, updateHabit, deleteHabit, logCompletion, logDecrement } =
        useHabitStorage();

    const {
        challenges,
        assignments,
        addChallenge,
        updateChallenge,
        deleteChallenge,
        completeAssignment,
        failAssignment,
        reactivateAssignment,
        swapToday,
    } = useChallengeStorage();

    const { trashItems, addToTrash, restoreItem, permanentDelete } = useTrash();

    const [activeSection, setActiveSection] = useState('all');
    const [habitViewMode, setHabitViewMode] = useState<HabitViewMode>('today');
    const [trashOpen, setTrashOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);

    const { copyDailyPlan } = useDailyPlan(tasks);

    useArchiveCleanup(tasks, tasksLoading, updateTask);
    useRecurringReactivation(tasks, tasksLoading, updateTask);
    useReminders(tasks);

    const handleLogout = useCallback(async () => {
        navigate('/');
        await logout();
    }, [logout, navigate]);

    const handleGoToProfile = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleDeleteTask = useCallback(
        (id: string) => {
            const task = tasks.find((t) => t.id === id);
            if (task) {
                const trashItem: TrashItem = {
                    id: crypto.randomUUID(),
                    type: 'task',
                    data: task,
                    deletedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                };
                void addToTrash(trashItem);
            }
            void deleteTask(id);
        },
        [tasks, addToTrash, deleteTask]
    );

    const handleDeleteHabit = useCallback(
        (id: string) => {
            const habit = habits.find((h) => h.id === id);
            if (habit) {
                const trashItem: TrashItem = {
                    id: crypto.randomUUID(),
                    type: 'habit',
                    data: habit,
                    deletedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                };
                void addToTrash(trashItem);
            }
            void deleteHabit(id);
        },
        [habits, addToTrash, deleteHabit]
    );

    const handleDeleteChallenge = useCallback(
        (id: string) => {
            const challenge = challenges.find((c) => c.id === id);
            if (challenge) {
                const trashItem: TrashItem = {
                    id: crypto.randomUUID(),
                    type: 'challenge',
                    data: challenge,
                    deletedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                };
                void addToTrash(trashItem);
            }
            void deleteChallenge(id);
        },
        [challenges, addToTrash, deleteChallenge]
    );

    const visibleTasks = getTasksBySection(activeSection);

    return (
        <AnimatedPageWrapper>
            <div className="dashboard">
                <DashboardHeader
                    email={user?.email}
                    trashCount={trashItems.length}
                    archiveCount={archivedTasks.length}
                    isSavingMode={isSavingMode}
                    onLogout={handleLogout}
                    onGoToProfile={handleGoToProfile}
                    onOpenTrash={() => setTrashOpen(true)}
                    onOpenArchive={() => setArchiveOpen(true)}
                    onToggleSavingMode={toggleSavingMode}
                />
                <div className="dashboard__body">
                    <TaskSidebar
                        sections={sections}
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                        tasks={visibleTasks}
                        onToggleDone={toggleDone}
                        onTogglePin={togglePin}
                        onDeleteTask={handleDeleteTask}
                        onUpdateTask={updateTask}
                        onAddTask={addTask}
                        onAddSection={addSection}
                        onUpdateSection={updateSection}
                        onDeleteSection={deleteSection}
                        onReorderTasks={reorderTasks}
                        onCopyDailyPlan={copyDailyPlan}
                        doneAtBottom={doneAtBottom}
                        onToggleDoneAtBottom={() => setDoneAtBottom(!doneAtBottom)}
                    />
                    <main className="dashboard__main">
                        <ChallengeSection
                            challenges={challenges}
                            assignments={assignments}
                            onAddChallenge={addChallenge}
                            onUpdateChallenge={updateChallenge}
                            onDeleteChallenge={handleDeleteChallenge}
                            onCompleteAssignment={completeAssignment}
                            onFailAssignment={failAssignment}
                            onReactivateAssignment={reactivateAssignment}
                            onSwapToday={swapToday}
                        />
                        <HabitBoard
                            habits={habits}
                            logs={logs}
                            viewMode={habitViewMode}
                            onViewModeChange={setHabitViewMode}
                            onLogCompletion={logCompletion}
                            onLogDecrement={logDecrement}
                            onAddHabit={addHabit}
                            onUpdateHabit={updateHabit}
                            onDeleteHabit={handleDeleteHabit}
                        />
                    </main>
                </div>
                <TrashDrawer
                    isOpen={trashOpen}
                    onClose={() => setTrashOpen(false)}
                    trashItems={trashItems}
                    onRestore={restoreItem}
                    onPermanentDelete={permanentDelete}
                />
                <ArchiveDrawer
                    isOpen={archiveOpen}
                    onClose={() => setArchiveOpen(false)}
                    tasks={archivedTasks}
                    sections={sections}
                    onRestore={restoreTask}
                    onDelete={handleDeleteTask}
                />
            </div>
        </AnimatedPageWrapper>
    );
};

export default DashboardPage;

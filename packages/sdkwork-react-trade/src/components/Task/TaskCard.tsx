import React from 'react';
import { Clock, DollarSign, Timer, Zap, Users } from 'lucide-react';
import type { AvailableTask, TaskType } from '../../entities';
import { TaskType as TaskTypeEnum } from '../../entities';
import { cn, formatDate } from '@sdkwork/react-commons';

interface TaskCardProps {
  task: AvailableTask;
  onAccept?: (task: AvailableTask) => void;
  onViewDetail?: (task: AvailableTask) => void;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onAccept,
  onViewDetail,
  className = '',
}) => {
  const formatBudget = (budget: number) => {
    return `¥${(budget / 100).toFixed(2)}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      EASY: 'text-green-400 bg-green-500/10',
      MEDIUM: 'text-yellow-400 bg-yellow-500/10',
      HARD: 'text-orange-400 bg-orange-500/10',
      EXPERT: 'text-red-400 bg-red-500/10',
    };
    return colors[difficulty] || 'text-gray-400 bg-gray-500/10';
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      EASY: '简单',
      MEDIUM: '中等',
      HARD: '困难',
      EXPERT: '专家',
    };
    return labels[difficulty] || difficulty;
  };

  const getTypeLabel = (type: TaskType) => {
    const labels: Record<TaskType, string> = {
      [TaskTypeEnum.TEXT_TO_VIDEO]: '文生视频',
      [TaskTypeEnum.IMAGE_TO_VIDEO]: '图生视频',
      [TaskTypeEnum.VIDEO_EXTEND]: '视频扩展',
      [TaskTypeEnum.VIDEO_RESTORE]: '视频修复',
      [TaskTypeEnum.VIDEO_SUPER_RESOLUTION]: '视频超分',
      [TaskTypeEnum.VIDEO_FRAME_INTERPOLATION]: '视频补帧',
      [TaskTypeEnum.VIDEO_COLORIZATION]: '视频着色',
      [TaskTypeEnum.VIDEO_STYLE_TRANSFER]: '风格转换',
      [TaskTypeEnum.AVATAR_VIDEO]: '角色视频',
      [TaskTypeEnum.LIP_SYNC]: '口型同步',
    };
    return labels[type] || type;
  };

  const getTimeLeft = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) {
      return '已过期';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `剩余 ${days}天${hours}小时`;
    }
    if (hours > 0) {
      return `剩余 ${hours}小时`;
    }
    return '即将截止';
  };

  const isExpired = new Date(task.deadline) <= new Date();
  const isAccepted = task.status === 'ACCEPTED' || task.status === 'IN_PROGRESS';

  return (
    <div
      className={cn(
        'bg-[#1e1e20] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full font-medium',
              getDifficultyColor(task.difficulty)
            )}
          >
            {getDifficultyLabel(task.difficulty)}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-full text-gray-400">
            {getTypeLabel(task.type)}
          </span>
        </div>
        {isExpired ? (
          <span className="text-[10px] text-red-400">已过期</span>
        ) : isAccepted ? (
          <span className="text-[10px] text-blue-400">已接单</span>
        ) : null}
      </div>

      {/* Title */}
      <h3
        className="text-sm font-semibold text-white mb-2 cursor-pointer hover:text-blue-400 transition-colors"
        onClick={() => onViewDetail?.(task)}
      >
        {task.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-400 mb-3 line-clamp-2">{task.description}</p>

      {/* Requirements */}
      {task.requirements && task.requirements.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] text-gray-500 mb-1">要求：</div>
          <div className="flex flex-wrap gap-1">
            {task.requirements.slice(0, 3).map((req, index) => (
              <span
                key={index}
                className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400"
              >
                {req}
              </span>
            ))}
            {task.requirements.length > 3 && (
              <span className="text-[10px] text-gray-500">
                +{task.requirements.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags.slice(0, 5).map((tag, index) => (
          <span
            key={index}
            className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 rounded text-blue-400"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <DollarSign size={12} />
            <span>{formatBudget(task.budget)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Timer size={12} />
            <span>{task.estimatedDuration}分钟</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          <span className={isExpired ? 'text-red-400' : ''}>
            {getTimeLeft(task.deadline)}
          </span>
        </div>
      </div>

      {/* Publisher */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Users size={12} className="text-white" />
          </div>
          <span className="text-xs text-gray-400">{task.publisherName}</span>
        </div>
        <div className="text-[10px] text-gray-500">
          发布：{formatDate(task.createdAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isExpired && !isAccepted && (
          <button
            onClick={() => onAccept?.(task)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Zap size={12} />
            立即接单
          </button>
        )}
        <button
          onClick={() => onViewDetail?.(task)}
          className={cn(
            'px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium rounded-lg transition-colors',
            isExpired || isAccepted ? 'flex-1' : ''
          )}
        >
          详情
        </button>
      </div>
    </div>
  );
};

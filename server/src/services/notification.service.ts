import schedule from "node-schedule";
import { logger } from "../utils/logger.js";
import { prisma } from "../config/db.js";

class NotificationService {
  private activeJobs: Map<string, schedule.Job> = new Map();

  constructor() {
    logger.info("Initializing Notification Service...");
    this.rescheduleAll();
  }

  private async rescheduleAll() {
    try {
      const now = new Date();
      const tasksToSchedule = await prisma.task.findMany({
        where: {
          completed: false,
          scheduledTime: { not: null },
        },
      });

      logger.info(`Found ${tasksToSchedule.length} active tasks with schedules to initialize.`);

      for (const task of tasksToSchedule) {
        if (task.scheduledTime) {
          const scheduleTime = new Date(task.scheduledTime);
          if (scheduleTime > now) {
            this.scheduleTaskNotification(task.id, task.title, scheduleTime, task.userId);
          }
        }
      }
    } catch (e) {
      logger.error("Failed to reschedule task notifications on startup: " + e);
    }
  }

  public scheduleTaskNotification(taskId: string, taskTitle: string, time: Date, userId: string) {
    this.cancelTaskNotification(taskId);

    const job = schedule.scheduleJob(time, async () => {
      logger.info(`[Notification Alert] User ${userId} task: "${taskTitle}" is scheduled now (${time})!`);
      try {
        logger.info(`Notification sent successfully to ${userId} for task ${taskId}`);
        this.activeJobs.delete(taskId);
      } catch (e) {
        logger.error(`Failed to process notification for task ${taskId}: ` + e);
      }
    });

    if (job) {
      this.activeJobs.set(taskId, job);
      logger.info(`Scheduled notification for task "${taskTitle}" at ${time.toISOString()}`);
    }
  }

  public cancelTaskNotification(taskId: string) {
    const job = this.activeJobs.get(taskId);
    if (job) {
      job.cancel();
      this.activeJobs.delete(taskId);
      logger.info(`Cancelled scheduled notification for task ID ${taskId}`);
    }
  }
}

export const notificationService = new NotificationService();
